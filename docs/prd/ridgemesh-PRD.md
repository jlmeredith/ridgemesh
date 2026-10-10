# ridgemesh — Product Requirements

| Field | Value |
|---|---|
| Artifact ID | PRD-ridgemesh |
| Status | Draft |
| Owner | Jamie |
| Last Updated | 2026-10-10 |
| Plan | `docs/plans/ridgemesh-PLAN.md` |

## Overview

RidgeMesh is the organizer-side 3D radio planner for the AstralMesh Meshtastic deployment at Astral Valley Art Park (French Village, St. Francois County, MO), built for Nocturnal Valley 2026 (Sept 23–27, 2026). It shows where fixed radios should go so that attendees carrying radios can reach each other across the real ridge-and-creek terrain, comparing Totem Compass (2.4 GHz) against a LoRa Meshtastic deployment (ThinkNode M1 / Heltec V4) on Koester-quad terrain. It is published at https://ridgemesh.vercel.app. Sources: `README.md`; `docs/plans/ridgemesh-PLAN.md`.

## Problem statement

Organizers planning the deployment had no way, before the event, to see whether radios would reach across the park or how 2.4 GHz Totem Compass compares with 915 MHz Meshtastic. Flat festival maps hide terrain: the ~100 ft climb onto the 785 ft Stargazer hilltop and the spring-fed Plattin Creek drain block line of sight, so coverage gaps would only surface during the event. The recovery audit (`docs/RECOVERY-AUDIT-2026-09-12.md`, PR jlmeredith/ridgemesh#2) found the original Grok export had hand-shaped terrain and coverage that ignored mesh connectivity, which is why the planner needed rebuilding on USGS heights.

## Scope

- In scope:
  - A 3D terrain model of Astral Valley from USGS NED 10 m heights, with 20-ft contours, spot elevations (785 / 824 / 885 / 920 / 922 ft) and a satellite-registered camp layout (lodge, Main Stage field, Stargazer hilltop, Plattin Creek).
  - Placing, moving and erasing three radio kinds: Totem Compass (2.4 GHz), ThinkNode M1 (915 MHz handheld) and Heltec V4 (915 MHz ridge repeater).
  - Coverage/range rings with radio shadows and link colour, plus coverage statistics and ground-truth knobs.
- Out of scope:
  - The separate astral-mesh public site; RidgeMesh only wrote recommendations for it (`docs/ASTRALMESH-PLANNING-RECOMMENDATIONS-2026-09-13.md`), and they were not applied before the event.
  - The festival-mesh repository, which reuses pre-recovery copies of `src/lib/{terrain,radio}.ts`.
  - Live radio telemetry and calibration of the RF model against field observations (still open, RGM-4.5).

## Requirements

- R1 — Render the real terrain of Astral Valley with USGS NED 10 m heights, exact 20-ft contours and spot elevations, and the satellite-registered camp layout. (`src/lib/terrain.ts`, `src/lib/valley-gl.ts`)
- R2 — Let the organizer place, move and erase nodes of the three radio kinds, with kind metadata (Totem Compass 10 dBm / 1.4 m AGL / 2.4 GHz; ThinkNode M1 22 dBm; Heltec V4 28 dBm). (`src/components/side-panel.tsx`, `src/lib/radio.ts`)
- R3 — Compute and show range rings per system with radio shadows (solid = LOS, dashed = would have to go through a hill) and link colour (green clear, gold around a bend, red through a mountain). (`src/lib/radio.ts`, `src/lib/valley-gl.ts`)
- R4 — Provide placement presets (Totem crew of 5, M1 handhelds, V4 backbone, hybrid) and report coverage stats (Totem/LoRa wash %, camps reached, node counts). (`src/lib/store.ts`, `src/lib/radio.ts`)
- R5 — Expose ground-truth knobs that change the model: crowd density, dry-bag loss, handheld rebroadcast (CLIENT vs CLIENT_MUTE), Meshtastic hop limit, and other Totems on site. (`src/components/side-panel.tsx`, `src/lib/store.ts`)

## Acceptance criteria

- A1 — The app builds and `npm run typecheck` passes; per `docs/plans/ridgemesh-PLAN.md` these run on z370 or hosted CI, never on the Mac.
- A2 — For the V4 backbone preset the ridge hop over Stargazer shows clear rather than as a shadow, and the camps reached match the placement (`docs/wbs/ridgemesh-WBS.md`, RGM-1.3–1.6 release records).
- A3 — Every named-ground POI appears on the map with its note. (`src/lib/terrain.ts`, `src/components/side-panel.tsx`)
- A4 — Open: no field measurement exists yet to confirm the modelled coverage matches the ground (RGM-4.5, RM-7.2).

## Constraints and dependencies

- Terrain and radio live in `src/lib/terrain.ts`, `src/lib/radio.ts` and `src/lib/valley-gl.ts`; state is in `src/lib/store.ts`.
- Stack: React 19, TanStack Start/Router, three.js, zustand, Tailwind v4, built with Vite (`package.json`).
- Production is Vercel at https://ridgemesh.vercel.app; production currently serves the recovered planner from `codex/planner-correction`, not `main` (draft PR jlmeredith/ridgemesh#2).
- Depends on the separate astral-mesh site (recommendations only) and on festival-mesh, which holds pre-recovery copies of the terrain and radio modules.
- Closing the open evidence items needs site, hardware or field data that only Jamie or the organizers hold (RGM-4.1, RGM-4.3).

## Open questions

- Q1 — After the event window (Sept 23–27, 2026), what should RidgeMesh become: keep building, exempt from the docs rule, or archive? (RGM-3.1, feeds PF-4.1)
- Q2 — Should the deployed `codex/planner-correction` code be merged into `main` via draft PR #2? Production already runs it; `main` does not. (RGM-2.1)
- Q3 — Were field observations (node DB, RSSI or SNR exports, device and antenna settings) collected at the event? If not, RF calibration is deferred. (RGM-3.2, RGM-4.5)
- Q4 — Should festival-mesh reproduce the recovered engine instead of the pre-recovery code at 47a5558? (RGM-3.3)
