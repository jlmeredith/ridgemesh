import {
  CAMPS,
  CELL_M,
  COLS,
  COVER,
  HEIGHT,
  ROWS,
  coverAt,
  elevBilinear,
} from "./terrain";

export type Kind = "totem" | "m1" | "v4";
export type Role = "client" | "router";

export type Node = {
  id: string;
  kind: Kind;
  x: number;
  y: number;
  label: string;
};

export type SimParams = {
  crowd: number;
  bagLoss: boolean;
  clientsHop: boolean;
  meshHops: number;
  totemHops: number;
  communityTotems: boolean;
};

export type LinkResult = {
  ok: boolean;
  distM: number;
  forestM: number;
  blocked: boolean;
  excessM: number;
  lossDb: number;
  budgetDb: number;
  hops: number;
  reason: string;
};

export const KIND_META: Record<
  Kind,
  { title: string; txDbm: number; agl: number; band: string; system: "totem" | "mesh" }
> = {
  totem: {
    title: "Totem Compass",
    txDbm: 10,
    agl: 1.4,
    band: "2.4 GHz",
    system: "totem",
  },
  m1: {
    title: "ThinkNode M1",
    txDbm: 22,
    agl: 1.3,
    band: "915 MHz",
    system: "mesh",
  },
  v4: {
    title: "Heltec V4 repeater",
    txDbm: 28,
    agl: 6,
    band: "915 MHz",
    system: "mesh",
  },
};

function samplePath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  step = 0.7,
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy) || 1;
  const n = Math.max(2, Math.ceil(dist / step));
  const pts: { x: number; y: number; t: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    pts.push({ x: x0 + dx * t, y: y0 + dy * t, t });
  }
  return pts;
}

export function profile(
  a: { x: number; y: number; agl: number },
  b: { x: number; y: number; agl: number },
  coarse = false,
) {
  const pts = samplePath(a.x, a.y, b.x, b.y, coarse ? 1.4 : 0.7);
  const h0 = elevBilinear(a.x, a.y) + a.agl;
  const h1 = elevBilinear(b.x, b.y) + b.agl;
  let forestM = 0;
  let blocked = false;
  let excessM = 0;
  const samples = pts.map((p) => {
    const ground = elevBilinear(p.x, p.y);
    const los = h0 + p.t * (h1 - h0);
    const cover = coverAt(p.x, p.y);
    if (cover === "forest") forestM += 0.55 * CELL_M;
    const clearance = los - (ground + 1.2);
    if (clearance < 0) {
      blocked = true;
      excessM = Math.max(excessM, -clearance);
    }
    return { ...p, ground, los, cover, clearance };
  });
  const distM = Math.hypot(a.x - b.x, a.y - b.y) * CELL_M;
  return { samples, forestM, blocked, excessM, distM, h0, h1 };
}

function fspl(distM: number, mhz: number) {
  const dKm = Math.max(distM, 1) / 1000;
  return 32.4 + 20 * Math.log10(dKm) + 20 * Math.log10(mhz);
}

function roleOf(kind: Kind, clientsHop: boolean): Role {
  if (kind === "v4") return "router";
  if (kind === "m1") return clientsHop ? "router" : "client";
  return "router";
}

export function evaluateLink(
  a: Node,
  b: Node,
  params: SimParams,
  coarse = false,
): LinkResult {
  const ma = KIND_META[a.kind];
  const mb = KIND_META[b.kind];
  const same =
    (ma.system === "totem" && mb.system === "totem") ||
    (ma.system === "mesh" && mb.system === "mesh");
  if (!same) {
    return {
      ok: false,
      distM: 0,
      forestM: 0,
      blocked: false,
      excessM: 0,
      lossDb: 0,
      budgetDb: 0,
      hops: 0,
      reason: "Different physical layers — they do not interoperate.",
    };
  }
  const system = ma.system;
  const p = profile(
    { x: a.x, y: a.y, agl: ma.agl },
    { x: b.x, y: b.y, agl: mb.agl },
    coarse,
  );
  const mhz = system === "totem" ? 2400 : 915;
  let loss = fspl(p.distM, mhz);
  const foliageDbPerM = system === "totem" ? 0.16 : 0.045;
  loss += p.forestM * foliageDbPerM;
  if (p.blocked) {
    const knife = system === "totem" ? 28 + p.excessM * 1.4 : 8 + p.excessM * 0.55;
    loss += knife;
  }
  const meadowCrowd =
    params.crowd *
    14 *
    (system === "totem" ? 1 : 0.25) *
    Math.min(1, p.distM / 180);
  loss += meadowCrowd;
  if (params.bagLoss && system === "mesh") loss += 2.2;
  const tx = Math.max(ma.txDbm, mb.txDbm);
  const rxSens = system === "totem" ? -92 : -132;
  const budget = tx - rxSens - 8;
  const ok = loss <= budget && p.distM > 2;
  let reason = ok
    ? p.blocked
      ? "Marginal — diffracted over terrain."
      : p.forestM > 80
        ? "Through timber, still inside budget."
        : "Clear enough for a direct hop."
    : p.blocked && system === "totem"
      ? "Ridge or shoulder blocks 2.4 GHz. Totem cannot go over the hill."
      : p.forestM > 120 && system === "totem"
        ? "Hardwood canopy ate the 2.4 GHz path."
        : p.distM > (system === "totem" ? 1100 : 4500)
          ? "Beyond realistic P2P range."
          : "Path loss exceeds the link budget.";
  if (p.distM <= 2) reason = "Co-located.";
  return {
    ok,
    distM: p.distM,
    forestM: p.forestM,
    blocked: p.blocked,
    excessM: p.excessM,
    lossDb: loss,
    budgetDb: budget,
    hops: 1,
    reason,
  };
}

