/** Immutable USGS bare-earth surface. Grid x=east, y=south, units=10m.
 * Site vectors are source-informed estimates; no surveyed occupancy or mount permissions.
 */
import proj4 from "proj4";
import terrainData from "../../public/data/terrain.json";
import { SITE_POINTS, SITE_CLEARINGS, SITE_ROADS, SITE_CREEK, SITE_STAGE_FOOTPRINT, inSitePolygon } from "./site-features";
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
/** Creek corridor interpreted from the official map and aerial canopy/valley shape.
 * Its uncertain centreline is a visual feature; it is not a certified open-water mask.
 */
export const CREEK: Pt[] = SITE_CREEK;

function buildCover(): Uint8Array {
  const c = new Uint8Array(COLS * ROWS);
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const idx = j * COLS + i;
      // Only visible clearing polygons remove the default assumed forest loss.
      // Wooded event-use polygons (Harmony/Family) do not imply open land cover.
      c[idx] = SITE_CLEARINGS.some((p) => inSitePolygon(i, j, p)) ? 0 : 1;
      if (SITE_ROADS.some((p) => distPoly(i, j, p) < 0.25)) c[idx] = 3;
      if (inSitePolygon(i, j, SITE_STAGE_FOOTPRINT)) c[idx] = 4;
    }
  }
  return c;
}

export const COVER = buildCover();

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
  ...SITE_POINTS.map((p) => ({ id: p.id, label: p.label, x: p.x, y: p.y,
    kind: p.kind as Poi["kind"], note: p.note })),
  ...([
    { id: "boulders", label: "Stage Right Boulders", lat: 38.02206, lon: -90.40534,
      note: "Published climbing-area pin: https://www.mountainproject.com/area/125747997/stage-right-boulders . Not surveyed; mounting/access permission unverified." },
    { id: "westHigh", label: "West ridge", lat: 38.02515, lon: -90.4176,
      note: "Topographic reference sampled from USGS DEM; no venue occupancy or installation permission established." },
    { id: "southHigh", label: "South ridge", lat: 38.01494, lon: -90.4035,
      note: "Topographic reference sampled from USGS DEM; no venue occupancy or installation permission established." },
  ].map((p) => { const [x, y] = llToGrid(p.lat, p.lon); return { id: p.id, label: p.label, x, y,
    kind: "ridge" as const, note: p.note }; })),
];
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
