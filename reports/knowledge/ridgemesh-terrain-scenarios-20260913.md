# Terrain-scenario knowledge capture

**Phase (SoT):** [#ridgemesh·P5] Terrain scenarios → production

- Decision and rationale: [terrain-scenario release](../../docs/TERRAIN-SCENARIOS-RELEASE-2026-09-13.md), including actual relief, default layers, landscape margins, event-area denominator, scenario preservation and MediumFast assumptions.
- Separate product guidance: [AstralMesh recommendations](../../docs/ASTRALMESH-PLANNING-RECOMMENDATIONS-2026-09-13.md).
- Canonical evidence: [22-check browser report](../../docs/evidence/terrain-production-3e0dde1-20260913.json), exact application `3e0dde14db9c8676ddf9162a023a3024aa76d7ca`, production `dpl_Bx3cmRbkjcEV8S8c6DJbSe22gb4p`; all tests/browser work ran on z370 or hosted CI.
- Reusable verification: [remote-only skill](../../.Codex/skills/ridgemesh-remote-verification/SKILL.md), `scripts/terrain-scenarios-browser-check.mjs`, numerical/geometry regression oracles.
- Codex memory: `project_ridgemesh_recovery.md` and its existing `MEMORY.md` pointer record the verified P5 contract and release.
- Graphiti accepted/queued `DECISION: RidgeMesh public terrain-scenario contract` in `mandalagenv2`, referencing only the public release document; no private repository contents or infrastructure details were submitted.
