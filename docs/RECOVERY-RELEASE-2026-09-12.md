# RidgeMesh recovery release — 2026-09-12

**Phase (SoT):** [#ridgemesh·E6] Recovery verification → Vercel
**Status:** Integrated implementation; final preview verification pending.

## Delivery

Source terrain, three registered imagery acquisitions, 2D/3D planner, directed RF/communication graphs, target coverage, four matched option comparisons, constrained placement, direct-path charts, scenario persistence and field-observation workflow are implemented. The first public release is labeled **Planning estimate**. Source/model versions are stored in scenario exports; importing incompatible versions fails visibly.

The Grok build blockers and unused PWA/auth/database/multiplayer hooks were removed. Node 24, npm 11 and a committed lockfile reproduce the retained TanStack Start/Vite/Nitro application. Three.js loads only when opening 3D. Physics/search execute in a cancellable worker; stale results cannot overwrite new inputs. Scene teardown disposes owned geometries/materials/textures. Every UI/worker/model uses the same source-derived terrain, with explicit display exaggeration.

## Verification provenance

All tests, builds, browser checks and GIS processing ran on **z370**. Root integrated run `ridgemesh-release-20260912`, source `7f54183` plus recovery worktree changes: typecheck and lint passed with zero warnings, 27 tests passed, Nitro Vercel production build passed. Critical math was checked against independent FSPL/knife-edge constants, independent PROJ coordinates and saved GDAL source samples; graph isolation/return paths and optimizer exclusions were exercised. A deliberately failing test propagates failure and absent suites fail.

Browser run `ridgemesh-browser-20260912-third` passed ten checks with no browser errors or failed requests, including three image acquisitions, swipe, 3D cardinal views, mobile layout, complete scenario and field-observation reload. Worker reported 482.5 ms computation, 657.8 ms worker creation-to-result on the z370 reference browser. These are that run's observations, not a universal latency guarantee. Final integrated browser/production evidence will be appended before release acceptance.

Hydration verification found tiny Node/browser PROJ differences; transform serialization now rounds to a micrometre in grid space and retained independent coordinate acceptance. Source imagery and terrain share first/last vertex extents. Edge heat-cell area now matches the physical grid extent instead of adding a phantom 10 m strip.

## Evidence limits and acceptance disposition

RM-2.3.2 remains partial: all images are in the common metric frame and independent seasonal image-content checks are retained, but surveyed ground-control landmarks are unavailable. Four of nine check patches in each satellite view support alignment; five remain weak/ambiguous. RM-2.3.3 remains partial: inferred POIs/masks are disclosed; legal boundaries, camp polygons, access/power/mount permissions have no authoritative source. No invented survey claims were added.

RM-3.1 hardware profiles remain engineering assumptions pending actual SKU/settings verification; Totem unknowns stay unknown by default. RM-7.2 supplies a field-walk and held-out comparison workflow, but no field calibration or confidence claim is possible without observations. This is explicitly permitted by the WBS planning-estimate release condition. Imagery agreement does not validate elevation accuracy; matching source heights does not validate RF delivery.

Search maximizes exact camp-target reach with all existing nodes fixed and optional candidate heights; allowed/excluded and unknown feasibility are explicit. Best-found preview distinguishes gained camp targets, remaining gaps and proposed relays. It is not a global-optimality claim or a surveyed installation plan. Target polygon statistics are cell-center approximations; displayed 80 m area cells are coarser than the 10 m terrain grid and exact camp evaluations.

## Operations and rollback

Vercel project `ridgemesh` (`prj_t9DUwu4aWVM1FmPn8sTrHiZALLOP`) is linked to `jlmeredith/ridgemesh` in Jamie's existing team, with Node 24. No paid imagery connector or new database is required. Preview and production deployment IDs, tested source commit, GitHub review URL and rollback reference will be recorded after remote smoke acceptance. This is the first repaired release; baseline `47a5558` has known defects and is not a healthy rollback target. Retain the accepted preview as the reproducible deployment reference.