function neighbors(
  from: Node,
  nodes: Node[],
  params: SimParams,
  system: "totem" | "mesh",
) {
  const out: Node[] = [];
  for (const n of nodes) {
    if (n.id === from.id) continue;
    if (KIND_META[n.kind].system !== system) continue;
    const link = evaluateLink(from, n, params);
    if (link.ok) out.push(n);
  }
  return out;
}

export function reachability(
  nodes: Node[],
  params: SimParams,
  system: "totem" | "mesh",
) {
  const set = nodes.filter((n) => KIND_META[n.kind].system === system);
  const hops = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const q: Node[] = [];
  for (const n of set) {
    hops.set(n.id, 0);
    prev.set(n.id, null);
    q.push(n);
  }
  const maxHops = system === "totem" ? params.totemHops : params.meshHops;
  while (q.length) {
    const cur = q.shift()!;
    const h = hops.get(cur.id) ?? 0;
    if (h >= maxHops) continue;
    if (roleOf(cur.kind, params.clientsHop) !== "router" && h > 0) continue;
    for (const nb of neighbors(cur, set, params, system)) {
      if (hops.has(nb.id) && (hops.get(nb.id) ?? 99) <= h + 1) continue;
      hops.set(nb.id, h + 1);
      prev.set(nb.id, cur.id);
      q.push(nb);
    }
  }
  return { hops, prev, set };
}

function cellReachable(
  i: number,
  j: number,
  nodes: Node[],
  params: SimParams,
  system: "totem" | "mesh",
) {
  const ghost: Node = {
    id: "cell",
    kind: system === "totem" ? "totem" : "m1",
    x: i,
    y: j,
    label: "cell",
  };
  const src = nodes.filter((n) => KIND_META[n.kind].system === system);
  src.sort(
    (a, b) =>
      (a.x - i) ** 2 + (a.y - j) ** 2 - ((b.x - i) ** 2 + (b.y - j) ** 2),
  );
  for (const n of src) {
    if (evaluateLink(n, ghost, params, true).ok) return 1;
  }
  return 99;
}

export type Heat = {
  w: number;
  h: number;
  step: number;
  totem: Float32Array;
  mesh: Float32Array;
};

export function computeHeat(nodes: Node[], params: SimParams, step = 5): Heat {
  const w = Math.ceil(COLS / step);
  const h = Math.ceil(ROWS / step);
  const totem = new Float32Array(w * h);
  const mesh = new Float32Array(w * h);
  const crowdGhosts = params.communityTotems
    ? seedCommunityTotems(params.crowd)
    : [];
  const tNodes = nodes
    .filter((n) => KIND_META[n.kind].system === "totem")
    .concat(crowdGhosts);
  const mNodes = nodes.filter((n) => KIND_META[n.kind].system === "mesh");
  for (let gy = 0; gy < h; gy++) {
    for (let gx = 0; gx < w; gx++) {
      const i = Math.min(COLS - 1, gx * step + step / 2);
      const j = Math.min(ROWS - 1, gy * step + step / 2);
      const idx = gy * w + gx;
      totem[idx] = cellReachable(i, j, tNodes, params, "totem") < 99 ? 1 : 0;
      mesh[idx] = cellReachable(i, j, mNodes, params, "mesh") < 99 ? 1 : 0;
    }
  }
  return { w, h, step, totem, mesh };
}

