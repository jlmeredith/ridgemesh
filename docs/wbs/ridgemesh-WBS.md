# RidgeMesh — Work Breakdown

| Field | Value |
|---|---|
| Artifact ID | WBS-ridgemesh |
| Source Plan | `docs/plans/ridgemesh-PLAN.md` |
| Status | Active |
| Last Updated | 2026-09-30 |

**Phase (SoT):** [#ridgemesh·P6] Consolidate onto main → post-event disposition

Status words: **Not started**, **In progress**, **Blocked**, **Done**, **Deferred**. Rows owned by `Jamie` appear under "Needs you". Evidence for the RGM-1 rows lives on `codex/planner-correction` (draft PR jlmeredith/ridgemesh#2) until that PR merges. All tests, builds and browser checks run on z370 or hosted CI, never on the Mac.

| WBS ID | Work package | Done means | Owner | Depends on | Status |
|---|---|---|---|---|---|
| **RGM-1** | **Record what shipped (2026-09-09 → 2026-09-13)** | | | | |
| RGM-1.1 | Original Astral Valley RF planner (Grok export) | App code on `main` | Jamie | | Done — 47a5558 on origin/main, 2026-09-09 |
| RGM-1.2 | P1 Recovery: reproducible runtime, USGS terrain, RF model, worker, Vercel release (RM-1…RM-7) | Recovered planner accepted in production | Codex | RGM-1.1 | Done — app fec8677, 16/16 browser checks, z370 run `ridgemesh-production-fec8677-final` (`docs/RECOVERY-RELEASE-2026-09-12.md`). Open evidence items move to RGM-4 |
| RGM-1.3 | P2 Planner correction: sourced venue geometry, device roles, height-aware placement (PC-1…PC-4) | Corrected planner accepted in production | Codex | RGM-1.2 | Done — app 2ddbc86, `dpl_3FLar7MJBGq6yb3dEjCq4kNkkzBJ`, z370 run `planner-production-2ddbc86-verified-20260913` (`docs/PLANNER-CORRECTION-WBS.md`) |
| RGM-1.4 | P3 Optimized start and progressive detail (OS-1…OS-3) | Optimized starter accepted in production | Codex | RGM-1.3 | Done — app 0de9e36, `dpl_DKjWpzqfzoRWuwW83iFzRH8C376g`, z370 run `optimized-start-production-0de9e36-20260913`, 22 checks (`docs/OPTIMIZED-START-WBS.md`) |
| RGM-1.5 | P4 Inventory-driven placement; Totem retired (IP-1…IP-4) | Equipment-aware planner accepted in production | Codex | RGM-1.4 | Done — app c9e6d60, `dpl_FRzjzuPwPeHFNQKDEh1TXEH9fLNw`, z370 run `inventory-production-c9e6d60-20260913`, 27/27 (`docs/INVENTORY-PLANNER-RELEASE-2026-09-13.md`) |
| RGM-1.6 | P5 Terrain-first scenarios, actual-scale 3D, MediumFast baseline (TS-1…TS-3) | Current production build accepted | Codex | RGM-1.5 | Done — app 3e0dde1, `dpl_Bx3cmRbkjcEV8S8c6DJbSe22gb4p`, z370 run `terrain-production-3e0dde1-20260913`, 22/22 (`docs/TERRAIN-SCENARIOS-RELEASE-2026-09-13.md`). Site still serves this starter (`astral-mediumfast-start-v1`, checked 2026-09-29 and 2026-09-30) |
| RGM-1.7 | AstralMesh planning recommendations for the separate astral-mesh site | Recommendations written; astral-mesh left unchanged | Codex | RGM-1.6 | Done — `docs/ASTRALMESH-PLANNING-RECOMMENDATIONS-2026-09-13.md`. They were not applied before the event: astral-mesh's last site commit is 533640a (2026-09-12 19:16 -0600), before this doc's commit 2ab6a6a (23:09 the same day); astral-mesh has had only PF-4.2 plan/WBS docs since |
| **RGM-2** | **Consolidate onto main** | | | | |
| RGM-2.1 | Decide draft PR #2 (`codex/planner-correction` → `main`) | PR #2 is merged, or closed with a reason. After a merge, `git merge-base --is-ancestor 3e0dde1 origin/main` succeeds, so production and `main` agree | Jamie | | Not started |
| RGM-2.2 | Resolve local branch `fix/grok-pwa-shared-escapehtml` (bafd058, unpushed) | If PR #2 merged: keep only `docs/captures/astral-valley-overview-v4-backbone.png` (taken for the festival-mesh FM-3.3 comparison per the bafd058 message; festival-mesh does not reference it yet), then delete the branch and its worktree. If PR #2 closed: open a PR for bafd058 | Claude | RGM-2.1 | Not started |
| RGM-2.3 | Move the five phase WBS docs to Portfolio status words | `Accepted` / `Accepted release` → Done; `Implemented` → Done where the release record accepts it; `Partial …` → In progress. `node portfolio/src/cli.mjs check ridgemesh` on the main checkout prints PASS or WARN | Claude | RGM-2.1 | Not started |
| **RGM-3** | **Post-event disposition (event window Sept 23–27, 2026 has passed)** | | | | |
| RGM-3.1 | Decide what RidgeMesh is now | One choice is recorded here and on the board: keep building (next event or field calibration), exempt from the docs rule, or archive. Feeds PF-4.1 | Jamie | | Not started |
| RGM-3.2 | Confirm whether field observations were collected at the event | Yes: location of node DB, RSSI or SNR exports, with device and antenna settings. No: RGM-4.5 becomes Deferred | Jamie | | Not started |
| RGM-3.3 | Decide whether festival-mesh should reproduce the recovered engine instead of 47a5558 | Decision passed to the festival-mesh owner session. festival-mesh itself is not edited from this repo | Jamie | RGM-2.1 | Not started |
| **RGM-4** | **Close open evidence items (only if RGM-3.1 = keep building)** | | | | |
| RGM-4.1 | Supply site inputs: surveyed ground control, legal boundary, camp polygons, access, power and mount permissions | Files or sources handed over with provenance | Jamie | RGM-3.1 | Not started |
| RGM-4.2 | Close RM-2.3.2, RM-2.3.3 and RM-2.4 with those inputs | Per-view residuals against withheld check points within the tolerance in `RECOVERY-WBS.md`; site layers sourced; evidence pack updated | Cursor | RGM-4.1 | Not started |
| RGM-4.3 | Record the radio SKUs and firmware settings actually used (RM-3.1) | Each hardware profile has a primary source or an observed setting instead of an assumption | Jamie | RGM-3.1 | Not started |
| RGM-4.4 | Meet the RM-6.3 settled-result target (≤2 s) or rebaseline it | Measured on the recorded remote reference browser on z370 with a run ID, or Jamie accepts a revised target | Cursor | RGM-3.1 | Not started |
| RGM-4.5 | Calibrate the RF model on field observations (RM-7.2) | Calibrated on one set, evaluated on held-out observations; error and confidence limits published | Cursor | RGM-3.2, RGM-4.3 | Not started |
| RGM-4.6 | Independently verify RGM-4.2–4.5 against primary sources | Verification note cites host, run ID and source for each claim | Claude | RGM-4.2, RGM-4.4, RGM-4.5 | Not started |
