# Astral Valley planner correction — 2026-09-13

**Phase (SoT):** [#ridgemesh·P2] Event-grounded planner → production
**Status:** Implementation and remote browser acceptance complete; Vercel release in progress.
**Baseline:** `4efc76e` documentation/harness; previous production application `fec8677010d7577f098541d1932761ba0a71bc77`.

## What changed

Jamie's review found material location errors and a map dominated by a green coverage wash. The first release's software checks did not validate the inherited event locations. This correction replaces that site layer and organizes the app around the radios, sites, antenna heights and coverage users are planning.

Official [2023 Rekinection](https://rekinection.com/wp-content/uploads/2023/05/REKINECTION_MAP_2023-1.png), [2024 ReJuvenation](https://rekinection.com/wp-content/uploads/2024/05/Final-Map-2024.png), [2025 Cosmic Kinection](https://rekinection.com/wp-content/uploads/2025/05/CKmap25-updated-small.jpg), [venue](https://www.astralvalley.com/venuemap) and [climbing](https://www.astralvalley.com/camp) maps establish naming and relative placement. Visible NAIP roofs and clearings establish the displayed positions. Main Stage now sits at the southwestern end of the mainfield; Family camp is in the western valley corridor, Stargazer is on the central hilltop, Harmony follows the eastern wooded road and Dreamcatcher occupies the clearings across the creek. Unsupported east-meadow and individual spring points were retired.

An independent withheld-control check found roughly 63–66 m discrepancies between building symbols on the illustrated relief map and aerial roof picks. We rejected a single affine fit of those symbols as precise site coordinates. The USGS DEM and georeferenced imagery were not shifted or sculpted to make an illustration fit. Source control pairs, residuals, feature coordinates and a three-acquisition comparison are retained in the [registration evidence](evidence/event-map-registration-20260913.md).

The default map is clean aerial photography with event-use outlines and numbered handhelds; no preinstalled relay or coverage wash is assumed. Users can pan, zoom, inspect named places, move a device by drag or site selection, edit its height and choose the base. Optional coverage uses distinct samples only inside the selected event-use areas. Source/date switching, satellite swipe, contours and terrain-draped 3D remain available.

Comparisons preserve current crew positions, heights and applicable radio settings. Strong, weak, unavailable and unknown coverage are separate. The same 40 m target raster and weights drive displayed coverage and placement scoring. The optimizer tests allowed sites and heights under a relay budget, permits a relay beside a handheld and prefers fewer relays and lower sufficient heights when coverage ties. Proposed markers and recomputed coverage are visible before application, with before/after coverage and readable gains/gaps. Closing the preview restores the actual plan.

The direct-path inspector calculates the lowest tested antenna height at the From endpoint, holding the To height fixed. It distinguishes sampled bare-earth line-of-sight and 60% first-Fresnel geometry from the height meeting a 6 dB modeled margin in both directions. Unknown and over-cap results produce no invented required height. Applying a result edits that endpoint and recomputes the plan.

## Source and scenario contracts

Site registry: `astral-source-reconciliation-20260913-v1`. RF model: `ridgemesh-rf-3.0`. The terrain remains the existing source-derived 10 m EPSG:26915 vertex grid. Runtime imagery retains its shared physical extent: NAIP June 2022 and two distinct Sentinel-2 June/November 2024 acquisitions. Displayed raster coverage samples are 40 m; exact location inspection and terrain-path analysis are separate calculations.

Scenario schema 2 stores the site, terrain and model versions. Previous schema-1 imports fail visibly, and old browser storage is retained under its previous key instead of silently reusing misplaced sites. Base and selected-crew references reconcile when nodes are added, deleted or restored. Worker requests cancel pending debounce work so an older scheduled analysis cannot overwrite a user-triggered comparison or optimization. POI metadata is whitelisted before constructing receiver hardware; a place kind such as `camp` cannot leak into the radio model.

## Verification provenance

All tests, builds, browser automation and GIS processing ran on **z370** or hosted CI, never the Mac. Root integration run **planner-correction-final-20260913**, worktree snapshot based on `4efc76e`, passed **43/43 tests**, TypeScript, ESLint with zero warnings and the Nitro Vercel production build. Final root run **planner-marker-final-20260913** passed TypeScript, ESLint, production build and **14/14 browser checks** after the preview and colocated-marker changes. This was remote dev-server browser acceptance; it is not presented as deployed verification. The primary report is retained on z370 under `artifacts/planner-marker-final-20260913/browser-report.json`.

Root inspected the normalized default aerial and proposed-coverage captures and corrected overlapping colocated relay markers with a display offset and leader line to the unchanged location. Browser checks exercise actual site inspection, base movement and height changes, the RF mast solver/apply operation, comparisons preserving the current scenario, proposed coverage with before/after metrics, repeated preview close/reopen, one-relay budget/height-cap application, exact schema-2 export/reload, all imagery sources/3D and mobile. There were no browser runtime/hydration errors or failed requests. The [preceding preview report](evidence/planner-browser-preview-20260913.json) and normalized default/proposed views are committed; canonical production evidence follows below.

Root checked the source registration figure and original organizer maps, numerical fixtures against independent geometric/RF and PROJ/source-height oracles, and the primary test output. This verifies the implemented transformations and calculations, not surveyed boundaries or real packet delivery. The [domain evidence](evidence/planner-domain-correction-20260913.md) retains the coarse-sampling failure and corrected 40 m result: four weak cells missed by the earlier raster become visible; baseline and proposed scores now use identical target weights. Those default-scenario values are model observations, not coverage promises.

## Remaining data limits

Camp polygons, roads under canopy and access assumptions remain interpreted. Feature allowances of 25–80 m are judgmental planning allowances, not statistical error bars. No authoritative legal boundary, canopy raster, installation permissions, verified hardware SKU/settings or field RF measurements were available. Default nodes are illustrative crew positions. Totem configuration remains unknown unless the user explicitly supplies assumptions. The mast result is an RF planning threshold, not structural engineering or installation approval; relay search is bounded and does not prove a global optimum.

## Operations and release evidence

Vercel project `ridgemesh`, ID `prj_t9DUwu4aWVM1FmPn8sTrHiZALLOP`, existing Jamie team and GitHub repository. Node 24, TanStack Start/Vite/Nitro, no new connector secret or database required. The canonical application remains [ridgemesh.vercel.app](https://ridgemesh.vercel.app). Deployment IDs, exact revision and final production browser evidence will be appended after acceptance.

Rollback reference for this change is preceding production `dpl_FCdHqrsYcHPsKby6ARE6aH4CFnjP` at `fec8677010d7577f098541d1932761ba0a71bc77`. It retains the location/presentation defects this correction addresses and should only be a temporary service rollback. Do not return to original broken Grok revision `47a5558`.

## Knowledge captured

Decision: use historic event maps for venue names/topology and georeferenced aerial features for location picks; keep uncertainty explicit. Rationale: illustration symbols are displaced and may differ between events. Lesson: passing terrain/RF tests cannot validate an inherited site layer or a usable planning workflow. Area sampling must be the same in optimization and displayed results, and fine enough to reveal weak pockets. Reusable asset: `scripts/planner-browser-check.mjs` exercises the corrected planning tasks; `.Codex/skills/ridgemesh-remote-verification/SKILL.md` routes future checks to z370. Codex memory `project_ridgemesh_recovery.md` cross-links this record. The detailed Graphiti payload was rejected by automatic approval review; no private-payload workaround was attempted.
