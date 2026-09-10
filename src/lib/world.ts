import type { Heat } from "./radio";
import {
  CELL_M,
  COLS,
  COVER,
  ELEV_MAX,
  ELEV_MIN,
  HEIGHT,
  ROWS,
  elevBilinear,
} from "./terrain";

/** 1 wu = 10 m. VERT 0.26 so the 100 ft Stargazer climb and valley walls read. */
export const VERT = 0.26;

export function gridToWorld(x: number, y: number): [number, number, number] {
  const wx = x - COLS / 2;
  const wz = y - ROWS / 2;
  const wy = (elevBilinear(x, y) - ELEV_MIN) * VERT;
  return [wx, wy, wz];
}

export function worldToGrid(wx: number, wz: number) {
  return { x: wx + COLS / 2, y: wz + ROWS / 2 };
}

function hillshade(i: number, j: number) {
  const z = HEIGHT[j * COLS + i];
  const zx = i < COLS - 1 ? HEIGHT[j * COLS + i + 1] : z;
  const zy = j < ROWS - 1 ? HEIGHT[(j + 1) * COLS + i] : z;
  const nx = z - zx;
  const ny = z - zy;
  return Math.max(0.62, Math.min(1.18, (nx * 0.35 + ny * 0.65 + 1.15) / 1.65));
}

function landColor(i: number, j: number): [number, number, number] {
  const z = HEIGHT[j * COLS + i];
  const t = (z - ELEV_MIN) / (ELEV_MAX - ELEV_MIN);
  const sh = hillshade(i, j);
  const cover = COVER[j * COLS + i];
  let r = 0.78;
  let g = 0.7;
  let b = 0.58;
  if (cover === 0) {
    r = 0.86 + t * 0.04;
    g = 0.8 + t * 0.02;
    b = 0.62;
  } else if (cover === 1) {
    r = 0.62 + t * 0.1;
    g = 0.56 + t * 0.08;
    b = 0.44 + t * 0.04;
  } else if (cover === 2) {
    r = 0.45;
    g = 0.62;
    b = 0.7;
  } else if (cover === 3) {
    r = 0.9;
    g = 0.86;
    b = 0.76;
  } else {
    r = 0.55;
    g = 0.5;
    b = 0.42;
  }
  return [r * sh, g * sh, b * sh];
}

export function buildTerrainBuffers() {
  const vcount = COLS * ROWS;
  const positions = new Float32Array(vcount * 3);
  const colors = new Float32Array(vcount * 3);
  const indices = new Uint32Array((COLS - 1) * (ROWS - 1) * 6);
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const idx = j * COLS + i;
      let [wx, wy, wz] = gridToWorld(i, j);
      if (COVER[idx] === 2) wy -= 0.22;
      positions[idx * 3] = wx;
      positions[idx * 3 + 1] = wy;
      positions[idx * 3 + 2] = wz;
      const [r, g, b] = landColor(i, j);
      colors[idx * 3] = r;
      colors[idx * 3 + 1] = g;
      colors[idx * 3 + 2] = b;
    }
  }
  let t = 0;
  for (let j = 0; j < ROWS - 1; j++) {
    for (let i = 0; i < COLS - 1; i++) {
      const a = j * COLS + i;
      const b = a + 1;
      const c = a + COLS;
      const d = c + 1;
      indices[t++] = a;
      indices[t++] = c;
      indices[t++] = b;
      indices[t++] = b;
      indices[t++] = c;
      indices[t++] = d;
    }
  }
  return { positions, colors, indices };
}

export function tintTerrain(
  land: Float32Array,
  _heat: Heat | null,
  _overlay: "both" | "totem" | "mesh" | "none",
) {
  return new Float32Array(land);
}

export type TreeSpec = {
  x: number;
  y: number;
  z: number;
  s: number;
  rot: number;
};

export function treeSpecs(stride = 6): TreeSpec[] {
  const out: TreeSpec[] = [];
  for (let j = 1; j < ROWS - 1; j += stride) {
    for (let i = 1; i < COLS - 1; i += stride) {
      if (COVER[j * COLS + i] !== 1) continue;
      const n = hash(i, j);
      if (n < 0.55) continue;
      const [x, y, z] = gridToWorld(i + (n - 0.5) * 1.4, j + (hash(j, i) - 0.5) * 1.4);
      out.push({
        x,
        y,
        z,
        s: 0.65 + n * 0.9,
        rot: n * Math.PI * 2,
      });
    }
  }
  return out;
}

function hash(ix: number, iy: number) {
  let n = Math.imul(ix + 3, 374761393) + Math.imul(iy + 7, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export const WORLD_W = COLS;
export const WORLD_D = ROWS;
export const CELL = CELL_M;
