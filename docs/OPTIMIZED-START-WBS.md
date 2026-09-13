# Optimized start and progressive detail

**Phase (SoT):** [#ridgemesh·P3] Optimized start → simple planner
**Status:** Implementation and remote acceptance complete; production replacement in progress.

| WBS ID | Work package / deliverable | Owner | Status | Acceptance |
|---|---|---|---|---|
| OS-1 | Reproducible optimized starting scenario | Root | Accepted | Child packages accepted |
| OS-1.1 | Shared placement policy and generated scenario | Root | Accepted | Same RF engine/site candidates produce a connected forwarding router and retained base/crew; run remotely, record source/model versions and score |
| OS-1.2 | Safe startup and customization persistence | Root | Accepted | Fresh session starts with applied optimized nodes; custom/empty saved plans survive reload; exact old untouched starter can upgrade; malformed bytes preserved before autosave |
| OS-2 | Clear first view and progressive disclosure | Root | Accepted | Child packages accepted |
| OS-2.1 | Compact overview, distinct Base/Router markers, full map | Root | Accepted | Initial screen shows actual router location/height and coverage summary without editing panels, route charts or duplicated controls |
| OS-2.2 | Optional layers and customization workspace | Root | Accepted | Handhelds, labels, heights, zones, routes, coverage and contours independently enabled; imagery/3D remain available; Customize reveals device editing and detailed analysis |
| OS-3 | Remote verification and replacement deployment | Root | Active | Child packages accepted |
| OS-3.1 | Startup, routing, browser and visual acceptance | Root | Accepted | z370 tests/build and actual initial/customize/layer/reload/restore workflows pass; scoped screenshots normalized; all imagery decoded |
| OS-3.2 | Vercel production and durable record | Root | Pending | Exact revision deployed and canonical browser verified, evidence committed, Codex/Graphiti public-reference capture updated |

Primary evidence: [release record](OPTIMIZED-START-RELEASE-2026-09-13.md), z370 runs `optimized-start-integration-20260913` (47 tests) and `optimized-start-release-20260913` (type/lint/build and 22 browser checks). Production acceptance is tracked in OS-3.2.
