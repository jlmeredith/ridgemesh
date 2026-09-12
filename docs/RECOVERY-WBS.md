# RidgeMesh recovery work breakdown

**Phase (SoT):** [#ridgemesh·E1] Runtime repair → Vercel preview
**Status:** Proposed implementation plan; audit complete, implementation not started.
**Date:** 2026-09-12
**Baseline:** `47a5558` on `main`; analysis branch `codex/recovery-analysis`.
**Scope:** Restore trustworthy terrain, compare communication coverage, recommend feasible placement, and release on Vercel.

The phase token uses the local project key; no GitHub epic has been filed. This session delivers analysis and planning only. The next session owns E1. [Audit and primary evidence](RECOVERY-AUDIT-2026-09-12.md) explain the defects behind these work packages.

## Work packages

Every leaf below has a deliverable and an observable acceptance condition. Owners are future workstream roles, not concurrent writers; assign one writer per file when executing. All tests, builds, browser checks, GIS processing, and benchmarks run on z370 or an approved remote runner, with host, run ID, commit, command, and result retained.

| WBS ID | Work package / deliverable | Depends on | Status | Owner | Acceptance |
|---|---|---|---|---|---|
| RM-1 | Reproducible runtime and engineering preview | — | Planned | Runtime | RM-1.1–1.4 accepted |
| RM-1.1 | Remove broken Grok PWA/preview hooks and unused DB/auth/multiplayer scaffold; own minimal app metadata and manifest assets | — | Planned | Runtime | Config parses; no imported missing module, missing migration command, or referenced missing production PWA asset; actual retained dependencies are documented |
| RM-1.2 | Resolve compatible dependencies, commit npm lockfile, pin Node/package manager; retain Start + Vite + Nitro | 1.1 | Planned | Runtime | Clean remote install, typecheck, lint and production build succeed; clean lockfile install reproduces the graph; use Node 24 baseline after verifying compatibility |
| RM-1.3 | Replace nonexistent test wiring with real domain/browser checks and a remote execution entry point | 1.2 | Planned | Runtime | A deliberately failed assertion fails the job; absent suites cannot report success; source revision and remote run provenance emitted |
| RM-1.4 | Link repository to Vercel and deploy an engineering branch preview, visibly labeled as an unvalidated model | 1.2, 1.3 | Planned | Release | Vercel build succeeds; remote browser loads route/assets/WebGL; retain preview URL, commit and build ID; do not promote current coverage claims to production |
| RM-2 | Authoritative site and terrain data | — | Planned | Terrain | RM-2.1–2.4 accepted |
| RM-2.1 | Download confirmed USGS 1 m product on the box; inventory AOI plus required modeling buffer; retain raw source and manifest | — | Planned | Terrain | Verify checksum, raster CRS/datum/resolution, nodata, exact AOI coverage and acquisition metadata; add adjacent tiles if buffer needs them; reproducible clipped output |
| RM-2.2 | Define one metric spatial contract; produce immutable analysis elevation and separate render LOD | 2.1 | Planned | Terrain | Grid centers/edges, extent, axis orientation and WGS84 transforms agree with independent GDAL samples; no field flattening, synthetic hill, creek carving or analytical noise |
| RM-2.3 | Register imagery, site boundary, camp polygons, paths and POIs as separate sourced layers | 2.2 | Planned | Terrain | Show alignment against georeferenced imagery and independent control points; report residuals against source accuracy; label inferred/unverified points; venue illustration alone is not ground control |
| RM-2.4 | Generate contours/spot labels and a terrain evidence pack | 2.2, 2.3 | Planned | Terrain | Field, ridge, creek and boundary sample/profile values agree with source GeoTIFF within declared numerical tolerance; assess original-source accuracy separately; conflicts with legacy labels recorded |
| RM-3 | Radio and communication model | — | Planned | RF | RM-3.1–3.4 accepted |
| RM-3.1 | Version hardware and network profiles: SKU, protocol, firmware, modem settings, TX/RX, gain/loss, AGL, role, uncertainty | — | Planned | RF | Every fixed physical input has a primary source or visible assumption; incompatible radio/application settings cannot form a usable link; Totem unknowns stay explicit |
| RM-3.2 | Implement directed budgets, source-aligned terrain paths, segment-length foliage integration, Fresnel and documented diffraction method | 2.2, 3.1 | Planned | RF | Remote independent flat-path, ridge-position, asymmetric-power and sampling-resolution fixtures pass; heat and probe share results; no endpoint blanket obstruction; return path evaluated separately |
| RM-3.3 | Implement origin/destination-specific communication graphs, forwarding roles, hop convention and disconnected components | 3.2 | Planned | RF | Chain, isolated-island, mute-relay and hop-boundary fixtures pass; isolated repeater cannot claim reach to base; crew-pair coverage and direct footprint are distinct |
| RM-3.4 | Define likely/marginal/unavailable/unknown outputs, uncertainty sensitivity, and capacity scope | 3.2, 3.3 | Planned | RF | Unknown source/configuration never becomes covered; no uncalibrated delivery probabilities; flag that RF feasibility does not prove airtime capacity, latency or GNSS position availability |
| RM-4 | Understandable coverage and option comparison | — | Planned | Planner | RM-4.1–4.5 accepted |
| RM-4.1 | Add true north-up orthographic planning view, registered imagery and optional 3D with explicit exaggeration | 1.2, 2.3 | Planned | Map | Same point/AGL/path aligns in both views; exaggeration leaves model unchanged; scale, coordinates and elevation visible; basic SVG/2D fallback works when WebGL fails |
| RM-4.2 | Render a real coverage layer and successful graph routes from a shared result object; add path-profile chart | 3.3, 3.4, 4.1 | Planned | Map | Known raster fixture lands in correct cells; none/system/difference modes work; cell detail, map, graph, profile and statistic agree; range rings labeled distance references only |
| RM-4.3 | Define target masks, exact POI evaluation and schema-versioned scenario persistence/import/export | 2.3, 3.1 | Planned | Planner | Metrics weight target polygon area/importance and report unknown area; refresh and JSON roundtrip preserve all inputs; every preset resets complete state; incompatible versions handled visibly |
| RM-4.4 | Compare Totem crew, M1 crew, V4-assisted M1 crew and hybrid under matched targets and environmental assumptions | 4.2, 4.3 | Planned | Planner | Show per-target gaps, crew-pair/base reachability, bottleneck margin, node count and incremental gain; hybrid remains two independent systems; different crew locations are explicit |
| RM-4.5 | Make interactions touch/keyboard usable and support antenna-height editing, visible probe selection, undo and reset | 4.1, 4.3 | Planned | Planner | User can place, inspect, edit, compare and undo without shift-click or precision dragging; loading/removing nodes clears stale probe/selection references |
| RM-5 | Feasible placement recommendations | — | Planned | Placement | RM-5.1–5.3 accepted |
| RM-5.1 | Generate candidate sites with boundary/access/power/mount restrictions, height options, locked nodes and device budget | 2.4, 3.1, 4.3 | Planned | Placement | Excluded sites never returned; unknown installation feasibility shown; stage/ridge availability is not presumed from legacy prose |
| RM-5.2 | Implement deterministic constrained greedy search with local swaps over shared RF and graph results | 3.3, 3.4, 5.1 | Planned | Placement | Compare small cases with exhaustive enumeration and document heuristic gap; baseline cannot silently worsen; disconnected high point cannot win for base coverage; cancellation and fixed seed work |
| RM-5.3 | Explain best-found alternatives with delta map, targets gained, residual gaps, bottleneck and each repeater's contribution | 4.4, 5.2 | Planned | Placement | Saved scenario reproduces ranking; recomputed full-resolution result validates shortlisted sites; show constraints and objective; never claim global optimality without proof |
| RM-6 | Responsive, stable calculation and rendering | — | Planned | Runtime | RM-6.1–6.3 accepted |
| RM-6.1 | Move RF/search to cancellable Web Worker with versioned jobs/results and immutable data transfer | 1.2, 2.2, 3.1 | Planned | Runtime | New inputs supersede stale results; errors/progress explicit; job key includes terrain/model/scenario; independent remote checks confirm worker/main-reference agreement |
| RM-6.2 | Cache terrain profiles, reuse scene objects, narrow subscriptions and dispose removed GPU resources | 4.1, 6.1 | Planned | Runtime | Overlay/selection changes do not rerun physics; bounded remote repeated-drag/preset check shows resource plateau after warmup; teardown reaches all owned objects |
| RM-6.3 | Bound analysis grids and search work; publish measured interaction and result-latency budgets | 4.4, 5.2, 6.2 | Planned | Runtime | On recorded remote reference browser/device: input feedback target <=100 ms; normal scenario settled-result target <=2 s; longer search shows progress/cancel; targets measured, not asserted as current results |
| RM-7 | Model validation and Vercel launch | — | Planned | Verification | RM-7.1–7.3 accepted |
| RM-7.1 | Integrate remote source, numerical, graph, scenario, optimizer and browser acceptance suite | 2.4, 3.4, 4.5, 5.3, 6.3 | Planned | Verification | Record commit + host + run ID + preview URL; independent oracles for critical math; unknown terrain, stale jobs, no nodes, missing data and failure states pass |
| RM-7.2 | Export field walk plan and import observed bidirectional delivery/RSSI/SNR with device and antenna configuration | 3.4, 4.3, 5.3 | Planned | RF | Calibrate on one observation set, evaluate held-out observations; publish error and confidence limits; without observations, release only as an explicitly uncalibrated planning estimate |
| RM-7.3 | Release accepted preview with versioned data/model, release notes and rollback reference | 1.4, 7.1, 7.2 workflow | Planned | Release | Production smoke matches accepted preview; source/model labels correct; assets and workers load; prior deployment retained; field-verified claims require actual 7.2 observations |

## Order and scope boundaries

E1 is RM-1 only: restore a runnable engineering preview. E2 is RM-2: establish the site source of truth. E3 is RM-3 with RM-6.1: deliver trusted model outputs in a worker. E4 is RM-4 with RM-6.2: make coverage and comparisons usable. E5 is RM-5 with RM-6.3: rank constrained placements. E6 is RM-7: validate and release. Each is a fresh phase-labeled task; update the Phase (SoT) before each handoff. Verification inside each work package is part of its acceptance, not deferred to the final phase.

Runtime cleanup and data inventory can proceed independently in separate resources. RF fixtures/profile definitions can begin while data is acquired. Placement search depends on trustworthy terrain, graph semantics and targets; doing it earlier would optimize an incorrect metric. Keep the first engineering preview clearly provisional while the later packages are unfinished.

## Acceptance contract for the repaired product

At any selected location the user can answer: which device can communicate with whom, through which relays, with what antenna height and limiting path, under which terrain/environment assumptions? A comparison changes hardware/layout while keeping the target definition visible. A placement result reports the best found feasible configuration under the user's device budget, explains gains and remaining gaps, and survives export/reload.

Use a versioned USGS-derived source surface and a metric coordinate contract for all analysis. Render simplification must not replace that source. Calculate directed path margin as transmit power + transmitting/receiving antenna gains - cable/connector losses - modeled propagation loss - receiving sensitivity; apply a separately declared fade allowance. Evaluate both directions when the communication task requires them. Separate physical path feasibility, protocol forwarding and application compatibility.

Coverage means a receiver at a target can reach the selected destination or required crew peers under the selected semantics. A direct footprint is an optional distinct overlay. An unknown cell contributes to unknown area, not to covered area and not to a denominator silently made smaller. The default comparison targets the same crew positions and occupied site polygons; base reachability is a separate explicit mode.

Optimize weighted reachable target area/POIs subject to device count, allowed locations/heights and required backbone connectivity. Break ties using lower hardware burden and stronger bottleneck margin; offer redundancy as an explicit constraint. Evaluate candidate heights as part of placement. Display best found, objective, constraint set, uncertainty band and alternatives. Start with bounded greedy selection plus local improvement; a full propagation server or global mixed-integer solver is not a prerequisite.

## Architecture decision

**Proposed:** retain React, TanStack Start, Vite, Nitro and Three.js. Replace site data and RF logic behind explicit modules; keep the initial product browser-driven with versioned local scenario storage and JSON exchange. Prepare raw GIS assets on z370 and deploy only clipped/derived browser assets. Compute coverage and optimization in a worker. Keep a true plan view and optional 3D registered to the same coordinates.

Vercel supports the existing Start/Nitro architecture, including automatic framework/output detection; use its supported preset rather than configuring this app as a plain `dist` SPA. The current Vercel guide recommends Node 24+. Establish compatible locked dependencies and the same runtime on the box and Vercel. [Vercel Start integration](https://vercel.com/docs/frameworks/full-stack/tanstack-start), [deployment guide](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel).

A plain static Vite SPA would also be possible, but conversion adds entrypoint/routing work without repairing terrain or RF. A Next.js rewrite would similarly add work without changing the analytical defects. Server GIS jobs and a database are unnecessary for the initial fixed-site planner; introduce them only for multi-site ingestion or authenticated collaborative scenarios. Device protocol uncertainty and site installation constraints remain explicit, regardless of hosting platform.

## Knowledge captured

Decision: repair the analytical chain in source → model → communication graph → result → UI order. Rationale: the current terrain, radio computation and displayed geometry disagree independently. Lesson: a prettier map or one heatmap patch cannot establish valid coverage. Reusable asset: this WBS, the linked audit, primary USGS inventory and remote reproduction record. Cross-project discovery pointer: Codex memory `project_ridgemesh_recovery.md`.
