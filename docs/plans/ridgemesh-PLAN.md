# RidgeMesh — Plan

| Field | Value |
|---|---|
| Artifact ID | PLAN-ridgemesh |
| Status | Active |
| Last Updated | 2026-09-30 |
| WBS | `docs/wbs/ridgemesh-WBS.md` |

## Goal

RidgeMesh is the organizer-side 3D radio planner for the AstralMesh Meshtastic deployment at Astral Valley Art Park, built for Nocturnal Valley 2026 (Sept 23–27, 2026). It works out where fixed radios should go so that attendees carrying radios can reach each other across real terrain. It is published at https://ridgemesh.vercel.app.

Sources: `README.md`; `docs/INVENTORY-PLANNER-WBS.md` on `codex/planner-correction`; the event dates come from the astral-mesh field guide (`public/index.html`).

This plan does not add product goals. It records what has shipped, gets that work onto `main`, and asks Jamie what RidgeMesh should become now that the event is over.

## Where it stands (checked 2026-09-29, re-checked 2026-09-30)

| Fact | Evidence |
|---|---|
| Production is live and serves the recovered planner, not `main` | `GET https://ridgemesh.vercel.app` → 200. `/data/optimized-plan.json` returns `version: astral-mediumfast-start-v1`. That file exists only on `codex/planner-correction`; `main` has no `public/data/` |
| `main` (47a5558, 2026-09-09) is still the original Grok export | `git log origin/main`. The recovery audit (`docs/RECOVERY-AUDIT-2026-09-12.md` on PR #2) lists its P0 defects: hand-shaped terrain, coverage that ignores mesh connectivity, graph traversal that cannot advance, and a build that fails |
| None of the planner work has been merged: five phases, 14 commits | `codex/planner-correction` @ 2ab6a6a. Draft PR jlmeredith/ridgemesh#2 is open (GitHub API, 2026-09-29; `gh pr view` 2026-09-30: OPEN, draft, head 2ab6a6a). PR jlmeredith/ridgemesh#1 (`codex/recovery-build`) is closed, and its commits are ancestors of PR #2 |
| The phase WBS docs exist only on that branch | `docs/RECOVERY-WBS.md`, `PLANNER-CORRECTION-WBS.md`, `OPTIMIZED-START-WBS.md`, `INVENTORY-PLANNER-WBS.md`, `TERRAIN-SCENARIOS-WBS.md`. Their status words: 50 rows `Accepted` and 6 `Accepted release`, which Portfolio does not recognise; 24 `Implemented` and 9 `Partial evidence` / `Partial performance`, which Portfolio reads as In progress |
| A local fix to the old `main` app has not been pushed | `fix/grok-pwa-shared-escapehtml` @ bafd058 (2026-09-29, worktree `.claude/worktrees/blissful-lewin-5fbf42`). It repairs `scripts/grok-pwa-shared.mjs` and adds `docs/captures/astral-valley-overview-v4-backbone.png` for festival-mesh FM-3.3. PR #2 deletes that Grok scaffold (RM-1.1), so this fix and the merge collide |
| festival-mesh reuses pre-recovery code | `festival-mesh/docs/FM-4-placement-engine.md`: `scripts/placement/ref/` holds copies of `src/lib/{terrain,radio}.ts` taken at 47a5558. That is the baseline the recovery audit found defective, not the recovered engine |
| Evidence items still open in the release records | RM-2.3.2 and RM-2.3.3 have no surveyed ground control or authoritative site vectors, and RM-2.4 (which depends on them) is `Partial evidence`. RM-3.1 hardware profiles are assumptions. RM-6.3: cold worker creation-to-result was measured at 2676 ms against a ≤2 s target. RM-7.2 has no field observations, so the release is an uncalibrated planning estimate. Sources: `docs/RECOVERY-RELEASE-2026-09-12.md` and the status column of `docs/RECOVERY-WBS.md`, both on PR #2 |

## Done means

- `main` holds the deployed planner and its phase WBS history, and the production SHA is contained in `main`. That requires PR #2 to be merged, or closed by Jamie with a reason. The collision with bafd058 is resolved.
- Every open WBS under `docs/` uses Portfolio status words, and `node portfolio/src/cli.mjs check ridgemesh` against the main checkout prints PASS or WARN.
- Jamie has recorded the post-event disposition: keep building, exempt, or archive. This feeds PF-4.1.
- If Jamie decides to keep building: each open evidence item (RM-2.3.2, 2.3.3, 2.4, 3.1, 6.3, 7.2) is closed with evidence, or Jamie defers it.

## Approach

1. **RGM-1 Record what shipped.** Add one Done row for each delivered phase, with deployment and remote-run evidence.
2. **RGM-2 Consolidate onto `main`.** Jamie decides PR #2. The bafd058 fix is then folded in or dropped. The legacy WBS docs move to Portfolio status words.
3. **RGM-3 Post-event disposition.** Jamie decides what RidgeMesh is now, whether any field observations exist, and how it relates to festival-mesh.
4. **RGM-4 Close open evidence.** Only if RGM-3.1 is "keep building". Each item needs site, hardware or field data that only Jamie or the organizers have.

## How it will be checked

- **RGM-2:** `git merge-base --is-ancestor 3e0dde1 origin/main` succeeds; the Vercel production deployment SHA is on `main`; the Portfolio check against the main checkout prints PASS or WARN.
- **RGM-4:** use the acceptance text for each item in `docs/RECOVERY-WBS.md`. Every test, build or browser run happens on z370 or hosted CI, and each result records its host and run ID. Nothing runs on the Mac.

## Decisions and open questions

| Decision | Choice | Why | Date |
|---|---|---|---|
| Branch base for this plan | `docs/pf-4.2b-plan-wbs`, docs-only, based on `origin/main` (47a5558) | Merging these docs must not bring in the 14 commits of PR #2. That merge is Jamie's decision | 2026-09-29 |
| WBS ID prefix | `RGM-` | Avoids clashing with the RM-, PC-, OS-, IP- and TS- rows once PR #2 lands; Portfolio flags one ID that appears with two statuses | 2026-09-29 |
| bafd058 after a PR #2 merge | Keep only the FM-3.3 capture PNG, then delete the branch | PR #2 removes the file the fix repairs. The bafd058 message says the capture was taken for the festival-mesh FM-3.3 comparison; festival-mesh does not reference the file yet (grep of its docs and history, 2026-09-30) | 2026-09-29 |
| Open: merge PR #2? | Jamie (RGM-2.1) | Production already runs this code; `main` does not | — |
| Open: post-event disposition | Jamie (RGM-3.1) | The event window has passed; this goes to PF-4.1 | — |