function seedCommunityTotems(crowd: number): Node[] {
  const n = Math.round(4 + crowd * 28);
  const out: Node[] = [];
  const spots: [number, number][] = [
    [80, 90], [78, 84], [84, 96], [70, 92], [90, 88], [104, 92],
    [100, 86], [108, 96], [92, 132], [88, 126], [70, 104], [76, 70], [88, 67], [64, 88],
  ];
  for (let k = 0; k < n; k++) {
    const s = spots[k % spots.length];
    const jitter = (hash2(k, 17) - 0.5) * 10;
    out.push({
      id: `ghost-${k}`,
      kind: "totem",
      x: s[0] + jitter,
      y: s[1] + (hash2(k, 91) - 0.5) * 8,
      label: "Other Totem",
    });
  }
  return out;
}

function hash2(a: number, b: number) {
  let n = Math.imul(a + 1, 374761393) + Math.imul(b + 3, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function coverageStats(heat: Heat, nodes: Node[]) {
  const campCells = CAMPS.map((c) => ({ x: c.x, y: c.y }));
  function score(grid: Float32Array) {
    let on = 0;
    for (let i = 0; i < grid.length; i++) if (grid[i] > 0.15) on++;
    return on / grid.length;
  }
  function campHit(grid: Float32Array, step: number, w: number) {
    let hit = 0;
    for (const c of campCells) {
      const gx = Math.min(w - 1, Math.floor(c.x / step));
      const gy = Math.min(heat.h - 1, Math.floor(c.y / step));
      if (grid[gy * w + gx] > 0.2) hit++;
    }
    return hit;
  }
  return {
    totemFrac: score(heat.totem),
    meshFrac: score(heat.mesh),
    totemCamps: campHit(heat.totem, heat.step, heat.w),
    meshCamps: campHit(heat.mesh, heat.step, heat.w),
    campCount: campCells.length,
    totemCount: nodes.filter((n) => n.kind === "totem").length,
    m1Count: nodes.filter((n) => n.kind === "m1").length,
    v4Count: nodes.filter((n) => n.kind === "v4").length,
  };
}

export function occludedRing(n: Node, radiusM: number, segs = 64) {
  const r = radiusM / CELL_M;
  const agl = KIND_META[n.kind].agl;
  const pts: { x: number; y: number; clear: boolean }[] = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const x = n.x + Math.cos(a) * r;
    const y = n.y + Math.sin(a) * r;
    const p = profile({ x: n.x, y: n.y, agl }, { x, y, agl: 1.2 }, true);
    pts.push({ x, y, clear: !p.blocked });
  }
  const segsOut: { ax: number; ay: number; bx: number; by: number; clear: boolean }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    segsOut.push({
      ax: pts[i].x,
      ay: pts[i].y,
      bx: pts[i + 1].x,
      by: pts[i + 1].y,
      clear: pts[i].clear && pts[i + 1].clear,
    });
  }
  return segsOut;
}

export type LinkClass = "clear" | "around" | "through";

export function classifyLink(a: Node, b: Node): LinkClass {
  const p = profile(
    { x: a.x, y: a.y, agl: KIND_META[a.kind].agl },
    { x: b.x, y: b.y, agl: KIND_META[b.kind].agl },
    true,
  );
  if (!p.blocked) return "clear";
  if (p.excessM >= 8) return "through";
  return "around";
}

export function suggestBackbone(): Node[] {
  return [
    { id: "sug-w", kind: "v4", x: 114, y: 65, label: "Stargazer V4" },
    { id: "sug-e", kind: "v4", x: 36, y: 70, label: "885 ft V4" },
    { id: "sug-s", kind: "v4", x: 98, y: 97, label: "Stage mast V4" },
  ];
}

export function suggestClients(): Node[] {
  return [
    { id: "c-field", kind: "m1", x: 113, y: 103, label: "Field M1" },
    { id: "c-grove", kind: "m1", x: 125, y: 111, label: "Grove M1" },
    { id: "c-star", kind: "m1", x: 114, y: 65, label: "Stargazer M1" },
    { id: "c-dream", kind: "m1", x: 102, y: 83, label: "Dreamcatcher M1" },
    { id: "c-fam", kind: "m1", x: 130, y: 116, label: "Family M1" },
  ];
}

export function suggestTotems(): Node[] {
  return [
    { id: "t1", kind: "totem", x: 113, y: 103, label: "Totem A" },
    { id: "t2", kind: "totem", x: 118, y: 106, label: "Totem B" },
    { id: "t3", kind: "totem", x: 125, y: 111, label: "Totem C" },
    { id: "t4", kind: "totem", x: 114, y: 65, label: "Totem D" },
    { id: "t5", kind: "totem", x: 130, y: 116, label: "Totem E" },
  ];
}

export { COVER, HEIGHT, COLS, ROWS };
