# Astral Valley planning correction

**Phase (SoT):** [#ridgemesh·P2] Event-grounded planner → production
**Status:** Source, model and browser acceptance complete; releasing to Vercel.
**Baseline:** 4efc76e; deployed application fec8677.

The earlier release established a runnable analytical engine but retained incorrect venue geometry and made the blanket coverage layer the dominant view. This correction must establish sourced venue geometry and make user-selected equipment, locations, required antenna heights and coverage gaps the planning workflow.

| WBS ID | Deliverable | Owner | Status | Acceptance |
|---|---|---|---|---|
| PC-1 | Source-correct venue geometry | Event-map research | Accepted | Child packages accepted |
| PC-1.1 | Official historic event and relief-map inventory | Event-map research | Accepted | Original source URLs/dates and actual images inspected; artwork distinguished from surveyed geometry |
| PC-1.2 | Registered stage, lodge, camping zones, roads/creek and mount sites | Event-map research | Accepted | Stable NAIP/relief-map anchors checked independently; wrong legacy labels replaced or retired; uncertain geometry carries source/accuracy evidence |
| PC-1.3 | Shared versioned site targets and inferred land-cover geometry | Event-map research | Accepted | Site labels, baseline crew positions, cover masks and analysis targets use one corrected registry; no DEM sculpting |
| PC-2 | Useful map and node planning workflow | Root + controls | Accepted | Child packages accepted |
| PC-2.1 | Clean aerial-first map with useful framing, readable event zones and opt-in coverage | Root | Accepted | No green wash on initial map; pan/zoom, select target/site/device, and clear classification legend work in desktop/mobile |
| PC-2.2 | Explicit device roles, site selection and antenna heights | Controls + root | Accepted | Start without preinstalled relays; visible roster maps numbered devices to map; user edits placement and mast height without advanced RF controls |
| PC-2.3 | User-layout comparison and selected target/path explanation | Root + controls | Accepted | Hardware comparisons preserve actual crew locations/targets; selected result identifies both directions, relay path, weakest margin, current heights and gaps |
| PC-3 | Height-aware coverage and feasible placement | RF | Accepted | Child packages accepted |
| PC-3.1 | Receiver AGL, robust/marginal separation and strongest valid graph routes | RF | Accepted | Independent asymmetric/hop/height fixtures; unknown remains unknown; crew peers stay in compatible system |
| PC-3.2 | Minimum tested mast-height guidance | RF + controls | Accepted | Sampled LOS/60%-Fresnel geometric requirements separate from tested bidirectional RF margin; over-cap/unknown explicit; apply-height recomputes result |
| PC-3.3 | Shared target objective and site-by-height optimization | RF + root | Accepted | Polygon/area and exact site targets consistently used; colocated handheld/relay allowed; lower sufficient height preferred; connected pair lookahead bounded; gains/gaps recomputed |
| PC-4 | Remote acceptance and replacement release | Root | Active | Child packages accepted |
| PC-4.1 | Primary-source spatial and numerical verification | Root | Accepted | Control points/source imagery independently checked; domain/height/scenario tests pass on z370; report uncertainty without inventing survey accuracy |
| PC-4.2 | Planning task browser verification and visual critique | Root | Accepted | On z370, place a device, change height, compare real layout, optimize and apply relay, inspect gaps, import/export and use mobile; normalize every screenshot before viewing |
| PC-4.3 | Vercel preview, production smoke and durable handoff | Root | Pending | Clean CI/build, exact deployed revision and browser run retained; source/remaining-data limits and rollback captured in repo + Codex memory |

Acceptance evidence: [correction release](PLANNER-CORRECTION-RELEASE-2026-09-13.md), [site registration](evidence/event-map-registration-20260913.md), [RF/height/placement](evidence/planner-domain-correction-20260913.md), [root final browser report](evidence/planner-marker-final-20260913.json). Accepted site packages mean source-informed planning geometry with disclosed uncertainty; no survey accuracy or field RF certification is claimed.
