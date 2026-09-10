/** Astral Valley / Koester sheet.
 *  Heights: USGS NED 10 m (24×26 control). Plan: Google satellite
 *  georeferenced to the Art Park pin 38.0232213, −90.4113088 at z17
 *  (~0.94 m/px). Square 10 m cells — proportions match the ground, not
 *  festival maps. Contours are exact 20-ft USGS, index 700/800/900.
 *  Grid +x east, +y south. North is −Z.
 */

export const COLS = 197;
export const ROWS = 200;
export const CELL_M = 10;
export const ORIGIN_LAT = 38.0315;
export const ORIGIN_LON = -90.4215;
export const SOUTH_LAT = 38.0135;
export const EAST_LON = -90.3990;
export const MAP_W_M = 1973;
export const MAP_H_M = 2004;
export const CONTOUR_FT = 20;

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

const DEM_C = 24;
const DEM_R = 26;
const DEM: number[] = [
  196.0, 195.5, 213.5, 216.3, 211.4, 228.3, 229.3, 211.8, 194.3, 185.2, 184.9, 192.0, 202.1, 216.9, 225.1, 229.1, 236.0, 245.7, 256.2, 237.2, 233.5, 231.8, 243.1, 240.7,
  192.1, 198.6, 213.3, 222.5, 220.1, 229.2, 224.4, 207.6, 194.2, 187.9, 186.4, 196.9, 209.5, 205.5, 213.0, 225.3, 230.2, 243.4, 250.8, 258.6, 242.4, 242.8, 257.9, 233.4,
  197.3, 208.6, 208.8, 223.0, 231.2, 223.0, 208.4, 197.1, 202.6, 189.8, 187.2, 190.9, 216.3, 226.1, 232.1, 241.3, 253.8, 260.7, 256.9, 267.4, 259.0, 252.2, 261.4, 238.7,
  205.2, 218.2, 214.8, 223.7, 235.1, 216.0, 203.3, 215.5, 211.9, 198.8, 188.0, 186.0, 206.2, 214.5, 217.0, 228.1, 244.9, 258.3, 256.7, 253.7, 259.9, 266.9, 261.3, 253.1,
  216.5, 232.6, 231.4, 230.1, 238.8, 217.7, 211.4, 225.5, 221.0, 207.4, 195.7, 186.6, 191.3, 204.0, 210.5, 218.0, 236.0, 245.7, 237.3, 234.2, 241.3, 253.5, 269.5, 273.2,
  231.3, 250.4, 247.1, 245.4, 240.7, 220.5, 223.0, 232.7, 227.3, 216.6, 196.9, 188.5, 199.6, 214.3, 225.8, 230.5, 239.9, 230.0, 212.5, 230.3, 245.8, 246.2, 250.1, 262.8,
  233.8, 249.0, 259.2, 259.2, 236.3, 226.9, 235.5, 236.0, 222.8, 207.4, 186.8, 191.9, 202.1, 216.9, 232.6, 239.6, 228.4, 216.5, 207.0, 213.1, 208.2, 210.8, 217.5, 248.1,
  218.6, 232.2, 248.6, 262.7, 248.4, 245.1, 242.3, 226.5, 210.5, 193.9, 189.9, 194.7, 207.3, 222.5, 236.6, 233.8, 215.5, 198.4, 200.7, 201.7, 200.2, 202.4, 210.7, 230.2,
  219.4, 234.2, 247.1, 264.4, 266.9, 258.7, 237.2, 220.0, 199.2, 193.6, 191.0, 199.2, 212.5, 229.7, 239.4, 230.6, 201.0, 197.9, 200.6, 211.0, 214.1, 202.7, 211.5, 235.2,
  216.1, 235.4, 257.8, 265.9, 268.2, 258.7, 234.2, 218.4, 202.6, 195.1, 191.7, 203.4, 216.9, 234.4, 241.0, 224.2, 197.8, 204.6, 220.9, 226.6, 221.3, 202.6, 210.1, 225.3,
  220.0, 241.1, 260.0, 261.5, 263.7, 261.0, 241.0, 226.9, 211.3, 194.3, 192.2, 200.2, 214.1, 228.0, 238.4, 222.2, 197.4, 214.1, 228.8, 234.9, 224.7, 204.3, 213.2, 225.8,
  229.4, 242.2, 254.7, 241.6, 242.6, 245.4, 234.0, 223.9, 209.0, 194.7, 189.5, 195.6, 205.7, 218.3, 225.6, 218.6, 195.5, 204.3, 221.9, 242.2, 227.9, 204.6, 214.5, 232.2,
  224.0, 237.9, 250.9, 245.6, 229.4, 227.0, 220.1, 208.7, 203.1, 196.4, 208.5, 192.8, 197.3, 208.7, 203.5, 203.5, 196.1, 200.4, 223.9, 240.1, 226.0, 205.5, 211.3, 227.9,
  217.9, 228.7, 247.4, 250.5, 239.4, 233.6, 232.0, 230.3, 207.4, 205.1, 220.4, 200.9, 193.6, 195.1, 196.4, 196.3, 195.1, 212.6, 233.8, 237.5, 218.4, 206.6, 206.8, 213.9,
  225.5, 231.1, 246.0, 250.7, 239.9, 234.9, 234.7, 236.9, 207.1, 207.7, 232.0, 231.6, 203.8, 193.6, 194.6, 194.1, 217.9, 234.0, 244.7, 234.8, 222.5, 223.6, 206.9, 219.4,
  220.0, 230.9, 241.3, 249.7, 237.7, 220.5, 221.1, 227.7, 208.0, 208.7, 234.7, 241.7, 243.0, 223.7, 229.6, 214.2, 219.4, 247.3, 242.2, 223.3, 234.3, 233.3, 208.1, 208.5,
  218.2, 225.1, 238.2, 245.5, 238.0, 227.3, 218.2, 211.7, 203.3, 202.4, 212.0, 225.0, 240.1, 250.7, 249.4, 235.1, 247.1, 250.2, 233.6, 243.1, 249.3, 239.7, 219.9, 207.8,
  217.7, 225.8, 231.4, 238.5, 229.7, 222.9, 215.1, 213.0, 216.2, 210.0, 204.4, 229.9, 239.0, 236.6, 254.7, 255.5, 256.9, 247.4, 243.4, 253.8, 257.4, 249.4, 228.5, 209.7,
  219.3, 224.7, 231.8, 239.0, 228.8, 217.2, 215.8, 221.7, 222.0, 214.3, 205.8, 222.3, 243.8, 255.5, 260.6, 267.6, 263.3, 244.5, 246.4, 258.4, 263.9, 251.1, 234.2, 219.1,
  222.2, 226.8, 235.5, 242.5, 229.2, 223.9, 222.7, 227.1, 224.2, 210.8, 214.2, 226.5, 236.0, 241.9, 253.6, 266.5, 263.4, 260.2, 248.6, 258.2, 267.9, 256.7, 242.5, 225.9,
  225.8, 236.8, 243.6, 248.0, 239.4, 233.8, 233.8, 230.9, 223.7, 211.6, 217.1, 220.1, 225.7, 230.6, 241.3, 253.8, 269.4, 265.0, 258.9, 269.9, 270.4, 253.4, 243.9, 229.9,
  226.8, 240.1, 254.3, 254.0, 253.4, 250.0, 241.2, 231.4, 222.2, 212.3, 221.4, 221.3, 222.0, 231.3, 235.9, 248.4, 266.6, 263.4, 271.1, 277.8, 277.1, 265.6, 256.6, 234.0,
  228.1, 237.1, 255.1, 263.0, 263.9, 253.1, 240.8, 229.1, 220.6, 212.7, 218.8, 230.5, 227.3, 234.2, 240.8, 257.4, 272.9, 265.2, 269.9, 276.7, 277.4, 275.0, 255.8, 234.7,
  230.0, 239.6, 252.0, 264.3, 262.3, 244.9, 232.1, 228.2, 217.6, 220.3, 229.4, 234.9, 238.2, 242.4, 243.8, 267.0, 279.3, 277.1, 273.3, 267.2, 265.9, 264.8, 255.3, 237.9,
  230.0, 238.8, 250.7, 262.6, 261.1, 241.2, 231.3, 223.2, 216.9, 226.1, 233.0, 239.4, 247.8, 253.9, 263.3, 272.8, 277.9, 271.7, 265.2, 256.3, 253.9, 251.7, 246.5, 236.3,
  230.5, 237.8, 246.3, 260.2, 265.5, 250.8, 234.1, 224.0, 218.8, 220.0, 227.9, 235.5, 243.4, 254.7, 264.3, 273.1, 270.1, 263.7, 256.1, 246.8, 237.5, 236.6, 233.9, 228.4
];

