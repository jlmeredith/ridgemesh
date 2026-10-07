# RidgeMesh recovery release — 2026-09-12

**Phase (SoT):** [#ridgemesh·E6] Recovery verification → Vercel
**Status:** Deployed planning estimate; final live evidence attached below.

## Delivery

Source terrain, three registered imagery acquisitions, 2D/3D planner, directed RF/communication graphs, target coverage, four matched option comparisons, constrained placement, direct-path charts, scenario persistence and field-observation workflow are implemented. The first public release is labeled **Planning estimate**. Source/model versions are stored in scenario exports; importing incompatible versions fails visibly.

The Grok build blockers and unused PWA/auth/database/multiplayer hooks were removed. Node 24, npm 11 and a committed lockfile reproduce the retained TanStack Start/Vite/Nitro application. Three.js loads only when opening 3D. Physics/search execute in a cancellable worker; stale results cannot overwrite new inputs. Scene teardown disposes owned geometries/materials/textures. Every UI/worker/model uses the same source-derived terrain, with explicit display exaggeration.

## Verification provenance

GIS processing and interactive/browser validation ran on **z370**; clean CI installation and checks also ran on a remote **GitHub Actions ubuntu-latest** runner. No tests or builds ran on the Mac. Root integrated run `ridgemesh-release-20260912`, source `7f54183` plus recovery worktree changes: typecheck and lint passed with zero warnings, 27 tests passed, Nitro Vercel production build passed. Critical math was checked against independent FSPL/knife-edge constants, independent PROJ coordinates and saved GDAL source samples; graph isolation/return paths and optimizer exclusions were exercised. A deliberately failing test propagates failure and absent suites fail.

Browser run `ridgemesh-browser-20260912-third` passed ten checks with no browser errors or failed requests, including three image acquisitions, swipe, 3D cardinal views, mobile layout, complete scenario and field-observation reload. Worker reported 482.5 ms computation, 657.8 ms worker creation-to-result on the z370 reference browser. These are that run's observations, not a universal latency guarantee. Final integrated browser/production evidence will be appended before release acceptance.

Hydration verification found tiny Node/browser PROJ differences; transform serialization now rounds to a micrometre in grid space and retained independent coordinate acceptance. Source imagery and terrain share first/last vertex extents. Edge heat-cell area now matches the physical grid extent instead of adding a phantom 10 m strip.

## Evidence limits and acceptance disposition

RM-2.3.2 remains partial: all images are in the common metric frame and independent seasonal image-content checks are retained, but surveyed ground-control landmarks are unavailable. Four of nine check patches in each satellite view support alignment; five remain weak/ambiguous. RM-2.3.3 remains partial: inferred POIs/masks are disclosed; legal boundaries, camp polygons, access/power/mount permissions have no authoritative source. No invented survey claims were added.

RM-3.1 hardware profiles remain engineering assumptions pending actual SKU/settings verification; Totem unknowns stay unknown by default. RM-7.2 supplies a field-walk and held-out comparison workflow, but no field calibration or confidence claim is possible without observations. This is explicitly permitted by the WBS planning-estimate release condition. Imagery agreement does not validate elevation accuracy; matching source heights does not validate RF delivery.

Search maximizes exact camp-target reach with all existing nodes fixed and optional candidate heights; allowed/excluded and unknown feasibility are explicit. Best-found preview distinguishes gained camp targets, remaining gaps and proposed relays. It is not a global-optimality claim or a surveyed installation plan. Target polygon statistics are cell-center approximations; displayed 80 m area cells are coarser than the 10 m terrain grid and exact camp evaluations.

## Operations and rollback

Vercel project `ridgemesh` (`prj_t9DUwu4aWVM1FmPn8sTrHiZALLOP`) is linked to `jlmeredith/ridgemesh` in Jamie's existing team, with Node 24. No paid imagery connector or new database is required. Preview and production deployment IDs, tested source commit, GitHub review URL and rollback reference will be recorded after remote smoke acceptance. This is the first repaired release; baseline `47a5558` has known defects and is not a healthy rollback target. Retain the accepted preview as the reproducible deployment reference.

## Deployed revision and acceptance

Application revision **fec8677010d7577f098541d1932761ba0a71bc77** passed clean GitHub Actions verification, runs [34726769539](https://github.com/jlmeredith/ridgemesh/actions/runs/34726769539) and [34726768155](https://github.com/jlmeredith/ridgemesh/actions/runs/34726768155). These jobs run npm ci, typecheck, lint, all 27 tests and production build on the recorded hosted Linux runner. Vercel built preview `dpl_GH3Vajf2UtTqEmRBeewhhr3c1MLF`, then rebuilt it with the production environment as `dpl_FCdHqrsYcHPsKby6ARE6aH4CFnjP`, READY with no alias error. Public address: [ridgemesh.vercel.app](https://ridgemesh.vercel.app). Review record: [PR #1](https://github.com/jlmeredith/ridgemesh/pull/1), draft recovery branch; main has not been merged.

Rollback reference: first repaired production `dpl_3LnocKJnSyAe62uGnU83H26MEri5` at application revision `a199d24`. This preceding version has the same terrain/RF engine and passed the isolated 16-check live suite; later changes wire 3D opacity and hide controls that only apply in plan view. Keep this deployment available; do not roll back to the broken original export.

Performance acceptance is partial. Integrated z370 browser run `ridgemesh-browser-20260913-integrated` passed 16 checks, with 471.2 ms reported calculation and 618.6 ms worker creation-to-result. Six repeated renderer cycles plateaued at 22 geometries for M1-only, 37 for backbone and one texture. Click-to-two-animation-frame observations were 61.4–111.5 ms, so the strict 100 ms target is not fully met. Initial live cold loading took 4.34 seconds in the interim production run despite 433.2 ms calculation; network/module startup therefore does not meet a universal two-second end-to-end budget. Normal local-reference recalculation does. Hashed worker assets are compressed and immutable-cached by Vercel; first-load latency is reported separately from computation.

A concurrent initial live browser capture timed out waiting for screenshot stability; an isolated retry captured successfully. The original mouse-driven cancellation check raced a fast completed job while scrolling the panel; the harness now exercises keyboard focus/Enter cancellation and still asserts the visible canceled state. These failed attempts are retained on z370 and are not counted as passing runs.

## Knowledge captured

Decision: launch the repaired engineering planner with explicit unknowns while preserving missing external survey and field evidence. Rationale: numerical/software validation can verify the implemented analytical chain but cannot manufacture property boundaries or real RF measurements. Lesson: separate acquisition, projection, source sampling, presentation, RF feasibility and installation permission; none substitutes for another. Reusable assets: remote test/browser runners, normalized screenshot gate, GIS preparation/registration scripts, versioned source manifests and field-observation workflow. Codex memory `project_ridgemesh_recovery.md` and Graphiti episode `DECISION: RidgeMesh recovered planner and evidence limits` link back to this record.

## Final production smoke accepted

Root inspected the primary browser JSON, normalized desktop/3D evidence, Vercel deployment metadata and GitHub job results. **RAN ON z370**, `ridgemesh-production-fec8677-final`, application commit `fec8677010d7577f098541d1932761ba0a71bc77`, canonical production URL: all **16 checks passed**, zero browser errors and failed requests. [Primary report](evidence/production-fec8677-browser-report.json) and normalized [desktop](evidence/production-fec8677-desktop-map.png), [3D](evidence/production-fec8677-terrain-3d.png), [mobile](evidence/production-fec8677-mobile-map.png) captures are committed. The gate returned success without warnings for each image; raw captures remain remote.

Final cold worker creation-to-result was **2676 ms**; calculation itself was **412.3 ms**. Click-to-two-animation-frame samples were **16–58.5 ms** in this run. Renderer counts plateaued at **22/37 geometries** for repeated M1/backbone layouts and **one texture**; after 3D teardown, canvas count was zero and DOM count remained 1206 over five interactions. These measurements establish bounded observed behavior, not universal hardware/network guarantees. Earlier slower observations remain disclosed above.

The released planning functionality is accepted. Survey/field data and cold-start latency acceptance remain open exactly as recorded in the WBS. Subsequent documentation and harness-only commits do not change the deployed application revision.
