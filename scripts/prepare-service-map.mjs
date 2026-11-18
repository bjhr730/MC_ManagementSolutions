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

/**
 * Grouped to match SERVICE_AREAS in src/config/site.ts, in the same order.
 *
 * `callout: true` moves the label out into the right-hand gutter on a leader
 * line. Arlington and Alexandria are the two smallest jurisdictions on the
 * map - their largest inscribed circles are about 35 and 20 units across, so
 * a name set inside them would spill over three borders and collide with
 * each other. Everything else is labelled where it sits.
 */
const GROUPS = [
  { id: 'arlington', label: 'Arlington', fips: ['51013'], callout: true },
  { id: 'alexandria', label: 'Alexandria', fips: ['51510'], callout: true },
  // 51600 Fairfax City and 51610 Falls Church are enclaves inside the county.
  { id: 'fairfax', label: 'Fairfax', fips: ['51059', '51600', '51610'] },
  { id: 'loudoun', label: 'Loudoun', fips: ['51107'] },
  // 51683 Manassas and 51685 Manassas Park are enclaves inside the county.
  { id: 'prince-william', label: 'Prince William', fips: ['51153', '51683', '51685'] },
];

/** Drawn muted, purely so the shape is recognisable as this region. */
const CONTEXT = [{ id: 'dc', label: 'D.C.', fips: ['11001'] }];

/** Width given to the map itself. The gutter is added on top of this. */
const MAP_W = 1000;
/** Right-hand strip reserved for callout labels. */
const GUTTER = 250;
const PAD = 14;
/** Douglas-Peucker tolerance, in viewBox units. ~0.6px of visible detail. */
const TOLERANCE = 0.6;
/** Minimum vertical gap between two stacked callout labels. */
const CALLOUT_GAP = 54;

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

/** Twice the signed area. Negative means the ring winds the other way. */
function signedArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return sum;
}

/**
 * Every ring wound the same way, so a nonzero fill paints the group solid.
 *
 * The Census publishes Virginia's independent cities as separate entities cut
 * out of the surrounding county, so Fairfax County arrives with holes where
 * Fairfax City and Falls Church sit, and the city polygons arrive separately.
 * Left alone, the hole and the city cancel under a nonzero fill and the map
 * shows gaps in the middle of a county Antonio covers. Winding them all the
 * same way fills the group as one shape.
 */
function normalise(ring) {
  return signedArea(ring) < 0 ? [...ring].reverse() : ring;
}

/**
 * The rings that form the group's silhouette - those not contained in
 * another ring of the same group.
 *
 * Stroking every ring would outline each enclave city inside its county,
 * which at map size reads as specks of noise rather than as information.
 */
function outerRings(rings) {
  return rings.filter(
    (ring, i) =>
      !rings.some((other, j) => j !== i && inRing(ring[0], other))
  );
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

const scale = (MAP_W - PAD * 2) / (maxX - minX);
const height = Math.round((maxY - minY) * scale + PAD * 2);
const viewWidth = MAP_W + GUTTER;

const toView = ([x, y]) => [
  (x - minX) * scale + PAD,
  (y - minY) * scale + PAD,
];

const toPath = (rings) =>
  rings
    .map(
      (ring) =>
        `M${ring.map(([x, y]) => `${round(x)},${round(y)}`).join('L')}Z`
    )
    .join('');

const shaped = projected.map((g) => {
  const rings = g.rings
    .map((ring) => simplify(normalise(ring).map(toView), TOLERANCE))
    .filter((ring) => ring.length > 2);
  const { point, clearance } = labelPoint(rings);
  return {
    id: g.id,
    label: g.label,
    callout: Boolean(g.callout),
    d: toPath(rings),
    outline: toPath(outerRings(rings)),
    anchor: point,
    clearance: round(clearance),
  };
});

/*
  Callout labels are stacked down the gutter in the order they appear on the
  map, pushed apart where two would otherwise sit on top of each other.
  Arlington and Alexandria are about 60 units apart vertically, so without
  this their labels overlap exactly as they did before the gutter existed.
*/
const callouts = shaped.filter((s) => s.callout).sort((a, b) => a.anchor[1] - b.anchor[1]);
let lastY = -Infinity;
for (const area of callouts) {
  const y = Math.max(area.anchor[1], lastY + CALLOUT_GAP);
  area.calloutY = Math.min(y, height - 12);
  lastY = area.calloutY;
}

const LEADER_X = MAP_W + 16;

const shape = (s) => {
  const base = {
    id: s.id,
    label: s.label,
    d: s.d,
    outline: s.outline,
  };
  if (!s.callout) {
    return {
      ...base,
      labelX: round(s.anchor[0]),
      labelY: round(s.anchor[1]),
      leader: null,
      dotX: null,
      dotY: null,
    };
  }
  return {
    ...base,
    labelX: round(LEADER_X + 10),
    labelY: round(s.calloutY),
    leader: `M${round(s.anchor[0])},${round(s.anchor[1])}L${round(LEADER_X)},${round(s.calloutY)}`,
    dotX: round(s.anchor[0]),
    dotY: round(s.anchor[1]),
  };
};

const served = shaped.filter((s) => GROUPS.some((g) => g.id === s.id)).map(shape);
const context = shaped.filter((s) => CONTEXT.some((g) => g.id === s.id)).map(shape);

const body = `// Generated by scripts/prepare-service-map.mjs. Do not edit by hand.
// Source: US Census cartographic county boundaries (500k), FIPS-keyed.
//
// Projection is equirectangular with x scaled by cos(${round(lat0)}deg), the
// middle latitude of the region, so the shapes are not stretched.

export interface MapArea {
  readonly id: string;
  readonly label: string;
  /** Every ring, wound the same way. Fill this with fill-rule: nonzero. */
  readonly d: string;
  /** Silhouette only, with enclave cities left out. Stroke this. */
  readonly outline: string;
  /** Where the label goes, in viewBox units. */
  readonly labelX: number;
  readonly labelY: number;
  /** Set when the label sits in the gutter: the line joining it to the map. */
  readonly leader: string | null;
  /** The point on the map a leader line starts from. */
  readonly dotX: number | null;
  readonly dotY: number | null;
}

/** The whole canvas, map plus the callout gutter on the right. */
export const MAP_VIEWBOX = '0 0 ${viewWidth} ${height}';
export const MAP_WIDTH = ${viewWidth};
export const MAP_HEIGHT = ${height};
/** Where the map itself ends and the callout gutter begins. */
export const MAP_GUTTER_X = ${MAP_W};

/** The jurisdictions Antonio manages in, drawn as the filled shapes. */
export const MAP_SERVED: readonly MapArea[] = ${JSON.stringify(served, null, 2)};

/** Drawn muted, only so the region is recognisable. Not a service area. */
export const MAP_CONTEXT: readonly MapArea[] = ${JSON.stringify(context, null, 2)};
`;

const out = new URL('../src/data/service-area-map.ts', import.meta.url);
await writeFile(out, body);

process.stdout.write(`viewBox 0 0 ${viewWidth} ${height}\n`);
for (const s of shaped) {
  const where = s.callout ? `gutter y=${round(s.calloutY)}` : 'inside';
  process.stdout.write(
    `  ${s.id.padEnd(16)} fill ${String(s.d.length).padStart(5)} outline ${String(s.outline.length).padStart(5)}  ${where.padEnd(14)} clearance ${s.clearance}\n`
  );
}
process.stdout.write(`Wrote ${out.pathname}\n`);
