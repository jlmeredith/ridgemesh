# Astral Valley site-feature correction — 2026-09-13

The site layer now uses visible NAIP roofs, roads and clearing outlines, with names and relative placement reconciled against historical organizer maps. The USGS elevation grid was not edited. Geometry is a planning estimate, not surveyed venue boundaries or permission to install a radio.

## Primary sources inspected

- [Official ReKinection 2023 event map](https://rekinection.com/wp-content/uploads/2023/05/REKINECTION_MAP_2023-1.png), uploaded 2023-05-16.
- [Official ReJuvenation 2024 final map](https://rekinection.com/wp-content/uploads/2024/05/Final-Map-2024.png), uploaded 2024-05-16.
- [Official Cosmic Kinection 2025 venue map page](https://www.astralvalley.com/venuemap); [original image](https://static.wixstatic.com/media/e2a79b_bb4c704e71444a2ca400e8ef0019fbd2~mv2.jpg). The organizer's [map page](https://rekinection.com/rekinection-celebration-festival-map/) identifies this as the 2025 map, not a 2026 survey.
- Upload dates were read from the organizer's public [WordPress media index](https://rekinection.com/wp-json/wp/v2/media?search=map&per_page=100&_fields=date,source_url,title). This also lists 2020 maps; those were located but not used for geometry. A reliable Astral Lights 2018 map was not found.
- [Venue's climbing page](https://www.astralvalley.com/camp) publishes the EMCA [shaded-relief climbing map](https://static.wixstatic.com/media/e2a79b_9221f6493dae40e8be5f2d04ea8efbd1~mv2.jpeg), undated. Its road/creek/building topology helps identify stable features but its large symbols are not precise ground controls.
- [Organizer camping descriptions](https://rekinection.com/rekinection-festival-faq/) establish hilltop Stargazer, Family camp near swimming, and Dreamcatcher reached through Harmony Grove and across the creek.
- USDA [NAIP 2022-06-18 aerial](https://naipeuwest.blob.core.windows.net/naip/v002/mo/2022/mo_060cm_2022/38090/m_3809061_se_15_060_20220618.tif); two distinct Sentinel-2 acquisitions 2024-06-13 and 2024-11-10, inventory in `public/data/imagery-manifest.json`.

Original event/climbing artwork remains linked rather than redistributed in the application. The retained comparison artifact contains public-domain NAIP and attributed Copernicus imagery with our interpreted geometry.

## Corrected interpretation

Main Stage is the visible large roof along the southwestern end of the main field beside the southern creek bend. Main Stage Field is primarily east/northeast of that roof. Family camp is the western valley corridor. Stargazer is the central hilltop clearing. Harmony Grove is the wooded eastern road corridor inside the creek loop. Dreamcatcher is across the creek in the eastern off-road clearings. These relationships agree across the inspected 2023, 2024 and 2025 event maps despite stage branding and activity changes.

The separate unsupported `eastMeadow` camp was retired; its legacy coordinate is not evidence of a camp boundary. Eastern clearings that correspond to Dreamcatcher remain explicit estimated event-use areas. Individual `springS`/`springE` points were retired because no independently georeferenced spring positions were found. Havanna's Lake remains an approximate map label; its obscured shoreline is not used as an open-water RF mask.

`public/data/site-features.json` preserves original continuous NAIP pixel coordinates for every point, polygon and path. The displayed image transform is `[1,0,726300,0,-1,4212510]` in EPSG:26915. Thus a source pixel coordinate divided by ten lands in the existing terrain vertex grid; no new datum or independent image-fit transform is silently introduced. The main-stage roof pick `(1181,1120)` maps to easting 727481, northing 4211390. Camp outlines are estimates of use areas and are intentionally distinct from visible clearing polygons; shaded camping does not become meadow land cover.

## Registration diagnostics and limits

The reproducible diagnostic script is `event-map-registration-20260913.py`; its full control pairs, coefficients, residuals, point coordinates and DEM file hash are in `event-map-registration-20260913.json`. It was executed on **ssh z370**, run **site-registration-20260913-v1**.

Three climbing-map symbol centres were fitted to the corresponding independently published Mountain Project pins: [Beaver](https://www.mountainproject.com/area/125747984/beaver-boulders), [Harmony](https://www.mountainproject.com/area/125747076/harmony-creek-boulders), and [Stage Right](https://www.mountainproject.com/area/125747997/stage-right-boulders). These are contributed location pins, not surveyed control. A withheld [Old Blue pin](https://www.mountainproject.com/area/125747087/old-blue-boulder) differs by 11.67 m. Withheld comparisons of the map's stage and north-house symbols against visible NAIP roof centres differ by 65.81 m and 63.42 m respectively. Three affine fitting controls yield an exact mathematical fit by construction; their zero fitting residual does not establish accuracy.

**Decision: reject global map-symbol georeferencing for precise POIs.** Use aerial roofs and clearings directly, and maps for topology and naming. The map-icon discrepancies may include symbol displacement and approximate building identity. They must not drive arbitrary changes to DEM heights or offsets to the georeferenced imagery.

`event-map-registration-20260913.jpg` compares the same metric crop and inferred areas against NAIP and both Sentinel acquisitions. The broad Stargazer/mainfield/east-clearing patterns remain recognizable across the three views. Sentinel's native 10 m resolution and seasonal canopy do not independently verify exact roof, creek, gate or woodland camping boundaries. No surveyed horizontal accuracy was established. Per-feature 25–80 m allowances are judgemental planning allowances, not measured error statistics or guarantees.

Land cover removes the former ellipses and fabricated spring-water circles. It uses traced visible clearings, narrow approximate roads and the stage roof footprint. The remainder is an assumed forest class, not a certified canopy dataset; canopy height still comes from the RF assumption rather than the bare-earth DEM. The approximate creek is a visual line only, avoiding unsupported open-water attenuation assumptions beneath canopy.

## Verification

**RAN ON ssh z370 · site-registration-20260913-v1:** 9/9 site-registration and terrain tests passed using Node 24. Tests check the corrected cross-camp topology, Stargazer elevation relative to the mainfield against unchanged USGS terrain, source metric roof coordinates, disjoint occupancy targets, retained wooded gaps, retired unsupported POIs, and rejection of the inaccurate map-icon fit. Existing independent PROJ, DEM and imagery provenance fixtures also passed. No test or build ran on the Mac. Root integration verification remains separate.
