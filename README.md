# RidgeMesh

Terrain-aware communication planner for Astral Valley, Missouri. Place crew radios, compare equipment at those locations, inspect coverage gaps and find useful relay sites and antenna heights. **All coverage is an uncalibrated planning estimate.**

## What is implemented

- Immutable USGS 1 m source terrain resampled to a declared 10 m analysis grid, one NAD83 UTM spatial contract, contours and ground-relative antenna heights.
- Two real Sentinel-2 acquisitions (June and November 2024), plus high-detail USDA NAIP aerial photography (June 2022), synchronized swipe comparison and textured 3D with cardinal cameras.
- Event locations reconciled against official 2023–2025 maps and visible aerial features: the western Family camp, central Stargazer hilltop, eastern Harmony/Dreamcatcher areas and southern Main Stage. One versioned registry supplies labels, target areas, starter positions and placement candidates.
- Clean aerial-first map, event framing, pan/zoom, numbered device roster and visible antenna heights. Coverage is hidden initially; optional discrete samples distinguish strong, weak, no route and unknown inside event-use areas.
- Directed RF budgets, terrain/Fresnel/diffraction profiles, explicit forwarding roles, separate return paths, target-area coverage and exact camp-point results.
- Totem, M1, V4-assisted and hybrid comparisons preserve the user's actual positions and heights. Relay search tests permitted sites and mast heights against the same 40 m target samples used in the displayed results, with proposed coverage visible before applying changes.
- Minimum tested mast-height guidance raises one endpoint while keeping the other fixed, with separate ground line-of-sight, 60% Fresnel clearance and bidirectional RF requirements.
- Worker calculation/cancellation, scenario JSON roundtrip and browser persistence, keyboard placement and undo, field-walk export and held-out observation review.

## Run and verify on the remote host

Node 24 and npm 11 are pinned; use `npm ci`. No tests, builds, browser automation or GIS processing run on the Mac. From a worktree, `npm run check:remote` transfers a snapshot and runs installation, typecheck, lint, tests and build on z370. See `scripts/remote-check.sh` for recorded revision/run provenance. Run the application on a remote host with `npm run dev`; tunnel its port if needed.

Browser verification: run `timeout 480 node scripts/planner-browser-check.mjs` on z370 with `RIDGEMESH_RUN_ID`, `RIDGEMESH_REVISION` and optionally `RIDGEMESH_BROWSER_URL`. The current harness exercises source-site inspection, custom node placement/heights, coverage previews, comparisons, mast guidance, optimization, persistence, imagery and mobile. The earlier `browser-check.mjs` preserves first-release evidence but its UI assumptions predate the planner correction. Screenshots must pass `scripts/normalize_screenshot.py` before viewing.

Vercel uses the TanStack Start framework, Nitro Vercel preset, Node 24 and `npm run build`; no database, map-provider secret or server GIS process is needed. Derived imagery/data are committed with provenance; raw source GIS is retained on z370.

## Evidence and limitations

[Current correction WBS](docs/PLANNER-CORRECTION-WBS.md), [current release record](docs/PLANNER-CORRECTION-RELEASE-2026-09-13.md), [event-map reconciliation](docs/evidence/event-map-registration-20260913.md), [height/placement evidence](docs/evidence/planner-domain-correction-20260913.md), [terrain evidence](docs/evidence/terrain-delivery-20260912.md). The [first recovery release](docs/RECOVERY-RELEASE-2026-09-12.md) is historical; its venue geometry and blanket coverage presentation were rejected and are superseded by this correction.

Camp-use boundaries and land cover remain interpreted; 25–80 m feature allowances are judgments, not measured survey accuracy. No legal property boundary, installation permissions or calibrated canopy model is supplied. Hardware values are editable assumptions; Totem stays unknown unless explicitly assumed. The simplified RF model does not certify packet delivery, capacity, GNSS availability or installation feasibility. Real field observations are required for calibration. The optimizer is a bounded heuristic with paired-relay lookahead, not a global optimum. Schema 2 includes the site-registry version and rejects older incompatible imports; prior browser plans remain stored separately.
