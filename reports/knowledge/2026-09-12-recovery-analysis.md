# Knowledge captured — RidgeMesh recovery audit

Date: 2026-09-12. Scope: analysis and repair planning from baseline `47a5558`.

- Project findings and primary references: [recovery audit](../../docs/RECOVERY-AUDIT-2026-09-12.md).
- Proposed architecture, decomposed deliverables, acceptance, phase handoff: [recovery WBS](../../docs/RECOVERY-WBS.md).
- Remote verification: [z370 diagnostic](../../docs/evidence/remote-reproduction.md); USGS source inventory in the same evidence directory.
- Codex memory: `/Users/jamiemeredith/.codex/memories/project_ridgemesh_recovery.md`, indexed in `/Users/jamiemeredith/.codex/memories/MEMORY.md`.

Decision: preserve the framework and repair the source/model/result chain. Gotchas: heat rendering is a no-op; direct footprints are not mesh connectivity; all-zero graph initialization prevents routing; asymmetric TX and sample-dependent foliage losses distort coverage. Source: a USGS 1 m tile is inventoried over the AOI but raster validity still needs remote inspection. No field-verified placement or production readiness claim has been made.

Scope amendment from Jamie: multiple satellite views are mandatory for both visual quality and topo alignment. Captured as RM-2.3.1–2.3.3 and RM-4.1.1–4.1.3: distinct acquisitions, provenance, independent alignment checks, image comparison controls and imagery-textured 3D. Acquisition and alignment remain implementation work. Codex memory carries the same requirement.