export function llToGrid(lat: number, lon: number): Pt {
  const x = ((lon - ORIGIN_LON) / (EAST_LON - ORIGIN_LON)) * (COLS - 1);
  const y = ((ORIGIN_LAT - lat) / (ORIGIN_LAT - SOUTH_LAT)) * (ROWS - 1);
  return [x, y];
}

function hash(ix: number, iy: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function noise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0);
  const b = hash(x0 + 1, y0);
  const c = hash(x0, y0 + 1);
  const d = hash(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function demAt(c: number, r: number) {
  return DEM[Math.max(0, Math.min(DEM_R - 1, r)) * DEM_C + Math.max(0, Math.min(DEM_C - 1, c))];
}
function demBilinear(i: number, j: number) {
  const u = (i / (COLS - 1)) * (DEM_C - 1);
  const v = (j / (ROWS - 1)) * (DEM_R - 1);
  const c0 = Math.floor(u);
  const r0 = Math.floor(v);
  const fu = u - c0;
  const fv = v - r0;
  return (
    demAt(c0, r0) * (1 - fu) * (1 - fv) +
    demAt(c0 + 1, r0) * fu * (1 - fv) +
    demAt(c0, r0 + 1) * (1 - fu) * fv +
    demAt(c0 + 1, r0 + 1) * fu * fv
  );
}
function distSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  let t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
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

/** Satellite-traced (Google z17, pin = Art Park). Distances in metres. */
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

function snapDrain(lat: number, lon: number): Pt | null {
  const [x, y] = llToGrid(lat, lon);
  let best: Pt = [x, y];
  let bz = demBilinear(x, y);
  for (let dy = -12; dy <= 12; dy++) {
    for (let dx = -10; dx <= 10; dx++) {
      const z = demBilinear(x + dx, y + dy);
      if (z < bz) {
        bz = z;
        best = [x + dx, y + dy];
      }
    }
  }
  if (bz > 216) return null;
  return best;
}

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

export const CREEK: Pt[] = CREEK_SEED.map(([la, lo]) => snapDrain(la, lo)).filter((p): p is Pt => p !== null);

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

function mixZ(h: number, target: number, w: number) {
  const k = Math.max(0, Math.min(1, w));
  return h * (1 - k) + target * k;
}

function buildHeight(): Float32Array {
  const h = new Float32Array(COLS * ROWS);
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      let z = demBilinear(i, j) + (noise(i * 0.35, j * 0.35) - 0.5) * 0.6;
      const star = inEllipse(i, j, STAR_C[0], STAR_C[1], 16, 19);
      const valley = inEllipse(i, j, FIELD[0] - 1, FIELD[1] - 2, 28, 18);
      if (star >= 1) z = mixZ(z, 210.6, Math.max(0, 1 - valley) * 0.9);
      z = mixZ(z, 239.3, Math.max(0, 1 - star) ** 0.55);
      const dc = distPoly(i, j, CREEK);
      if (dc < 2.4 && z < 218) {
        const w = Math.exp(-(dc * dc) / (2 * 1.15 * 1.15));
        z = mixZ(z, Math.min(z, 206.4), w);
      }
      h[j * COLS + i] = z;
    }
  }
  return h;
}

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

export const HEIGHT = buildHeight();
export const COVER = buildCover(HEIGHT);

export function elev(i: number, j: number) {
  return HEIGHT[Math.max(0, Math.min(ROWS - 1, j | 0)) * COLS + Math.max(0, Math.min(COLS - 1, i | 0))];
}
export function elevBilinear(x: number, y: number) {
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
  for (let ft = 620; ft <= 920; ft += 20) {
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
  { ft: 785, lat: 38.02574, lon: -90.4078, label: "785 ft" },
  { ft: 885, lat: 38.02515, lon: -90.4176, label: "885 ft" },
  { ft: 920, lat: 38.02862, lon: -90.3992, label: "920 ft" },
  { ft: 922, lat: 38.01494, lon: -90.4035, label: "922 ft" },
  { ft: 824, lat: 38.0279, lon: -90.4205, label: "824 ft" },
];

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
