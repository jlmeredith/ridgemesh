# Terrain-first scenario planning

**Phase (SoT):** [#ridgemesh·P5] Terrain scenarios → production
**Status:** Accepted — application 3e0dde14db9c8676ddf9162a023a3024aa76d7ca live; 77 remote tests and 22 canonical browser checks passed.

The opening experience must present the best found fixed-radio solution for this landscape, in actual-scale 3D with every information layer enabled. Users compare the full network, the primary router alone and alternate placements through a readable RF heatmap, then apply or customize a scenario. The previous quiet 2D default is superseded by the user's explicit direction.

| WBS ID | Work package / deliverable | Owner | Status | Acceptance |
|---|---|---|---|---|
| TS-1 | Actual terrain and coverage presentation | Root | Accepted | Children accepted |
| TS-1.1 | Actual-scale 3D and all supported layers | Renderer agent; root verifies | Accepted | Fresh visit opens 3D at 1x; labels, antenna heights, routes, areas/roads, contours, coordinates, roaming tests and heat work in 3D; fit/focus preserve 3D; no exaggerated mast height |
| TS-1.2 | Continuous link-margin heatmap | Root + renderer | Accepted | Filled landscape cells use existing two-way route margin; event-only display keeps the same denominator; strong/weak/no-route/unknown are explicit, source resolution stated, disconnected repeaters cannot fabricate coverage |
| TS-1.3 | Align the default with AstralMesh MediumFast | Root | Accepted | Official preset budget supports the derived -126 dBm threshold; regenerate the starter, preserve custom/legacy RF assumptions and verify numerical effect |
| TS-2 | Decision-oriented planning workflow | Root | Accepted | Children accepted |
| TS-2.1 | Visible recommended deployment and objective | Root | Accepted | Opening screen explains goal, actual fixed-node sites/roles/heights, computed tradeoff and limits without hidden planning tabs |
| TS-2.2 | Scenario selection, deltas and reversible apply | Root | Accepted | R1-only and alternate sites render actual changed IDs/positions with matching heat; preview leaves saved plan untouched; apply/restore and manual move/height recompute correctly |
| TS-2.3 | Budget, equipment and meaningful customization | Root | Accepted | Scale budget and constraints; inspect/change a selected radio directly from 3D; preserve inventory locks and roaming positions |
| TS-3 | Evidence and downstream guidance | Root | Accepted | Children accepted |
| TS-3.1 | Remote numerical and browser acceptance | Root | Accepted | z370 or hosted CI proves actual-scale geometry, color/margin semantics, scenario physics, defaults, layer toggles, keyboard/mobile interaction, imagery and state preservation |
| TS-3.2 | Canonical Vercel release and durable capture | Root | Accepted | Exact application commit passes CI/build and live browser; release evidence and memory updated |
| TS-3.3 | AstralMesh recommendations | Root; source agent retrieves | Accepted | Verify its separate repo/deployment and capture how dated modeled fixed-backbone guidance should flow into its attendee/offline experience; do not modify AstralMesh implicitly |

The RF engine and interpreted venue geography remain planning models. Vertical exaggeration is removed: it was a visual aid for subtle terrain, but it added no RF evidence and incorrectly scaled the old rendered antenna heights. Detailed field terrain, mounting feasibility, canopy and actual packet behavior remain unverified.
