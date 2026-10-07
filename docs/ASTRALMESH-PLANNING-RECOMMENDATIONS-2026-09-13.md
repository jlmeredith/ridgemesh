# AstralMesh planning recommendations

**As of:** 2026-09-13 UTC
**Disposition:** Recommendations for the separate AstralMesh project; no changes made there in this release.

Use RidgeMesh as the organizer's placement/scenario planner and keep [AstralMesh](https://astral-mesh.vercel.app) as the attendee field guide. Its deployed page identifies its artwork as an illustration, describes the elevated backbone as still being planned, and provides an offline-capable setup guide. Root verified the separate [repository](https://github.com/jlmeredith/astral-mesh), its source and the READY canonical production deployment. It does not currently provide a terrain/RF planning engine.

## Recommended field guidance

Publish a dated deployment snapshot after organizers verify the proposed mounts: fixed radio ID, role, location, antenna AGL, equipment and whether the placement is proposed or confirmed. The present RidgeMesh candidate is P1 ROUTER on Stargazer at 1.5 m AGL plus CLIENT_BASE at Harmony Grove at 3 m AGL, with a third available radio in reserve. Those heights are lowest sufficient tested candidates under the model, not a tree/solar installation instruction. A stage-mounted primary remains an explicit scenario to compare; current search uses a 12 m primary there and different support placements. Link organizers to the interactive RidgeMesh scenario rather than presenting one stage-side illustration as ground truth.

Attach a lightweight dated coverage image and plain legend suitable for offline use. Label it **Predicted coverage — not live telemetry**, identify scenario/model versions, state the MediumFast assumption, and retain no-route/unknown areas. Do not publish the 100% modeled event score as a coverage promise. The full landscape field and the event-use score have different extents. Two access nodes do not establish resilience to the main P1 failing.

Keep attendee CLIENT radios separate from fixed infrastructure. A roaming person or voluntary position report is not a dependable repeater. Fixed CLIENT_BASE can forward under its firmware rules; ROUTER/ROUTER_LATE assignments and favorite relationships need organizer coordination. Describe the usable fixed backbone to attendees, while leaving detailed mast/search controls in RidgeMesh. Later field observations should appear with collection time, measured configuration and uncertainty, separately from predictions.

The current field guide's setup baseline is US / MediumFast / three hops / primary AstralMesh / slot 0 auto. RidgeMesh now derives −126 dBm sensitivity from the [official MediumFast budget](https://meshtastic.org/docs/overview/radio-settings/#presets), which is an assumption to replace with actual hardware/configuration observations. Slot 0 follows the [channel-name hash](https://meshtastic.org/docs/configuration/radio/lora/#frequency-slot); do not label the real carrier exactly 915 MHz or copy LongFast's default frequency.

## Acceptance for a future AstralMesh change

| Work package | Deliverable | Acceptance |
|---|---|---|
| AM-1 | Confirmed organizer deployment guidance | Children accepted |
| AM-1.1 | Dated proposed/confirmed fixed-radio snapshot | Matches a versioned RidgeMesh export and organizer mount checks; roles and AGL are explicit |
| AM-1.2 | Offline coverage illustration and legend | Opens offline; prediction label, no-route/unknown colors, extent and model date remain visible |
| AM-2 | Attendee setup and observation separation | Children accepted |
| AM-2.1 | Field guide links and fixed/roaming explanation | Existing setup stays consistent with actual firmware; no attendee count is presented as infrastructure |
| AM-2.2 | Measured-observation provenance | Future observation views identify time/configuration and cannot be mistaken for the predicted heatmap |

[Current RidgeMesh release](TERRAIN-SCENARIOS-RELEASE-2026-09-13.md) · [versioned generated recommendation](../public/data/optimized-plan.json).
