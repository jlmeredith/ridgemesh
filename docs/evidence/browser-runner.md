# Remote browser acceptance runner

`scripts/browser-check.mjs` runs only outside macOS and requires `RIDGEMESH_RUN_ID` and `RIDGEMESH_REVISION`. Run it on z370 with Node `/home/jamie/.local/node24/bin/node` from the synchronized build directory. Chromium is provisioned through the locked Playwright package (`npx playwright install chromium`).

The runner starts a temporary Vite server, checks desktop imagery comparison and WebGL camera controls, performs five bounded zoom/fit interactions, checks mobile horizontal overflow, records console errors, imagery HTTP statuses and worker creation, then closes Chromium and terminates the server process group. It has a 150-second internal deadline; wrap the command in `timeout 180`. Set `RIDGEMESH_BROWSER_URL` to check a deployed preview without starting a server. Set `RIDGEMESH_EXTENDED_BROWSER=1` when the Evidence tab is present to verify measurement download/import and local persistence.

Results and raw element screenshots are written to `artifacts/<run-id>/` on the remote host. Raw screenshots are evidence only and must never be embedded or opened in model context. Pass screenshots through the doc-screenshots normalization gate, parse its JSON and use only returned successful paths. The installed skill currently references a missing normalization script; the orchestrator has been notified to restore a compatible gate before any image display.

The five interaction timings include Playwright control overhead and are not a scientific latency benchmark; DOM/canvas counts provide limited smoke evidence, not a claim of GPU-resource plateau. The runner does not validate field accuracy, imagery registration, RF mathematics or placement optimality. Those require their independent domain evidence.

## 2026-09-12 execution checkpoint

`ridgemesh-browser-20260912-second` ran on z370 against worktree snapshot based on `7f54183` and reached all eight initial interaction checks. Three imagery assets loaded successfully, worker calculation completed, WebGL/cardinal controls worked, field-log export/import survived reload, and the mobile plan had no horizontal overflow. The overall run correctly **failed** on React hydration errors: Node and Chromium projected coordinates differed around 1e-10 grid units in SVG attributes. The root owns the source correction and final rerun.

The first attempt encountered an unrelated service already using port 8080; the harness now allocates a free loopback port and rejects a failed temporary server startup. Existing services were left running. It now observes worker creation-to-result timing before application scripts load, and separately verifies full scenario JSON export/import persistence. All raw screenshots remain remote until normalized.

## Passing rerun

`ridgemesh-browser-20260912-third` ran on **z370**, Node 24, worktree snapshot based on `7f54183`, 2026-09-12 23:49:20–23:50:01 UTC. After the terrain transform precision correction, all ten browser assertions passed with **zero console errors and zero failed requests**. Full scenario JSON roundtrip, field-log persistence, three imagery acquisitions, synchronized comparison, desktop WebGL/cardinal controls and mobile layout were exercised.

A browser-side Worker observer installed before application scripts measured initial analysis at **482.5 ms reported computation** and **657.8 ms creation-to-result**. Five bounded zoom/fit interactions retained 1,155 DOM elements, 169 recorded resources and zero canvases after returning to plan. Playwright click roundtrip timings ranged 158–3,370 ms and do not establish the 100 ms input feedback budget or a GPU-resource plateau.

Primary remote report: `/home/jamie/ridgemesh-build-20260912/artifacts/ridgemesh-browser-20260912-third/browser-report.json`. Raw element PNGs are alongside it and require normalization before display. Deployment smoke and final committed-revision verification remain the orchestrator's responsibility.
