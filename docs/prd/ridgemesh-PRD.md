# ridgemesh — Product Requirements

| Field | Value |
|---|---|
| Artifact ID | PRD-ridgemesh |
| Status | Draft |
| Owner | Jamie |
| Last Updated | 2026-10-13 |
| Plan | `docs/plans/ridgemesh-PLAN.md` |

## Overview

RidgeMesh is the organizer-side terrain and radio planner for the AstralMesh Meshtastic deployment at Astral Valley, built for Nocturnal Valley 2026 (September 23–27). Its retained P4/P5 release records define an inventory-constrained fixed network serving roaming participants. P4 retired Totem; P5 introduced terrain-first comparisons, actual-scale 3D and a MediumFast planning baseline. This draft records that direction without approving a new product scope, PR2 merge or post-event disposition.

## Problem statement

Organizers need to compare plausible fixed-radio sites, heights and equipment across the park's terrain while seeing the assumptions and limits of the predicted coverage. The original Grok scaffold on `main` predates the recovery. Its three-radio/Totem comparison is not the retained P5 product contract. Model output cannot establish field coverage, safe installation, capacity or delivery probability.

## Source boundary

The source reviewed for this correction is unmerged PR2 at **2ab6a6a28f92d570ebde9f3762051ebda552e2fe**. Its immutable [P4 inventory release](https://github.com/jlmeredith/ridgemesh/blob/2ab6a6a28f92d570ebde9f3762051ebda552e2fe/docs/INVENTORY-PLANNER-RELEASE-2026-09-13.md) and [P5 terrain release](https://github.com/jlmeredith/ridgemesh/blob/2ab6a6a28f92d570ebde9f3762051ebda552e2fe/docs/TERRAIN-SCENARIOS-RELEASE-2026-09-13.md) are the requirements evidence; those release files are absent from this docs PR's `main`-based tree. Their dated deployment and validation records are historical evidence, not fresh production verification. The plan retains the September 29–30 observations; no live application acceptance was performed for this correction.

## Scope

- In scope: fixed-radio placement constrained by explicit inventory, finite site/height candidates and a budget; terrain-first scenario comparison; actual-scale 3D with 2D and registered imagery alternatives; modeled two-way route margins; preservation of user scenarios and physical equipment identities.
- Out of scope: retired Totem comparison; live telemetry, packet scheduling or capacity simulation; claims of calibrated field coverage; changing the separate astral-mesh or festival-mesh projects; deciding PR2 or the post-event future on Jamie's behalf.

## Requirements

- R1 — Display the retained USGS terrain and site frame at actual 1× relief, with antenna AGL at the same metre scale. Keep imagery, labels, layers, 2D and 3D inspection available. Readable radio markers do not imply physical mast dimensions. Source: P5 display contract.
- R2 — Compute the fixed deployment from a mandatory P1 and explicitly entered or assumed support inventory. Respect budget, role, site, height and physical identity constraints; roaming participant counts must not create fixed coverage. Optional G3/spares require explicit inclusion. Source: P4 equipment/search contract.
- R3 — Show landscape coverage from the weaker forward/return modeled route margin, with explicit strong, marginal, no-route and unknown states. Preserve event-area scoring separately from landscape display extent; present signal reserve as model output, not measured RSSI or delivery probability. Source: P5 display contract.
- R4 — Compare the recommended network, R1-only and alternate-site scenarios without changing saved equipment until Apply. Preserve physical IDs, locked edits, roaming test points, prior-plan backups and supported legacy scenario bytes. Source: P4 customization and P5 comparison contracts.
- R5 — Expose RF assumptions and per-radio overrides. Record the P5 MediumFast baseline and derived −126 dBm receiver threshold as a documented planning inference, not a measured device specification; retain custom legacy settings under the documented migration rules. Source: P5 baseline contract.

## Acceptance criteria

- A1 — Before any product acceptance, run the applicable typecheck, lint, numerical/state tests and production build on an approved worker host, with exact source SHA, host and run ID. Documentation checks alone do not satisfy this criterion.
- A2 — Verify inventory/identity constraints, bounded search, scenario comparison and saved-data preservation against R2/R4, with remote browser evidence and inspected normalized screenshots. The P4/P5 historical records support the RGM-1 delivery history; this docs correction does not repeat or renew that acceptance.
- A3 — Verify actual-scale terrain/AGL, imagery, every named-ground POI and its note, and margin-state rendering against R1/R3/R5, including mobile bounds and model-versus-field labeling. Retain the existing RM-6.3 ≤2 s target or obtain Jamie's explicit rebaseline; no target is waived here.
- A4 — Field/model agreement remains unverified (RGM-4.5 / RM-7.2). Calibration requires observations and held-out evaluation, not a saturated modeled coverage percentage.

## Constraints and dependencies

- PR2 is still open at the reviewed SHA (GitHub read, 2026-10-13). RGM-2.1 requires Jamie's disposition before recovered code is consolidated onto `main`.
- The historical production URL is https://ridgemesh.vercel.app. No current alias, hardware setting, capacity or field result is asserted by this review.
- Site inputs, device settings and field observations remain gated by RGM-4.1, RGM-4.3 and RGM-3.2. The separate astral-mesh recommendations and festival-mesh reuse decision do not authorize edits in either project.
- Current validation runs on approved lab hosts; do not enable hosted CI or deployment compute to validate this docs correction. Historical release records retain the checks they actually used.

## Open questions

- Q1 — Should RidgeMesh continue, be exempted from the docs rule, or be archived after the event? Jamie decides RGM-3.1.
- Q2 — Should the recovered planner in PR2 merge into `main`? Jamie decides RGM-2.1; the docs PR does not decide it.
- Q3 — Were node DB, RSSI/SNR, location, antenna and firmware observations collected? Jamie resolves RGM-3.2 before field calibration.
- Q4 — Should festival-mesh adopt the recovered engine? RGM-3.3 remains a separate owner decision.
