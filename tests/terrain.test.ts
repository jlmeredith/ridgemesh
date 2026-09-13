import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLS, ROWS, CELL_M, HEIGHT, TERRAIN_METADATA, llToGrid, gridToLl, elev, elevBilinear } from '../src/lib/terrain';
import { IMAGERY_VIEWS } from '../src/lib/imagery';

// Independent pyproj/PROJ oracles computed on z370 from USGS native EPSG:26915.
// Evidence: docs/evidence/terrain-verification-20260912.json (not JS-generated).
const controls = [
  { x: 0, y: 0, lat: 38.03205509313107, lon: -90.42156163371888 },
  { x: 204, y: 0, lat: 38.03154319764836, lon: -90.39834006970912 },
  { x: 0, y: 206, lat: 38.0135074322591, lon: -90.42221193884211 },
  { x: 204, y: 206, lat: 38.012995876000595, lon: -90.39899621548642 },
  { x: 102, y: 103, lat: 38.02252598066892, lon: -90.41027746588776 },
];
test('JS NAD83 metric transforms agree with independent PROJ corner and center oracles', () => {
  for (const p of controls) {
    const [x, y] = llToGrid(p.lat, p.lon);
    assert.ok(Math.hypot(x - p.x, y - p.y) * CELL_M < 0.02);
    const [lat, lon] = gridToLl(p.x, p.y);
    assert.ok(Math.abs(lat - p.lat) < 2e-7);
    assert.ok(Math.abs(lon - p.lon) < 2e-7);
    const [xx, yy] = llToGrid(lat, lon);
    assert.ok(Math.hypot(xx - p.x, yy - p.y) < 1e-6);
  }
});

test('source-derived heights agree with saved native-source and GDAL aggregation samples', () => {
  // Analysis values independently read from GDAL derived GeoTIFF on z370.
  const samples = [
    [10, 10, 202.6312255859375, 202.67718505859375],
    [194, 10, 250.71493530273438, 250.9215087890625],
    [102, 103, 193.4705352783203, 193.36618041992188],
    [10, 196, 234.4393310546875, 234.37374877929688],
    [194, 196, 240.38758850097656, 240.378173828125],
  ];
  assert.equal(HEIGHT.length, 42435);
  for (const z of HEIGHT) assert.ok(Number.isFinite(z) && z > 0);
  for (const [x, y, aggregated, nativeNearest] of samples) {
    assert.ok(Math.abs(elev(x, y) - aggregated) < 0.0006);
    assert.ok(Math.abs(elevBilinear(x, y) - nativeNearest) < 0.21);
  }
  assert.equal(TERRAIN_METADATA.sourceSha256, 'f53d01a52e5f7ea243e4a681ad62ac97abcbed3f0eb2feb698205d93fabaf3cb');
  assert.equal(TERRAIN_METADATA.sourceResolution[0], 1);
  assert.equal(TERRAIN_METADATA.verticalDatum, 'NAVD88 metres');
});

test('outside or nonfinite terrain coordinates yield unknown, never zero or edge elevation', () => {
  for (const [x, y] of [[-0.01, 5], [5, -0.01], [COLS, 5], [5, ROWS], [NaN, 5], [5, Infinity], [-Infinity, 5]]) {
    assert.ok(Number.isNaN(elev(x, y)));
    assert.ok(Number.isNaN(elevBilinear(x, y)));
  }
  for (const [x, y] of [[0, 0], [COLS - 1, ROWS - 1], [102.5, 103.5]]) assert.ok(elevBilinear(x, y) > 0);
});

test('each imagery acquisition has the exact metric vertex extent and north-up orientation', () => {
  for (const view of IMAGERY_VIEWS) {
    const [sx, skewX, west, skewY, sy, north] = view.transform;
    assert.equal(view.crs, 'EPSG:26915');
    assert.equal(skewX, 0); assert.equal(skewY, 0);
    assert.ok(sx > 0 && sy < 0);
    assert.equal(west, 726300); assert.equal(north, 4212510);
    assert.equal(west + sx * view.width, 728340);
    assert.equal(north + sy * view.height, 4210450);
    assert.equal(sx * view.width, (COLS - 1) * CELL_M);
    assert.equal(-sy * view.height, (ROWS - 1) * CELL_M);
    assert.ok(readFileSync(`public${view.url}`).length > 1000);
  }
  // Pixel-centre raster and mesh-edge imagery deliberately differ by half a DEM cell.
  assert.equal(TERRAIN_METADATA.transform[2], 726295);
  assert.equal(TERRAIN_METADATA.transform[5], 4212515);
});

test('satellite options identify two real distinct original STAC acquisitions plus aerial', () => {
  const satellites = IMAGERY_VIEWS.filter(v => v.kind === 'satellite');
  assert.equal(satellites.length, 2);
  assert.deepEqual(satellites.map(v => v.sourceId), ['S2A_15SYC_20240613_0_L2A', 'S2A_15SYC_20241110_0_L2A']);
  for (const view of satellites) {
    const stac = JSON.parse(readFileSync(`public/data/${view.id}-stac.json`, 'utf8'));
    assert.equal(stac.id, view.sourceId);
    assert.equal(stac.properties.datetime.slice(0, 10), view.date);
    assert.equal(stac.assets.visual.href, view.sourceUrl);
    assert.equal(view.resolutionM, 10);
  }
  assert.equal(new Set(satellites.map(v => v.date)).size, 2);
  assert.equal(IMAGERY_VIEWS.filter(v => v.kind === 'aerial').length, 1);
});
