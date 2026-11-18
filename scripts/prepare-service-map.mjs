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

/**
 * The towns marked on the map, with the county each one must fall inside.
 *
 * Every one of these is checked against the county's own polygon below, so a
 * wrong coordinate fails the build rather than quietly drawing Leesburg in
 * Maryland. `rank` is label priority: when two labels would collide the
 * lower rank keeps its name and the other keeps just its dot.
 */
const PLACES = [
  { name: 'Leesburg', area: 'loudoun', lat: 39.1157, lon: -77.5636, rank: 1 },
  { name: 'Ashburn', area: 'loudoun', lat: 39.0437, lon: -77.4875, rank: 4 },
  { name: 'Sterling', area: 'loudoun', lat: 39.0062, lon: -77.4286, rank: 6 },
  { name: 'Herndon', area: 'fairfax', lat: 38.9696, lon: -77.3861, rank: 8 },
  { name: 'Reston', area: 'fairfax', lat: 38.9586, lon: -77.357, rank: 2 },
  { name: 'Chantilly', area: 'fairfax', lat: 38.8943, lon: -77.4311, rank: 12 },
  { name: 'Centreville', area: 'fairfax', lat: 38.8403, lon: -77.4289, rank: 11 },
  { name: 'Fairfax', area: 'fairfax', lat: 38.8462, lon: -77.3064, rank: 5 },
  { name: 'Vienna', area: 'fairfax', lat: 38.9012, lon: -77.2653, rank: 7 },
  { name: 'Tysons', area: 'fairfax', lat: 38.9187, lon: -77.2311, rank: 3 },
  { name: 'McLean', area: 'fairfax', lat: 38.9343, lon: -77.1775, rank: 9 },
  { name: 'Falls Church', area: 'fairfax', lat: 38.8823, lon: -77.1711, rank: 15 },
  { name: 'Burke', area: 'fairfax', lat: 38.7934, lon: -77.2717, rank: 14 },
  { name: 'Springfield', area: 'fairfax', lat: 38.7893, lon: -77.1872, rank: 10 },
  { name: 'Manassas', area: 'prince-william', lat: 38.7509, lon: -77.4753, rank: 13 },
  { name: 'Gainesville', area: 'prince-william', lat: 38.796, lon: -77.6136, rank: 17 },
  { name: 'Haymarket', area: 'prince-william', lat: 38.8121, lon: -77.6361, rank: 18 },
  // 38.6582 is often quoted for Woodbridge but lands just north of the
  // Occoquan, which is the Fairfax line. The CDP centre is further south.
  { name: 'Woodbridge', area: 'prince-william', lat: 38.6409, lon: -77.2497, rank: 16 },
];

/**
 * Named in SERVICE_AREAS but deliberately not marked.
 *
 * These are neighbourhoods inside Arlington, which is about 35 units across
 * on this map. Five dots inside it would merge into one smudge and say less
 * than the single Arlington callout already does. They stay in the list
 * beside the map, which is where that detail belongs.
 */
const NOT_MAPPED = new Set([
  'Rosslyn',
  'Clarendon',
  'Ballston',
  'Crystal City',
  'Arlington',
]);

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
    /** Kept so each town can be checked against its county's own polygon. */
    rings,
    anchor: point,
    clearance: round(clearance),
    /** Filled in below, for the areas whose label goes in the gutter. */
    calloutY: null,
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

/*
  Towns.

  Each one is projected the same way as the boundaries and then checked
  against its county's rings. An odd number of containing rings means the
  point is inside the county and not in one of the holes an independent city
  leaves behind - so Fairfax City and Falls Church count as inside Fairfax
  County, which is how Antonio sells them.
*/
const byId = new Map(shaped.map((s) => [s.id, s]));

