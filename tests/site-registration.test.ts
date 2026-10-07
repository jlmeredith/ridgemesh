import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POIS, CAMPS, CELL_M, TERRAIN_METADATA, elevBilinear, coverAt } from "../src/lib/terrain";
import { SITE_TARGET_AREAS, SITE_POINTS, SITE_RETIRED_IDS, inSiteTargets } from "../src/lib/site-features";

test("event-map topology corrects western family camp, eastern Dreamcatcher and southern stage", () => {
  const get = (id: string) => { const p = POIS.find(p => p.id === id); assert.ok(p); return p; };
  const stage = get("stage"), family = get("family"), star = get("star"), grove = get("grove"), dream = get("dream");
  // Independently read 2023/2024/2025 organizer-map relationships, not historic guesses.
  assert.ok(family.x < star.x && family.y < stage.y);
  assert.ok(dream.x > grove.x && grove.x > star.x);
  assert.ok(stage.y > star.y && stage.y > grove.y);
  assert.ok(elevBilinear(star.x, star.y) > elevBilinear(stage.x, stage.y) + 10,
    "Organizer hilltop Stargazer must actually be above the valley field in the unchanged USGS DEM");
});

test("observed roof and hilltop clearing stay in the source imagery metric frame", () => {
  const stage = POIS.find(p => p.id === "stage")!;
  // Independent NAIP pixel click at 1181,1120 and affine [1,0,726300,0,-1,4212510].
  assert.equal(TERRAIN_METADATA.westCenter + stage.x * CELL_M, 727481);
  assert.equal(TERRAIN_METADATA.northCenter - stage.y * CELL_M, 4211390);
  assert.equal(coverAt(stage.x, stage.y), "stage");
  const star = POIS.find(p => p.id === "star")!;
  assert.equal(coverAt(star.x, star.y), "meadow");
});

test("occupancy uses disjoint source-informed camp areas and preserves the wooded gap", () => {
  for (const camp of CAMPS) assert.ok(inSiteTargets(camp.x, camp.y), `${camp.id} must be inside its occupancy target`);
  // Central woodland between western camp and hilltop is not an occupied bounding rectangle.
  assert.equal(inSiteTargets(108, 70), false);
  assert.ok(SITE_TARGET_AREAS.length >= 5);
  for (const p of SITE_POINTS) assert.ok(p.uncertaintyM > 0 && p.note.includes("unverified"));
  for (const id of SITE_RETIRED_IDS) assert.ok(!POIS.some(p => p.id === id));
});

test("uncertain map illustration cannot silently become surveyed coordinates", () => {
  const evidence = JSON.parse(readFileSync("docs/evidence/event-map-registration-20260913.json", "utf8"));
  assert.equal(evidence.runHost, "ssh z370");
  assert.ok(evidence.withheldChecks.find((p: { id: string }) => p.id === "stage-roof-centre").residualM > 50);
  assert.ok(evidence.decision.startsWith("Reject direct global map-icon"));
  assert.equal(TERRAIN_METADATA.version, "usgs-2021-10m-v1");
});
