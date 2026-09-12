/** Immutable USGS bare-earth surface. Grid x=east, y=south, units=10m.
 * All legacy site vectors/land-cover masks are inferred and unverified.
 */
import proj4 from "proj4";
import terrainData from "../../public/data/terrain.json";
export const TERRAIN_METADATA = terrainData.metadata;
export const TERRAIN_VERSION = TERRAIN_METADATA.version;
export const COLS = TERRAIN_METADATA.cols;
export const ROWS = TERRAIN_METADATA.rows;
export const CELL_M = TERRAIN_METADATA.cellM;
export const MAP_W_M = (COLS - 1) * CELL_M;
export const MAP_H_M = (ROWS - 1) * CELL_M;
export const CONTOUR_FT = 20;
const CRS = "+proj=utm +zone=15 +datum=NAD83 +units=m +no_defs";
export const HEIGHT = new Float32Array(terrainData.heights);
export function llToGrid(lat: number, lon: number): [number, number] {
  const [e, n] = proj4("EPSG:4326", CRS, [lon, lat]);
  // Normalize sub-micrometre PROJ floating-point differences between Node and
  // browsers so coordinates serialized into SSR SVG attributes hydrate exactly.
  const stable = (value: number) => Number(value.toFixed(7));
  return [stable((e - TERRAIN_METADATA.westCenter) / CELL_M), stable((TERRAIN_METADATA.northCenter - n) / CELL_M)];
}
export function gridToLl(x: number, y: number): [number, number] {
  const [lon, lat] = proj4(CRS, "EPSG:4326", [TERRAIN_METADATA.westCenter + x * CELL_M, TERRAIN_METADATA.northCenter - y * CELL_M]);
  return [lat, lon];
}
export const [ORIGIN_LAT, ORIGIN_LON] = gridToLl(0, 0);
export const [SOUTH_LAT, EAST_LON] = gridToLl(COLS - 1, ROWS - 1);
export type Cover = "meadow" | "forest" | "water" | "road" | "stage";

export type Poi = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "stage" | "camp" | "amenity" | "ridge" | "gate" | "water";
  note: string;
};

export type Spot = { ft: number; lat: number; lon: number; label: string };
export type ElevLabel = { ft: number; x: number; y: number };

type Pt = [number, number];

function distSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function distPoly(px: number, py: number, pts: Pt[]) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  return d;
}
function inEllipse(px: number, py: number, cx: number, cy: number, rx: number, ry: number) {
  const u = (px - cx) / rx;
  const v = (py - cy) / ry;
  return u * u + v * v;
}

/** Legacy inferred locations; no independent ground control or surveyed boundary. */
const PIN = llToGrid(38.0232213, -90.4113088);
const STAR = llToGrid(38.02566, -90.4084);
const FIELD = llToGrid(38.02216, -90.40849);
const COSMIC = llToGrid(38.02185, -90.4087);
const EAST_MEADOW = llToGrid(38.02528, -90.40441);
const POND = llToGrid(38.02309, -90.41256);
const STAGE = llToGrid(38.02275, -90.41031);
const GATE = llToGrid(38.01877, -90.41235);
const PEAK785 = llToGrid(38.02574, -90.4078);
const STAR_C: Pt = [(STAR[0] + PEAK785[0]) / 2, (STAR[1] + PEAK785[1]) / 2];

const CREEK_SEED: [number, number][] = [
  [38.0314, -90.4132],
  [38.0290, -90.4130],
  [38.0264, -90.4134],
  [38.0240, -90.4135],
  [38.0224, -90.4130],
  [38.0212, -90.4114],
  [38.0206, -90.4094],
  [38.0205, -90.4074],
  [38.0212, -90.4056],
  [38.0230, -90.4046],
  [38.0250, -90.4044],
  [38.0262, -90.4032],
  [38.0246, -90.4006],
  [38.0218, -90.4002],
  [38.0186, -90.3996],
];

export const CREEK: Pt[] = CREEK_SEED.map(([la, lo]) => llToGrid(la, lo));

const SPRINGS: { c: Pt; r: number }[] = [
  { c: POND, r: 4.2 },
  { c: llToGrid(38.0206, -90.4074), r: 2.4 },
  { c: llToGrid(38.0254, -90.4044), r: 2.0 },
];

const ROAD: Pt[] = [
  GATE,
  llToGrid(38.0205, -90.412),
  PIN,
  STAGE,
  FIELD,
  COSMIC,
  llToGrid(38.02148, -90.4072),
];
const LOOP: Pt[] = [
  PIN,
  llToGrid(38.02402, -90.40977),
  STAR,
  llToGrid(38.02638, -90.4085),
  PEAK785,
  STAR,
];

