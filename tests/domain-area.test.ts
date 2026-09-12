import {test} from 'node:test';
import assert from 'node:assert/strict';
import {computeHeat} from '../src/lib/radio';
import {COLS,ROWS,CELL_M} from '../src/lib/terrain';
test('full target polygon area matches metric terrain extent including clipped edge cells',()=>{const heat=computeHeat([],{crowd:0,bagLoss:false,clientsHop:false,meshHops:1,totemHops:1,communityTotems:false,targetPolygon:[[0,0],[COLS-1,0],[COLS-1,ROWS-1],[0,ROWS-1]]},17);assert.equal(heat.targetAreaSqM,(COLS-1)*(ROWS-1)*CELL_M*CELL_M);assert.equal(heat.w,Math.ceil((COLS-1)/17));assert.equal(heat.h,Math.ceil((ROWS-1)/17));assert.ok(Array.from(heat.mesh).every(v=>v===-1));});
