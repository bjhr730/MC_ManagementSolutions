/**
 * Builds the Northern Virginia service-area map from real county boundaries.
 *
 * Source: the US Census cartographic county boundaries (500k), as published in
 * the plotly/datasets mirror, keyed by state+county FIPS. Run this only when
 * the service areas in src/config/site.ts change; the output is committed, so
 * a normal build never touches the network.
 *
 *   node scripts/prepare-service-map.mjs            # downloads to a temp file
 *   node scripts/prepare-service-map.mjs <path>     # uses a local copy
 *
 * Virginia's independent cities are separate FIPS entities carved out of the
 * surrounding county, so Fairfax County's polygon has holes where Fairfax City
 * and Falls Church sit. Antonio serves those cities, so they are grouped into
 * the county they sit in rather than drawn as gaps in the middle of the map.
 */
import { writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SOURCE =
  'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';

/** Grouped to match SERVICE_AREAS in src/config/site.ts, in the same order. */
const GROUPS = [
  { id: 'arlington', label: 'Arlington', fips: ['51013'] },
  { id: 'alexandria', label: 'Alexandria', fips: ['51510'] },
  // 51600 Fairfax City and 51610 Falls Church are enclaves inside the county.
  { id: 'fairfax', label: 'Fairfax', fips: ['51059', '51600', '51610'] },
  { id: 'loudoun', label: 'Loudoun', fips: ['51107'] },
  // 51683 Manassas and 51685 Manassas Park are enclaves inside the county.
  { id: 'prince-william', label: 'Prince William', fips: ['51153', '51683', '51685'] },
];

/** Drawn muted, purely so the shape is recognisable as this region. */
const CONTEXT = [{ id: 'dc', label: 'Washington, D.C.', fips: ['11001'] }];

const WIDTH = 1000;
const PAD = 14;
/** Douglas-Peucker tolerance, in viewBox units. ~0.6px of visible detail. */
const TOLERANCE = 0.6;

function ringsOf(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
  throw new Error(`Unexpected geometry ${geometry.type}`);
}

/** Perpendicular distance from p to the segment ab. */
function segmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplify(points, tolerance) {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = segmentDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

/** True when the point is inside the ring (even-odd ray cast). */
function inRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > point[1] !== yj > point[1]) {
      const x = ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
      if (point[0] < x) inside = !inside;
    }
  }
  return inside;
}