function buildCover(_height: Float32Array): Uint8Array {
  const c = new Uint8Array(COLS * ROWS);
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const idx = j * COLS + i;
      const field = inEllipse(i, j, FIELD[0], FIELD[1], 22, 11);
      const star = inEllipse(i, j, STAR_C[0], STAR_C[1], 16, 19);
      const east = inEllipse(i, j, EAST_MEADOW[0], EAST_MEADOW[1], 12, 8);
      const lawn = inEllipse(i, j, PIN[0], PIN[1] + 3, 7, 8);
      if (field < 1 || star < 1 || east < 1 || lawn < 1) {
        c[idx] = 0;
        continue;
      }
      let spring = false;
      for (const s of SPRINGS) {
        if (Math.hypot(i - s.c[0], j - s.c[1]) < s.r) spring = true;
      }
      if (spring || distPoly(i, j, CREEK) < 1.25) {
        c[idx] = 2;
        continue;
      }
      if (distPoly(i, j, ROAD) < 1.0 || distPoly(i, j, LOOP) < 0.95) {
        c[idx] = 3;
        continue;
      }
      c[idx] = 1;
    }
  }
  for (let j = Math.floor(STAGE[1]) - 3; j <= Math.floor(STAGE[1]) + 3; j++) {
    for (let i = Math.floor(STAGE[0]) - 4; i <= Math.floor(STAGE[0]) + 5; i++) {
      if (i >= 0 && j >= 0 && i < COLS && j < ROWS) c[j * COLS + i] = 4;
    }
  }
  return c;
}

export const COVER = buildCover(HEIGHT);

export function elev(i: number, j: number) {
  if (!Number.isFinite(i) || !Number.isFinite(j) || i < 0 || j < 0 || i > COLS - 1 || j > ROWS - 1) return NaN;
  return HEIGHT[Math.floor(j) * COLS + Math.floor(i)];
}
export function elevBilinear(x: number, y: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > COLS - 1 || y > ROWS - 1) return NaN;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(COLS - 1, x0 + 1);
  const y1 = Math.min(ROWS - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  return elev(x0, y0) * (1 - fx) * (1 - fy) + elev(x1, y0) * fx * (1 - fy) + elev(x0, y1) * (1 - fx) * fy + elev(x1, y1) * fx * fy;
}
export function coverAt(i: number, j: number): Cover {
  return (["meadow", "forest", "water", "road", "stage"] as Cover[])[
    COVER[Math.max(0, Math.min(ROWS - 1, j | 0)) * COLS + Math.max(0, Math.min(COLS - 1, i | 0))]
  ];
}
export function creekXAt(j: number) {
  let best = CREEK[0][0];
  let bd = Infinity;
  for (const p of CREEK) {
    const d = Math.abs(p[1] - j);
    if (d < bd) {
      bd = d;
      best = p[0];
    }
  }
  return best / COLS;
}

const FT_M = 0.3048;

function marchLevel(level: number, dest: number[]) {
  const lerp = (za: number, zb: number) => (level - za) / (zb - za + 1e-9);
  for (let j = 0; j < ROWS - 1; j++) {
    for (let i = 0; i < COLS - 1; i++) {
      const a = HEIGHT[j * COLS + i];
      const b = HEIGHT[j * COLS + i + 1];
      const c = HEIGHT[(j + 1) * COLS + i + 1];
      const d = HEIGHT[(j + 1) * COLS + i];
      let idx = 0;
      if (a >= level) idx |= 1;
      if (b >= level) idx |= 2;
      if (c >= level) idx |= 4;
      if (d >= level) idx |= 8;
      if (idx === 0 || idx === 15) continue;
      const top: Pt = [i + lerp(a, b), j];
      const right: Pt = [i + 1, j + lerp(b, c)];
      const bot: Pt = [i + lerp(d, c), j + 1];
      const left: Pt = [i, j + lerp(a, d)];
      const add = (p: Pt, q: Pt) => dest.push(p[0], p[1], q[0], q[1]);
      switch (idx) {
        case 1: case 14: add(left, top); break;
        case 2: case 13: add(top, right); break;
        case 3: case 12: add(left, right); break;
        case 4: case 11: add(right, bot); break;
        case 5: add(left, top); add(right, bot); break;
        case 6: case 9: add(top, bot); break;
        case 7: case 8: add(left, bot); break;
        case 10: add(top, right); add(left, bot); break;
        default: break;
      }
    }
  }
}

function labelOn(ft: number): ElevLabel | null {
  const level = ft * FT_M;
  let best: ElevLabel | null = null;
  let bestScore = -1;
  for (let j = 24; j < ROWS - 24; j += 3) {
    for (let i = 24; i < COLS - 24; i += 3) {
      if (COVER[j * COLS + i] === 2) continue;
      const z = HEIGHT[j * COLS + i];
      const e = Math.abs(z - level);
      if (e > 1.4) continue;
      const score = 1 / (0.4 + e);
      if (score > bestScore) {
        bestScore = score;
        best = { ft, x: i, y: j };
      }
    }
  }
  return best;
}

export function contourSegs(): { minor: number[]; major: number[]; labels: ElevLabel[] } {
  const minor: number[] = [];
  const major: number[] = [];
  const labels: ElevLabel[] = [];
  for (let ft = Math.floor(minElev() / FT_M / 20) * 20; ft <= Math.ceil(maxElev() / FT_M / 20) * 20; ft += 20) {
    const level = ft * FT_M;
    marchLevel(level, ft % 100 === 0 ? major : minor);
    if (ft % 100 === 0) {
      const lab = labelOn(ft);
      if (lab) labels.push(lab);
    }
  }
  return { minor, major, labels };
}

