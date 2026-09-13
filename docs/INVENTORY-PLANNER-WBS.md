# Inventory-driven Meshtastic placement

**Phase (SoT):** [#ridgemesh·P4] Equipment-aware placement → production
**Status:** Remote acceptance complete; deployment in progress

The product computes where fixed radios should go for roaming users to communicate across Astral Valley. It starts with the best configuration found for available equipment, lets users scale the infrastructure budget up/down, and recomputes movable placements. Manual placement is an override. Totem is removed from the active app/model.

| WBS ID | Work package / deliverable | Owner | Status | Acceptance |
|---|---|---|---|---|
| IP-1 | Ground the equipment and role contract | Root | Accepted | Children accepted |
| IP-1.1 | Recover event inventory and original purpose | Root + read-only source agents | Accepted | Reddit primary comments identify P1, camp roles, two L1 Pro roamers and optional G3/5.8 dBi; unquantified offers stay conditional |
| IP-1.2 | Independent hardware, firmware role and deployment types | Root | Accepted | P1 is mandatory; CLIENT, CLIENT_BASE, ROUTER_LATE, ROUTER and CLIENT_MUTE semantics sourced; roaming devices cannot silently supply dependable infrastructure |
| IP-1.3 | Remove active Totem paths and preserve old saved data | Root | Accepted | No Totem UI/model/worker branch; schema migration retains original bytes and supported custom placements, incompatible raw data remains recoverable |
| IP-2 | Compute complete infrastructure plans | Root | Accepted | Children accepted |
| IP-2.1 | Joint P1 site/height search and inventory constraints | Root | Accepted | Enumerate mandatory P1 positions, compare stage/Stargazer/other permitted sites, optimize support placements without fabricating radios or moving locked nodes |
| IP-2.2 | Budget frontier, roaming coverage and reproducible starter | Root | Accepted | 1…available fixed-radio budgets yield applied computed layouts, at least one router, consistent target/score evaluation; roaming count does not create fictitious coverage |
| IP-3 | Simple planning workflow | Root | Accepted | Children accepted |
| IP-3.1 | Initial applied recommendation and scale controls | Root | Accepted | First view identifies P1 and fixed support roles; budget changes recompute; estimated area coverage and used/reserve counts are readable |
| IP-3.2 | Inventory, constraints, manual locks and provenance | Root | Accepted | Optional G3 is marked offered, campsite location remains unknown until set, manual fixed nodes can be locked, roles/AGL and assumptions exposed on demand |
| IP-4 | Verify, deploy and capture | Root | Pending | Children accepted |
| IP-4.1 | Remote numerical and browser acceptance | Root | Accepted | z370 tests cover mandatory P1, budget limits, relocation, role semantics, roaming exclusion, locks, migration, independent oracle; browser proves scale up/down and no Totem |
| IP-4.2 | Canonical deployment and durable context | Root | Pending | Exact revision passes CI/Vercel and live browser on z370; evidence, source rationale and corrected product purpose committed and captured |

Primary sources: [event thread](https://www.reddit.com/r/NocturnalValley/comments/1wdxd53/meshtastic_lora_will_be_onsite/), [P1/camp-role intention](https://www.reddit.com/r/NocturnalValley/comments/1wdxd53/comment/p9g2j7l/), [G3 offer](https://www.reddit.com/r/NocturnalValley/comments/1wdxd53/comment/p99x384/), [Meshtastic roles](https://meshtastic.org/docs/configuration/radio/device/), [Seeed solar hardware](https://wiki.seeedstudio.com/meshtastic_solar_node/).