const placed = PLACES.map((place) => {
  const point = toView([place.lon * k, -place.lat]);
  const county = byId.get(place.area);
  if (!county) throw new Error(`${place.name}: no area "${place.area}"`);
  const hits = county.rings.filter((ring) => inRing(point, ring)).length;
  if (hits % 2 === 0) {
    const landedIn = shaped
      .filter((s) => s.rings.filter((r) => inRing(point, r)).length % 2 === 1)
      .map((s) => s.id);
    const away = round(minEdgeDistance(point, county.rings));
    throw new Error(
      `${place.name} (${place.lat}, ${place.lon}) is not inside ${place.area}.\n` +
        `  It falls ${landedIn.length ? `inside ${landedIn.join(', ')}` : 'outside every mapped area'}, ` +
        `${away} units from the nearest ${place.area} edge (the map is ${viewWidth} wide).\n` +
        `  Fix the coordinate - do not relax this check, it is the only thing ` +
        `stopping a town being drawn in the wrong county.`
    );
  }
  return { ...place, x: point[0], y: point[1] };
});

/*
  Label layout.

  Reference sizes are the viewBox units a label occupies when the map is
  drawn at its desktop width, which is where labels are shown at all; below
  40rem the stylesheet hides them and leaves the dots. A town takes the
  first of right / left / above / below that hits nothing already placed,
  and if all four collide it keeps its dot and loses its name.
*/
const PLACE_FONT = 20.5;
const COUNTY_FONT = 26;
const CHAR = 0.53;
const GAP = 11;

const boxAt = (text, font, cx, cy, align, lines = 1) => {
  const w = text.length * CHAR * font;
  const h = font * 1.2 * lines;
  const left = align === 'start' ? cx : align === 'end' ? cx - w : cx - w / 2;
  return { x0: left, y0: cy - h / 2, x1: left + w, y1: cy + h / 2 };
};

const overlaps = (a, b) =>
  a.x0 < b.x1 + 4 && b.x0 < a.x1 + 4 && a.y0 < b.y1 + 4 && b.y0 < a.y1 + 4;

// County and callout labels are already committed, so towns work around them.
const taken = [...served, ...context].map((area) => {
  const lines = area.label.includes(' ') && !area.leader ? 2 : 1;
  const align = area.leader ? 'start' : 'middle';
  const text = lines === 2 ? area.label.split(' ').pop() : area.label;
  return boxAt(text, COUNTY_FONT, area.labelX, area.labelY, align, lines);
});

const labelledPlaces = [];
for (const place of [...placed].sort((a, b) => a.rank - b.rank)) {
  /*
    A town that shares its county's name keeps its dot and loses its label.
    The City of Fairfax sits at the heart of Fairfax County, so labelling
    both put the word "Fairfax" on the map twice, a centimetre apart, in
    two different sizes - which reads as a mistake rather than as two real
    places. The county label already marks the spot.
  */
  if (place.name === byId.get(place.area).label) {
    labelledPlaces.push({ ...place, fit: null });
    continue;
  }
  const options = [
    { align: 'start', cx: place.x + GAP, cy: place.y },
    { align: 'end', cx: place.x - GAP, cy: place.y },
    { align: 'middle', cx: place.x, cy: place.y - GAP - PLACE_FONT * 0.6 },
    { align: 'middle', cx: place.x, cy: place.y + GAP + PLACE_FONT * 0.6 },
  ];
  const fit = options.find((option) => {
    const box = boxAt(place.name, PLACE_FONT, option.cx, option.cy, option.align);
    if (box.x0 < 2 || box.x1 > viewWidth - 2) return false;
    if (box.y0 < 2 || box.y1 > height - 2) return false;
    return !taken.some((other) => overlaps(box, other));
  });
  if (fit) {
    taken.push(boxAt(place.name, PLACE_FONT, fit.cx, fit.cy, fit.align));
  }
  labelledPlaces.push({ ...place, fit: fit ?? null });
}

