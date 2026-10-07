# Terrain and imagery delivery — 2026-09-12

Run provenance: `ssh z370`; run directories `/home/jamie/ridgemesh-terrain-20260912` (source/GIS), `/home/jamie/ridgemesh-build-20260912` (application verification). No GIS/test processing ran on the Mac. Worktree source changes await orchestrator commit.

## Source and contract

USGS source `65fe634fd34e64ff1548db4e` downloaded in full (363,792,818 bytes), SHA256 `f53d01a52e5f7ea243e4a681ad62ac97abcbed3f0eb2feb698205d93fabaf3cb`. Raw GeoTIFF and 1m AOI clip retained on z370. Native source EPSG:26915, 1m, NAVD88 elevation metres; source geotransform retained in `public/data/terrain-manifest.json`. USGS inventory is `usgs-inventory-2026-09-12.json` in this directory. It identifies the product as public domain. Acquisition project year 2021; exact capture day is not established from this tile inventory.

Metric analysis grid 205 columns × 207 rows, first vertex easting 726300 / northing 4212510, 10m spacing, east/right and south/down. Raster corner is half a cell outside the first vertex. Display extent between first and last vertices is 2040m × 2060m. Native source covers the whole grid and retained full tile supplies a modeling buffer; analysis outside grid returns NaN, not fabricated/clamped terrain. The grid is a source-aligned simplification, not a native 1m RF grid. Sharp subcell features remain a limitation. Distances are projected grid metres (not longitude scaling).

`prepare-terrain.py` uses rasterio/GDAL bilinear downsampling with explicit destination transform. Runtime JSON roundtrip differs from the derived GeoTIFF by at most 0.000519m; this verifies serialization, not source surveying accuracy. Five distributed source-nearest 1m checks differ from 10m aggregation by -0.207 to +0.105m; they are explicitly different sampling operators. `terrain-verification-20260912.json` retains pyproj coordinate checks for independent JS verification. No voids in clipped native source. Source data itself is not independently surveyed.

All procedural height noise, sculpted hilltop, field flattening and creek carving removed. Spot labels now sample the DEM. Contours use the same immutable elevation grid as RF. Legacy vector locations and cover masks remain visibly inferred/unverified; the app must not treat stage power, access, land ownership, building position or forest classification as established. A legal property boundary and surveyed camp polygons are unavailable. Do not mark RM-2.3.3 fully accepted.

## Actual independent acquisitions

The imagery manifest and original STAC item JSON are in `public/data/`:

- Sentinel-2A `S2A_15SYC_20240613_0_L2A`, 2024-06-13, 10m native true-color COG; source Earth Search / Copernicus Sentinel. Display 5m pixel interpolation adds no resolution.
- Sentinel-2A `S2A_15SYC_20241110_0_L2A`, 2024-11-10, 10m native true-color COG; distinct acquisition, same provider. Different seasons, not provider rebrands.
- USDA NAIP `mo_m_3809061_se_15_060_20220618`, 2022-06-18, 0.6m native aerial RGBIR COG through Planetary Computer, downsampled to 1m RGB display.

All JPEGs are reprojected to the same EPSG:26915 frame and have edges exactly at first/last DEM vertices. They can be draped directly across that mesh extent. Projection grid north differs slightly from true north; WGS84 conversion is explicit through proj4. Native resolution must not be labeled positional accuracy. Contains modified Copernicus Sentinel data 2024; USDA/USGS sources are public domain. Original source identifiers, URLs, CRS, acquisition date, source resolution, display transform and output SHA256 are retained. Signed NAIP access credentials are not retained; reproducible script fetches a fresh SAS URL.

## Alignment evidence and remaining uncertainty

`prepare-terrain-registration.py` performs source-content comparison against NAIP: nine distributed held-out 360m square patches, normalized grayscale gradient correlation on a common 10m sampling grid, search +/-40m. No transformation is fitted or applied; every patch is a check patch. Correlation >=0.35 and interior peak are declared diagnostic acceptance filters. Four patches in each satellite image pass the filter. Their RMS best-shift magnitudes are 7.07m (June) and 11.18m (November), within a diagnostic tolerance of two Sentinel pixels (20m). Five patches in each image are weak or peak at the search boundary and cannot establish local alignment. All patch values, including failures, are retained in `terrain-registration-20260912.json`.

This supports partial image-content alignment, not surveyed ground-control accuracy. Patches can include canopy/roof edges and seasonal changes. We have not independently identified distributed stable ground landmarks or measured absolute residuals against surveyed controls. RM-2.3.2 is partially supported, not fully accepted. No DEM edits were made to match imagery. `terrain-registration-comparison.jpg` shows the three source views with source-derived contour crossings and held-out patch boundaries at identical scale/extent. Yellow contour crossings are a diagnostic raster visualization, not a replacement for app vector contour rendering.

The original legacy 785/885/920/922-foot spot claims were not preserved as truth; current labels use the source DEM. No field calibration or property survey has been supplied. Keep the release explicitly an uncalibrated planning estimate.
