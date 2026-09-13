import data from "../../public/data/site-features.json";

export type SitePoint = [number, number];
/** NAIP pixel-edge coordinates are metres from the same NW origin as the 10 m terrain vertices. */
const grid = (p: number[]): SitePoint => [p[0] / 10, p[1] / 10];
export const SITE_VERSION = data.version;
export const SITE_STATUS = data.status;
export const SITE_SOURCES = data.sources;
export const SITE_POINTS = data.points.map((p) => ({ ...p, x: p.pixel[0] / 10, y: p.pixel[1] / 10,
  source: "NAIP 2022 + official 2025 venue/climbing maps",
  note: `${p.note} Estimated location (planning allowance ${p.uncertaintyM} m; not measured accuracy). Access, power and mounting permission unverified.` }));
export const SITE_POIS = SITE_POINTS;
export const SITE_TARGET_AREAS = data.targetAreas.map((a) => ({ id: a.id, label: a.label,
  polygon: a.pixels.map(grid), uncertaintyM: a.uncertaintyM,
  source: "NAIP 2022 + official 2025 venue map; inferred event-use boundary" }));
export const SITE_AREAS = SITE_TARGET_AREAS;
export const SITE_CANDIDATES = SITE_POINTS.filter((p) => p.kind !== "water").map((p) => ({
  id: p.id, label: p.label, x: p.x, y: p.y, access: "unverified" as const,
}));
export const MOUNT_SITES = SITE_CANDIDATES;
export const SITE_CLEARINGS = data.clearings.map((p) => p.map(grid));
export const SITE_ROADS = data.roads.map((p) => p.map(grid));
export const SITE_CREEK = data.creek.map(grid);
export const SITE_PATHS = [
  ...SITE_ROADS.map((points, i) => ({ id: `road-${i}`, label: "Approximate venue road", kind: "road" as const, points })),
  { id: "creek", label: "Approximate creek corridor", kind: "creek" as const, points: SITE_CREEK },
];
export const SITE_STAGE_FOOTPRINT = data.stageFootprint.map(grid);
export const SITE_RETIRED_IDS = data.retiredIds;
export function inSitePolygon(x: number, y: number, polygon: SitePoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function inSiteTargets(x: number, y: number): boolean {
  return SITE_TARGET_AREAS.some((a) => inSitePolygon(x, y, a.polygon));
}