const places = placed.map((place) => {
  const entry = labelledPlaces.find((p) => p.name === place.name);
  const fit = entry.fit;
  return {
    id: place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: place.name,
    area: place.area,
    x: round(place.x),
    y: round(place.y),
    labelled: Boolean(fit),
    labelX: fit ? round(fit.cx) : null,
    labelY: fit ? round(fit.cy) : null,
    align: fit ? fit.align : null,
  };
});

/*
  A cross-check against the list the page actually prints, so the map and
  SERVICE_AREAS cannot drift apart silently. Warn rather than fail: adding a
  town to the config should not break someone else's build, it should tell
  them this script needs a coordinate.
*/
const siteSrc = await readFile(
  new URL('../src/config/site.ts', import.meta.url),
  'utf8'
);
const areasBlock = siteSrc.slice(
  siteSrc.indexOf('export const SERVICE_AREAS'),
  siteSrc.indexOf('/** Flat county list')
);
const listed = new Set(
  [...areasBlock.matchAll(/'([^']+)'/g)]
    .map((m) => m[1])
    .filter((value) => !value.includes(' County') && !value.startsWith('City of'))
    .filter((value) => !value.includes('surrounding'))
);
const known = new Set([...PLACES.map((p) => p.name), ...NOT_MAPPED]);
const missing = [...listed].filter((name) => !known.has(name));
const extra = PLACES.map((p) => p.name).filter((name) => !listed.has(name));