function minEdgeDistance(point, rings) {
  let best = Infinity;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const d = segmentDistance(point, ring[j], ring[i]);
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * Where to put the label: the point furthest from any edge, found on a grid.
 *
 * Not the centroid. Fairfax County wraps around Fairfax City and Falls Church,
 * so its centroid lands in a hole and the label would sit outside the shape.
 */
function labelPoint(rings) {
  const all = rings.flat();
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  let best = null;
  let bestScore = -Infinity;
  const STEPS = 48;
  for (let i = 1; i < STEPS; i += 1) {
    for (let j = 1; j < STEPS; j += 1) {
      const p = [
        minX + ((maxX - minX) * i) / STEPS,
        minY + ((maxY - minY) * j) / STEPS,
      ];
      // Odd number of containing rings = inside the shape, not in a hole.
      const hits = rings.filter((ring) => inRing(p, ring)).length;
      if (hits % 2 === 0) continue;
      const score = minEdgeDistance(p, rings);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
  }
  return { point: best, clearance: bestScore };
}

const round = (n) => Math.round(n * 10) / 10;

async function loadSource() {
  const local = process.argv[2];
  if (local) return JSON.parse(await readFile(local, 'utf8'));

  const cache = join(tmpdir(), 'geojson-counties-fips.json');
  try {
    return JSON.parse(await readFile(cache, 'utf8'));
  } catch {
    process.stdout.write('Downloading county boundaries...\n');
    const res = await fetch(SOURCE);
    if (!res.ok) throw new Error(`${res.status} fetching boundaries`);
    const text = await res.text();
    await writeFile(cache, text);
    return JSON.parse(text);
  }
}

const data = await loadSource();
const byFips = new Map(data.features.map((f) => [f.id, f]));

const all = [...GROUPS, ...CONTEXT].map((group) => {
  const rings = group.fips.flatMap((fips) => {
    const feature = byFips.get(fips);
    if (!feature) throw new Error(`FIPS ${fips} missing from the source data`);
    return ringsOf(feature.geometry);
  });
  return { ...group, rings };
});

// Equirectangular, x corrected by cos(lat) at the middle of the region. Over
// 60 miles the distortion of a proper conic is under a pixel, and this keeps
// the output readable and dependency-free.
const everyPoint = all.flatMap((g) => g.rings.flat());
const lats = everyPoint.map((p) => p[1]);
const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
const k = Math.cos((lat0 * Math.PI) / 180);

const projected = all.map((g) => ({
  ...g,
  rings: g.rings.map((ring) => ring.map(([lon, lat]) => [lon * k, -lat])),
}));

const flat = projected.flatMap((g) => g.rings.flat());
const minX = Math.min(...flat.map((p) => p[0]));
const maxX = Math.max(...flat.map((p) => p[0]));
const minY = Math.min(...flat.map((p) => p[1]));
const maxY = Math.max(...flat.map((p) => p[1]));

const scale = (WIDTH - PAD * 2) / (maxX - minX);
const height = Math.round((maxY - minY) * scale + PAD * 2);

const toView = ([x, y]) => [
  (x - minX) * scale + PAD,
  (y - minY) * scale + PAD,
];

const shaped = projected.map((g) => {
  const rings = g.rings
    .map((ring) => simplify(ring.map(toView), TOLERANCE))
    .filter((ring) => ring.length > 2);
  const d = rings
    .map(
      (ring) =>
        `M${ring.map(([x, y]) => `${round(x)},${round(y)}`).join('L')}Z`
    )
    .join('');
  const { point, clearance } = labelPoint(rings);
  return {
    id: g.id,
    label: g.label,
    d,
    label_x: point ? round(point[0]) : null,
    label_y: point ? round(point[1]) : null,
    clearance: round(clearance),
  };
});

const served = shaped.filter((s) => GROUPS.some((g) => g.id === s.id));
const context = shaped.filter((s) => CONTEXT.some((g) => g.id === s.id));

const body = `// Generated by scripts/prepare-service-map.mjs. Do not edit by hand.
// Source: US Census cartographic county boundaries (500k), FIPS-keyed.
//
// Projection is equirectangular with x scaled by cos(${round(lat0)}deg), the
// middle latitude of the region, so the shapes are not stretched.

export interface MapArea {
  readonly id: string;
  readonly label: string;
  /** SVG path data in the viewBox below. */
  readonly d: string;
  /** Furthest-from-any-edge point, for the label. */
  readonly labelX: number;
  readonly labelY: number;
}

export const MAP_VIEWBOX = '0 0 ${WIDTH} ${height}';
export const MAP_WIDTH = ${WIDTH};
export const MAP_HEIGHT = ${height};

/** The jurisdictions Antonio manages in, drawn as the filled shapes. */
export const MAP_SERVED: readonly MapArea[] = ${JSON.stringify(
  served.map(({ id, label, d, label_x, label_y }) => ({
    id,
    label,
    d,
    labelX: label_x,
    labelY: label_y,
  })),
  null,
  2
)};

/** Drawn muted, only so the region is recognisable. Not a service area. */
export const MAP_CONTEXT: readonly MapArea[] = ${JSON.stringify(
  context.map(({ id, label, d, label_x, label_y }) => ({
    id,
    label,
    d,
    labelX: label_x,
    labelY: label_y,
  })),
  null,
  2
)};
`;

const out = new URL('../src/data/service-area-map.ts', import.meta.url);
await writeFile(out, body);

process.stdout.write(`viewBox 0 0 ${WIDTH} ${height}\n`);
for (const s of shaped) {
  process.stdout.write(
    `  ${s.id.padEnd(16)} ${String(s.d.length).padStart(6)} chars  label ${s.label_x},${s.label_y} clearance ${s.clearance}\n`
  );
}
process.stdout.write(`Wrote ${out.pathname}\n`);
