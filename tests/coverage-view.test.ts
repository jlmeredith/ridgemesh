import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coverageColor,COVERAGE_STOPS} from '../src/lib/coverage-view';
test('coverage legend and rendering preserve unknown, no-route and physical margin thresholds',()=>{
 assert.equal(coverageColor(-1,NaN),'#aeb8c5');assert.equal(coverageColor(0,-Infinity),'#ed655d');assert.equal(coverageColor(0,NaN),'#ed655d');
 assert.equal(coverageColor(.5,0),COVERAGE_STOPS[0].color);assert.equal(coverageColor(1,6),COVERAGE_STOPS[1].color);assert.equal(coverageColor(1,40),COVERAGE_STOPS[4].color);assert.equal(coverageColor(1,80),coverageColor(1,60));
 assert.notEqual(coverageColor(1,12),coverageColor(1,24));assert.equal(coverageColor(.5,3),'#b5bea3');
});