/*
  The page links each list entry to its county by slugging the county name.
  That only works while the slug matches the id used here, so the contract
  is checked rather than trusted: get it wrong and hovering "Loudoun County"
  would light up nothing, silently.
*/
const slug = (county) =>
  county
    .replace(/^City of /, '')
    .replace(/ County$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const countyNames = [...areasBlock.matchAll(/county: '([^']+)'/g)].map((m) => m[1]);
for (const name of countyNames) {
  if (!GROUPS.some((group) => group.id === slug(name))) {
    throw new Error(
      `SERVICE_AREAS has "${name}", which slugs to "${slug(name)}", and no ` +
        `group here has that id. The list and the map would stop linking up.`
    );
  }
}
if (countyNames.length !== GROUPS.length) {
  throw new Error(
    `SERVICE_AREAS has ${countyNames.length} counties, the map has ${GROUPS.length}.`
  );
}

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

export interface MapPlace {
  readonly id: string;
  readonly name: string;
  /** The id of the MAP_SERVED area this town sits in - checked at build. */
  readonly area: string;
  readonly x: number;
  readonly y: number;
  /** False when every candidate position collided; it keeps its dot only. */
  readonly labelled: boolean;
  readonly labelX: number | null;
  readonly labelY: number | null;
  readonly align: 'start' | 'middle' | 'end' | null;
}

/** Towns inside the service area, each verified to fall in its county. */
export const MAP_PLACES: readonly MapPlace[] = ${JSON.stringify(places, null, 2)};
`;

const out = new URL('../src/data/service-area-map.ts', import.meta.url);
await writeFile(out, body);

/*
  The positions go into a real stylesheet, not a style attribute on each
  label.

  The site sends a strict Content-Security-Policy - `style-src 'self'` plus
  hashes, with no 'unsafe-inline' - so the browser drops inline style
  attributes entirely. The dev server sends no CSP, so positioned-by-attribute
  labels look perfect locally and then land in a heap in the top-left corner
  of the deployed page. That is exactly how this shipped the first time.
  Hashes do not help: they cover <style> elements, not attributes.
*/
const px = (value) => `${((value / viewWidth) * 100).toFixed(3)}%`;
const py = (value) => `${((value / height) * 100).toFixed(3)}%`;

const rules = [...served, ...context].flatMap((area) => {
  const lines = [
    `.service-map-label[data-area='${area.id}'] { left: ${px(area.labelX)}; top: ${py(area.labelY)}; }`,
  ];
  if (area.dotX !== null) {
    lines.push(
      `.service-map-dot[data-area='${area.id}'] { left: ${px(area.dotX)}; top: ${py(area.dotY)}; }`
    );
  }
  return lines;
});

const SHIFT = { start: '0', middle: '-50%', end: '-100%' };

const placeRules = places.flatMap((place) => {
  const lines = [
    `.service-map-place[data-place='${place.id}'] { left: ${px(place.x)}; top: ${py(place.y)}; }`,
  ];
  if (place.labelled) {
    lines.push(
      `.service-map-place-label[data-place='${place.id}'] { left: ${px(place.labelX)}; top: ${py(place.labelY)}; transform: translate(${SHIFT[place.align]}, -50%); }`
    );
  }
  return lines;
});

/*
  Hovering a county on the map lights its entry in the list, and hovering an
  entry lights the county - :has() in both directions, no JavaScript.

  This is decoration: every name and place it can highlight is already
  printed in the list, so nothing here is information available only on
  hover. That is also why the shapes take no tab stop - seven focusable
  regions that do nothing when activated would be worse for a keyboard than
  the list they duplicate.
*/
const linkRules = GROUPS.flatMap((group) => {
  const id = group.id;
  return [
    `.service-map-group:has(.service-area-item[data-county='${id}']:hover) .service-map-fill[data-area='${id}'],`,
    `.service-map-fill[data-area='${id}']:hover { fill: var(--color-surface-3); }`,
    `.service-map-group:has(.service-map-fill[data-area='${id}']:hover) .service-map-place[data-area='${id}'],`,
    `.service-map-group:has(.service-area-item[data-county='${id}']:hover) .service-map-place[data-area='${id}'] { transform: translate(-50%, -50%) scale(1.6); }`,
    `.service-map-group:has(.service-map-fill[data-area='${id}']:hover) .service-area-item[data-county='${id}'] .service-area-county,`,
    `.service-area-item[data-county='${id}']:hover .service-area-county { color: var(--color-accent); }`,
  ];
});

const css = `/* Generated by scripts/prepare-service-map.mjs. Do not edit by hand. */
/*
  Where each label and callout dot sits, as a percentage of the canvas.

  These are in a stylesheet rather than on a style attribute because the
  site's Content-Security-Policy has no 'unsafe-inline', so style attributes
  never apply in production - only in dev, where there is no CSP to enforce.
*/
.service-map-canvas {
  aspect-ratio: ${viewWidth} / ${height};
}

${rules.join('\n')}

/* Towns: the dot, and the name where one fitted without colliding. */
${placeRules.join('\n')}

/* Map and list, pointing at each other. Decoration only - see the note in
   the generator; nothing here is information the list does not print. */
${linkRules.join('\n')}
`;

const cssOut = new URL('../src/styles/service-area-map.css', import.meta.url);
await writeFile(cssOut, css);

process.stdout.write(`viewBox 0 0 ${viewWidth} ${height}\n`);
for (const s of shaped) {
  const where = s.callout ? `gutter y=${round(s.calloutY)}` : 'inside';
  process.stdout.write(
    `  ${s.id.padEnd(16)} fill ${String(s.d.length).padStart(5)} outline ${String(s.outline.length).padStart(5)}  ${where.padEnd(14)} clearance ${s.clearance}\n`
  );
}
const named = places.filter((p) => p.labelled);
process.stdout.write(
  `\n  ${places.length} towns, all inside their county. ` +
    `${named.length} labelled, ${places.length - named.length} dot only` +
    (named.length === places.length
      ? '\n'
      : `: ${places.filter((p) => !p.labelled).map((p) => p.name).join(', ')}\n`)
);
if (missing.length) {
  process.stdout.write(
    `  WARNING: in SERVICE_AREAS but not on the map (needs a coordinate here): ${missing.join(', ')}\n`
  );
}
if (extra.length) {
  process.stdout.write(
    `  WARNING: mapped but no longer in SERVICE_AREAS: ${extra.join(', ')}\n`
  );
}

process.stdout.write(`Wrote ${out.pathname}\n`);
process.stdout.write(`Wrote ${cssOut.pathname}\n`);