export const SPOTS: Spot[] = [
  [38.02574, -90.4078], [38.02515, -90.4176], [38.02862, -90.3992], [38.01494, -90.4035], [38.0279, -90.4205]
].map(([lat, lon]) => {
  const [x, y] = llToGrid(lat, lon);
  const ft = Math.round(elevBilinear(x, y) / FT_M);
  return { lat, lon, ft, label: `${ft} ft (DEM)` };
});

export const POIS: Poi[] = [
  { id: "gate", label: "Front gate", x: GATE[0], y: GATE[1], kind: "gate",
    note: "Koester Springs Rd from the south. 503 m south of the lodge pin." },
  { id: "pin", label: "Lodge / buildings", x: PIN[0], y: PIN[1], kind: "amenity",
    note: "Google pin 38.02322, \u221290.41131. Building cluster west of the meadow." },
  { id: "stage", label: "Main Stage", x: STAGE[0], y: STAGE[1], kind: "stage",
    note: "Barn on the west edge of the Cosmic Reunion meadow, 102 m SE of the lodge. Faces east." },
  { id: "field", label: "Main Stage Field", x: FIELD[0], y: FIELD[1], kind: "camp",
    note: "Valley-floor meadow ~691 ft. Large, flat. Creek is the drain beside it, not on the hill." },
  { id: "star", label: "Stargazer camp", x: STAR_C[0], y: STAR_C[1], kind: "camp",
    note: "Huge flat hilltop ~785 ft. About 100 ft above the valley floor. 400 A runs up here." },
  { id: "grove", label: "Harmony Grove", x: llToGrid(38.02148, -90.4072)[0], y: llToGrid(38.02148, -90.4072)[1], kind: "camp",
    note: "Timber SE of the meadow toward the creek, 409 m from the lodge." },
  { id: "dream", label: "Dreamcatcher", x: llToGrid(38.02402, -90.40977)[0], y: llToGrid(38.02402, -90.40977)[1], kind: "camp",
    note: "Woods on the west shoulder of the knob, 161 m NNE of the lodge." },
  { id: "family", label: "Family camp", x: llToGrid(38.02097, -90.40656)[0], y: llToGrid(38.02097, -90.40656)[1], kind: "camp",
    note: "South creek bend, 486 m ESE of the lodge." },
  { id: "eastMeadow", label: "East meadow", x: EAST_MEADOW[0], y: EAST_MEADOW[1], kind: "camp",
    note: "Clearing inside the east arm of the U, 647 m ENE of the lodge." },
  { id: "pond", label: "West spring / pond", x: POND[0], y: POND[1], kind: "water",
    note: "Spring-fed pond west of Koester. One of three crystal springs that feed Plattin Creek." },
  { id: "springS", label: "South spring", x: llToGrid(38.0209, -90.4074)[0], y: llToGrid(38.0209, -90.4074)[1], kind: "water",
    note: "Spring along the south bend, creek-side of Family camp. Not in the meadow." },
  { id: "springE", label: "East spring", x: llToGrid(38.0256, -90.4047)[0], y: llToGrid(38.0256, -90.4047)[1], kind: "water",
    note: "Spring on the east arm of the U, by the east meadow." },
  { id: "boulders", label: "Stage Right", x: llToGrid(38.02206, -90.40534)[0], y: llToGrid(38.02206, -90.40534)[1], kind: "ridge",
    note: "Mountain Project 38.02206, \u221290.40534. Across the creek from the stage." },
  { id: "westHigh", label: "885 ft", x: llToGrid(38.02515, -90.4176)[0], y: llToGrid(38.02515, -90.4176)[1], kind: "ridge",
    note: "CalTopo 885 ft, west of the creek." },
  { id: "southHigh", label: "922 ft", x: llToGrid(38.01494, -90.4035)[0], y: llToGrid(38.01494, -90.4035)[1], kind: "ridge",
    note: "CalTopo 922 ft, SE of the U." },
];

for (const poi of POIS) {
  poi.note = "Inferred legacy location — unverified. " + (poi.kind === "ridge" ? "Elevation sampled from USGS DEM; installation access unknown." : "Site name retained from legacy plan; position, access and facilities need field confirmation.");
  if (poi.id === "westHigh") poi.label = "West ridge";
  if (poi.id === "southHigh") poi.label = "South ridge";
}
export const CAMPS = POIS.filter((p) => p.kind === "camp");

export function minElev() {
  let m = Infinity;
  for (let i = 0; i < HEIGHT.length; i++) if (HEIGHT[i] < m) m = HEIGHT[i];
  return m;
}
export function maxElev() {
  let m = -Infinity;
  for (let i = 0; i < HEIGHT.length; i++) if (HEIGHT[i] > m) m = HEIGHT[i];
  return m;
}
export const ELEV_MIN = minElev();
export const ELEV_MAX = maxElev();
