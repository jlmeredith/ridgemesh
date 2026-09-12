# RidgeMesh recovery audit — 2026-09-12

**Audit baseline:** Git commit `47a5558`; [implementation WBS](RECOVERY-WBS.md).
**Outcome:** The reported terrain and coverage problems are structural and reproducible. There is enough reusable UI/framework code to repair the app without a framework rewrite. Vercel is viable after runtime repair.

## Findings that explain the failed experience

The code has three different versions of reality: a manually modified terrain surface, a heuristic direct-radio coverage calculation, and rendered rings/lines that bypass that calculation. The placement function is a fixed list. Therefore visually correcting a hill alone would still leave incorrect percentages and unsupported placement advice.

| Priority / finding | Primary source at baseline | Consequence / repair |
|---|---|---|
| P0: analysis terrain is hand-shaped | [terrain.ts:204](https://github.com/jlmeredith/ridgemesh/blob/47a5558/src/lib/terrain.ts#L204)–218 | Interpolated heights get noise, field flattening toward 210.6 m, hill shaping toward 239.3 m and creek carving. Both RF and contours consume modified `HEIGHT`. Replace with reproducible source terrain. |
| P0: heatmap renderer discards coverage | [world.ts:105](https://github.com/jlmeredith/ridgemesh/blob/47a5558/src/lib/world.ts#L105)–111; valley-gl.ts:165–169 | `tintTerrain` returns base colors regardless of heat/system. Restore registered result rendering after defining valid coverage. |
| P0: coverage ignores mesh connectivity | [radio.ts:250](https://github.com/jlmeredith/ridgemesh/blob/47a5558/src/lib/radio.ts#L250)–304 | A cell counts if any same-system node can reach it; isolated nodes count. Hop/forwarding settings do not affect heat. Compute target-to-destination or crew-pair reachability. |
| P0: graph traversal cannot advance | radio.ts:220–247 | All nodes begin at hop zero, so no neighbor improves. Add explicit origins, role-aware traversal and protocol hop semantics. |
| P0: repository cannot start as exported | [grok-pwa-shared.mjs:13](https://github.com/jlmeredith/ridgemesh/blob/47a5558/scripts/grok-pwa-shared.mjs#L13); package.json:11–12 | Invalid JavaScript in the Vite import chain; build also invokes missing migration script. Remote parser reproduced the syntax failure. |
| P1: return-link power is overstated | [radio.ts:173](https://github.com/jlmeredith/ridgemesh/blob/47a5558/src/lib/radio.ts#L173)–176 | Maximum endpoint TX is used for both directions. The app lends V4 power to M1. Use directed budgets and separate RX/antenna settings. |
| P1: path sampling changes attenuation | radio.ts:95–105 | Same forest increment per sample despite different spacing. Heat uses coarse sampling; probe uses fine. Integrate actual path-segment length. |
| P1: lines/rings do not report RF success | [valley-gl.ts:399](https://github.com/jlmeredith/ridgemesh/blob/47a5558/src/lib/valley-gl.ts#L399)–449; radio.ts:388–396 | Fixed radii and clearance-only classifications ignore link budgets and knobs. A green line need not be a usable radio link; gold does not demonstrate propagation around a bend. |
| P1: no placement search exists | [radio.ts:399](https://github.com/jlmeredith/ridgemesh/blob/47a5558/src/lib/radio.ts#L399)–424; side-panel.tsx:323–354 | Suggested backbone is hard-coded coordinates. Implement objective, targets, feasibility, device budget and constrained search. |
| P1: source resolution/provenance are absent | terrain.ts:36–65,94–106 | Only 24×26 stored controls are spread across a 197×200 mesh. Output cells cannot recover source detail; no source raster/manifest verifies the USGS claim. |
| P1: geographic layers are adjusted heuristically | terrain.ts:138–173,224–257 | Creek points move to local coarse-DEM minima; meadows are ellipses and remainder largely forest. Separate sourced vectors, observed obstruction layers and decoration. |
| P1: calculations block UI and scene resources are abandoned | valley-map.tsx:36–55; valley-gl.ts:134–175,221–227 | Timer still computes on the main thread. Broad subscriptions recreate objects without disposing removed geometry/materials. Use workers, narrow invalidation and resource ownership. No memory/latency magnitude was measured. |
| P1: no durable scenarios or real test foundation | store.ts:43–126; package.json:15–19; multiplayer/index.ts:1–9 | State is memory-only; named tests/preview scripts and `./p2p` module are absent. Add validated scenario documents and real remote acceptance. |
| P2: scale and visual endpoints disagree | terrain.ts:9–17,67–70; world.ts:13–24,77; valley-gl.ts:157–158,428–429,626 | Declared bbox dimensions differ from vertex extent. Vertical scale is 2.6× horizontal scale. Marker and link heights are literal display offsets, not antenna AGL. Unify metric transforms and expose exaggeration. |
| P2: percentages do not measure occupied-site coverage | radio.ts:334–354; valley-map.tsx:49 | Whole rectangle is the denominator; one coarse sample classifies a camp. Current default interval is nominally 50 m. Use target masks, unknown-area accounting and exact POI paths. |
| P2: presets and community nodes distort comparisons | store.ts:99–116; radio.ts:288–324 | Presets inherit unrelated settings; synthetic Totems add coverage without visible node counts or a route to the crew. Snapshot full inputs and explicitly model uncertain community scenarios. |

The metadata calls terrain schematic while README/header/sidebar describe real, satellite-registered USGS terrain. Neither label establishes accuracy. Legacy literal site elevations, power availability, stage height, camp coordinates and property-specific range advice remain unverified against independent site evidence. Preserve them as historical hypotheses until validated, not as acceptance fixtures.

## Terrain repair has an identified source

The official [USGS product inventory query](https://tnmaccess.nationalmap.gov/api/v1/products?datasets=Digital%20Elevation%20Model%20%28DEM%29%201%20meter&bbox=-90.4215%2C38.0135%2C-90.3990%2C38.0315&max=5&outputFormat=JSON) returned one product for the current app bbox on 2026-09-12:

| Field | Inventory value |
|---|---|
| Product | USGS 1 Meter 15 x72y422 MO_Northern_SEMO_2021_D21 |
| Source ID | `65fe634fd34e64ff1548db4e` |
| Publication date | 2024-02-28 |
| Download size | 363,792,818 bytes |
| Inventory bounding box | Longitude -90.49404926499994 to -90.37703643199995; latitude 38.00852468700003 to 38.101048055000035 |
| Raw source | [USGS GeoTIFF](https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1m/Projects/MO_Northern_SEMO_2021_D21/TIFF/USGS_1M_15_x72y422_MO_Northern_SEMO_2021_D21.tif) |
| Catalog pointer | [ScienceBase record](https://www.sciencebase.gov/catalog/item/65fe634fd34e64ff1548db4e) |

The returned bounding rectangle contains the app rectangle. This proves an inventory candidate, not raster-level valid coverage: download and inspect actual geotransform, nodata and metadata on z370. Preserve a buffer for all analyzed paths, acquiring additional products as needed. Clip/package browser assets; do not make every browser fetch the full raw tile. The inventory response is retained in [evidence/usgs-inventory-2026-09-12.json](evidence/usgs-inventory-2026-09-12.json).

USGS distinguishes 1 m products from approximately 10 m geographic products and publishes source metadata. Bare-earth elevation does not include a canopy/building obstruction model. Keep those separate and label unavailable obstruction evidence. [USGS product definitions](https://www.usgs.gov/3d-elevation-program/about-3dep-products-services).

Use a local metric projected frame consistent with verified source CRS, with explicit conversion to display WGS84. Resolve pixel-center versus pixel-corner conventions and preserve the vertical datum. Check numerical extraction against GDAL separately from source surveying accuracy. [GDAL geotransform contract](https://gdal.org/en/stable/tutorials/geotransforms_tut.html).

The venue publishes a [2025 illustrated map for 2026 camping reference](https://www.astralvalley.com/venuemap). This is a useful semantic source for names/layout, not a surveyed orthophoto or proof of current GPS positions. Georeference against authoritative imagery and independently identifiable landmarks; keep inferred locations editable and labeled. No private Grok conversation or survey was supplied during this audit.

## Radio model and comparison semantics

The application should distinguish direct radio footprint, usable end-to-end communication, and ability to obtain a GNSS position. A person can be in range of an isolated node while unable to reach the intended crew. A good RF path does not establish congestion-free delivery. A radio link can work while a positioning feature has no valid fix. Report these as separate concepts.

For each direction evaluate transmitter power, antenna gain/loss, geometric distance, source-ground path, receiver configuration/sensitivity and declared fade allowance. Replace the blanket ground+1.2 m obstruction threshold and arbitrary ridge penalty with wavelength/path-dependent Fresnel clearance and a selected documented diffraction method. Use actual segment lengths for vegetation exposure. A P.526-based method is a defensible starting reference; it is not field calibration or proof that one knife edge accurately models all local clutter. [ITU-R P.526 diffraction reference](https://www.itu.int/rec/r-rec-p.526/en).

Hardware brand must not imply relay role or modem compatibility. Match configured band/modem/channel requirements and keep application compatibility separate from physical reception and forwarding. Meshtastic documents matching radio settings, modem range/airtime tradeoffs, and distinct CLIENT/CLIENT_MUTE behavior. [LoRa configuration](https://meshtastic.org/docs/configuration/radio/lora/), [device roles](https://meshtastic.org/docs/configuration/radio/device/).

Heltec documents separate high- and low-power V4 variants, so the model needs a SKU/configuration rather than a universal V4 power constant. The sidebar's 28 versus 22 dBm claim is a 6 dB difference: approximately fourfold conducted power by definition, not sixfold radiated power. Antenna/cable terms also affect radiated power. [Heltec V4 specification](https://heltec.org/project/wifi-lora-32-v4/).

Totem's own range explanation describes relaying with multiple devices, including bonded and unbonded units; the UI claim that a mesh exists only when strangers bring devices is unsupported. Manufacturer range claims do not establish the app's assumed TX, sensitivity, hop limit, bag/crowd penalties or local camp coverage. Keep unknown proprietary parameters as explicit assumptions and show sensitivity ranges; do not invent certainty to make a comparison look complete. [Totem range explanation](https://totemlabs.com/blogs/posts/totem-compass-range).

The default comparison should evaluate the same crew positions and occupied targets for Totem-only, M1-only and M1 with a V4 backbone. A hybrid displays independent networks, with any user carrying multiple devices explicit; it must never manufacture cross-protocol relay edges. Provide a separate base-station destination mode. Save the full scenario, including model/data versions, target mask, antenna heights, roles, environmental assumptions and synthetic-community seed.

For placement, maximize weighted reachable targets under a device budget and real installation constraints. Show baseline versus best found, alternatives, newly served targets, remaining gaps, weakest link and the effect of losing/removing a relay. Candidate ridge elevation is only one input: access, power, mast limits, acceptable locations and return-path connectivity can make a high point unusable. Static guidance that the stage is a free mast is not evidence of installation permission or feasibility.

## Runtime and Vercel disposition

Retain the existing Start/Vite/Nitro stack. `vite.config.ts:169–181` already selects Nitro's Vercel preset; the framework choice is not the export's blocker. [Vercel's official integration](https://vercel.com/docs/frameworks/full-stack/tanstack-start) supports that composition. Build repair still requires removing broken platform-only hooks, correcting absent scripts/modules, owning manifest/icons, resolving a compatible dependency graph, and committing a lockfile.

The current application does not implement working auth, database use or multiplayer. `AuthProvider` is a passthrough and names/dependencies are not functionality. Preserve this as a browser planner with versioned local storage/import/export initially. Keep heavy GIS preparation on the box and interactive RF/search in a worker. Vercel serves the application and derived data; cloud GIS jobs and shared database infrastructure can wait for a real requirement.

Use Node 24 as the proposed build baseline after dependency compatibility is verified; the current Vercel guide recommends 24+. This audit's dependency-free reproduction used the box's existing Node 22 and is not build compatibility evidence. Use the TanStack Start framework/output detection rather than guessing a plain Vite `dist` folder. Vercel account/project access and deployment settings were not tested. [Vercel deployment guide](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel).

## Independent verification and limits

The orchestrator re-read every high-priority subagent finding against the baseline source and checked the USGS inventory and official framework/model references directly. Three read-only audit agents covered terrain, RF and deployment. The orchestrator alone wrote this audit/plan and performed the final verification.

**RAN ON z370 — run `ridgemesh-audit-20260912-lXCeDe`, Node v22.23.2, source `47a5558`.** An archived source copy in remote scratch was used. No dependency installation, app server or full build was needed to reproduce the following defects:

| Check | Observed result | Meaning |
|---|---|---|
| `timeout 30 node --check scripts/grok-pwa-shared.mjs` | Exit 1; line 13 `SyntaxError: missing ) after argument list` | Imported helper is unparseable at baseline |
| `tintTerrain` with heat + mesh overlay | Output equals base colors | Coverage rendering is disabled |
| Heat for backbone/clients: hops 1→7, forwarding false→true | Mesh arrays identical | Hop/forwarding knobs do not affect this coverage calculation |
| `reachability` for the same eight nodes | All hops 0, all predecessors null | No route tree is derived |
| Mixed M1/V4 budget versus M1/M1 budget | 152 dB versus 146 dB | Confirms use of high endpoint power in the symmetric budget |
| Same path at grid (50,50)→(70,70), fine/coarse profiles | Forest length 231 m versus 121 m; geometric distance 282.842712474619 m | Sampling density alters modeled attenuation |

The reproduction changed only `"./terrain"` import specifiers to `"./terrain.ts"` in remote copies of radio/world for Node's built-in TypeScript stripping. It used heat step 20 to bound audit cost, whereas the app uses step 5. These observations demonstrate defects, not valid coverage figures. The exact diagnostic script and output summary are retained in [evidence/remote-reproduction.md](evidence/remote-reproduction.md).

Local actions were source/document inspection, small metadata retrieval, and documentation writes only. No test, build, browser app execution, benchmark or load ran on the Mac. Full clean build/typecheck, browser behavior, performance, actual raster samples, independent site registration and real radio field accuracy remain unverified. No production deployment occurred. Work packages explicitly require those checks before their corresponding claims are accepted.
