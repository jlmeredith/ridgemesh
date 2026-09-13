---
name: ridgemesh-remote-verification
description: Verify RidgeMesh numerical behavior, registered imagery and deployed browser flows on z370, preserving provenance and normalizing screenshots.
---

Use from an isolated RidgeMesh git worktree. Never run tests, builds, browsers or GIS processing on the Mac.

1. Run `npm run check:remote` to transfer the snapshot and run clean dependency installation, typecheck, lint, tests and build on z370. Preserve host, run ID and revision printed by the runner.
2. For browser acceptance, copy the current harness to the remote checkout and run Node 24 there with `RIDGEMESH_RUN_ID`, `RIDGEMESH_REVISION` and `RIDGEMESH_BROWSER_URL=https://ridgemesh.vercel.app`. Execute `timeout 480 node scripts/planner-browser-check.mjs`. Omitting BROWSER_URL starts a temporary remote dev server; never describe that run as deployed verification. The old `browser-check.mjs` preserves first-release evidence and has outdated UI assumptions.
3. Keep browser runs isolated when measuring performance. Inspect `artifacts/<run>/browser-report.json`; require all 14 current checks, actual deployed revision, no console errors and successful imagery requests. Check default aerial view, source-site inspection, location/height edits, minimum mast application, comparisons preserving the current plan, proposed coverage before apply, repeated close/reopen, import/export and mobile. Separate cold worker creation/network time from reported calculation time. Do not claim a strict latency target from a different metric.
4. Capture only scoped app elements. Normalize each raw capture using `scripts/normalize_screenshot.py` on the remote host before viewing; read the script's CLI help, parse its JSON, and expose only a successful normalized output path. Remote terrain Python with Pillow is `/home/jamie/ridgemesh-terrain-20260912/venv/bin/python`.
5. Record deployment ID, commit, canonical URL, test/browser evidence, source/model versions and rollback deployment in `docs/PLANNER-CORRECTION-RELEASE-2026-09-13.md`. Site-registry schema 2 supersedes the first release's misplaced event geometry. Keep unsurveyed vectors, partial ground-control evidence and absent field calibration explicit. Release coverage only as Planning estimate until actual observations justify stronger claims.
