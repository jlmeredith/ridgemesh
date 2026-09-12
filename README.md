# RidgeMesh

Terrain-aware communication planner for Astral Valley, Missouri. Explore registered property imagery, compare radio configurations, inspect direct paths and find better relay locations. **All coverage is an uncalibrated planning estimate.**

## What is implemented

- Immutable USGS 1 m source terrain resampled to a declared 10 m analysis grid, one NAD83 UTM spatial contract, contours and ground-relative antenna heights.
- Two real Sentinel-2 acquisitions (June and November 2024), plus high-detail USDA NAIP aerial photography (June 2022), synchronized swipe comparison and textured 3D with cardinal cameras.
- Directed RF budgets, terrain/Fresnel/diffraction profiles, explicit forwarding roles, separate return paths, target-area coverage and exact camp-point results.
- Matched Totem, M1, V4-assisted and hybrid comparisons; constrained best-found relay search with gains, gaps and candidate preview.
- Worker calculation/cancellation, scenario JSON roundtrip and browser persistence, keyboard placement and undo, field-walk export and held-out observation review.

## Run and verify on the remote host

Node 24 and npm 11 are pinned; use `npm ci`. No tests, builds, browser automation or GIS processing run on the Mac. From a worktree, `npm run check:remote` transfers a snapshot and runs installation, typecheck, lint, tests and build on z370. See `scripts/remote-check.sh` for recorded revision/run provenance. Run the application on a remote host with `npm run dev`; tunnel its port if needed.

Browser verification: run `node scripts/browser-check.mjs` on z370 with `RIDGEMESH_RUN_ID`, `RIDGEMESH_REVISION`, optionally `RIDGEMESH_URL` and `RIDGEMESH_RENDERER_DIAGNOSTICS=1`. Screenshots must pass `scripts/normalize_screenshot.py` before viewing.

Vercel uses the TanStack Start framework, Nitro Vercel preset, Node 24 and `npm run build`; no database, map-provider secret or server GIS process is needed. Derived imagery/data are committed with provenance; raw source GIS is retained on z370.

## Evidence and limitations

[Recovery WBS](docs/RECOVERY-WBS.md), [release record](docs/RECOVERY-RELEASE-2026-09-12.md), [original audit](docs/RECOVERY-AUDIT-2026-09-12.md), [terrain evidence](docs/evidence/terrain-delivery-20260912.md), [RF evidence](docs/evidence/radio-model-20260912.md).

Land-cover masks and venue labels remain inferred. No legal property boundary or surveyed camp polygons are supplied; image correlation is partial registration evidence, not surveyed ground control. Hardware values are editable assumptions; Totem stays unknown unless explicitly assumed. The simplified RF model does not certify packet delivery, capacity, GNSS availability or installation feasibility. Real field observations are required for calibration. The optimizer is a bounded heuristic and can miss beneficial multi-relay chains.
