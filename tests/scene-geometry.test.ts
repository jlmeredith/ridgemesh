import test from 'node:test';
import assert from 'node:assert/strict';
import {scenePoint,clipPolygonToRect,heatCellIndex,polygonArea} from '../src/lib/scene-geometry';
test('3D uses the same metre scale for horizontal terrain, elevation and antenna AGL',()=>{
 const ground=scenePoint(10,20,120,0,101,101,10,100),mast=scenePoint(10,20,120,3,101,101,10,100),east=scenePoint(11,20,120,0,101,101,10,100);
 assert.deepEqual(ground,[-40,2,-30]);assert.ok(Math.abs(mast[1]-ground[1]-.3)<1e-10);assert.equal(east[0]-ground[0],1);
});
test('filled coverage cells are clipped to target triangles without painting outside bounds',()=>{
 const clipped=clipPolygonToRect([[0,0],[4,0],[0,4]],1,1,3,3);assert.equal(polygonArea(clipped),2);assert.ok(clipped.every(([x,y])=>x>=1&&y>=1&&x<=3&&y<=3&&x+y<=4));
 assert.deepEqual(clipPolygonToRect([[0,0],[1,0],[0,1]],2,2,3,3),[]);
});
test('terrain vertices resolve their actual RF cell without smoothing across cells',()=>{
 assert.equal(heatCellIndex(3.99,4,4,3,3),3);assert.equal(heatCellIndex(4,4,4,3,3),4);assert.equal(heatCellIndex(12,0,4,3,3),null);assert.equal(heatCellIndex(-1,0,4,3,3),null);
});
test('coverage drapes on the actual terrain triangles rather than floating between coarse RF samples',async()=>{
 const {triangleSurfaceElevation}=await import('../src/lib/scene-geometry');const z=(x:number,y:number)=>x===1&&y===1?10:0;
 assert.equal(triangleSurfaceElevation(.25,.25,2,2,z),0);assert.equal(triangleSurfaceElevation(.75,.75,2,2,z),5);assert.equal(triangleSurfaceElevation(1,1,2,2,z),10);
});
test('heat faces stay above saddle and ridge terrain throughout their interiors after diagonal splitting',async()=>{
 const {clipPolygonToTriangle,triangleSurfaceElevation}=await import('../src/lib/scene-geometry');
 const cell:[[number,number],[number,number],[number,number],[number,number]]=[[0,0],[1,0],[1,1],[0,1]];
 const halves:[[number,number],[number,number],[number,number]][]=[[[0,0],[1,0],[0,1]],[[1,0],[1,1],[0,1]]];
 for(const elevations of [[0,10,10,0],[10,0,0,10],[0,0,0,10]]){
  const z=(x:number,y:number)=>elevations[y*2+x];let area=0;
  for(const half of halves){const fragment=clipPolygonToTriangle(cell,half);area+=polygonArea(fragment);for(let i=1;i<fragment.length-1;i++){
   const face=[fragment[0],fragment[i],fragment[i+1]],heights=face.map(([x,y])=>triangleSurfaceElevation(x,y,2,2,z)+.35);
   for(const weights of [[1/3,1/3,1/3],[.6,.2,.2],[.2,.6,.2],[.2,.2,.6]]){const x=face.reduce((n,p,j)=>n+p[0]*weights[j],0),y=face.reduce((n,p,j)=>n+p[1]*weights[j],0),interpolated=heights.reduce((n,h,j)=>n+h*weights[j],0);assert.ok(Math.abs(interpolated-triangleSurfaceElevation(x,y,2,2,z)-.35)<1e-9);}
  }}assert.equal(area,1);
 }
});
test('mobile labels reserve controls and legend space with radios placed first',async()=>{
 const {layoutSceneLabels}=await import('../src/lib/scene-geometry');
 const reserved=[{x:0,y:140,w:48,h:115}],items=[{anchorX:150,anchorY:240,w:192,h:36},{anchorX:200,anchorY:185,w:192,h:36},...Array.from({length:7},(_,i)=>({anchorX:40+i*42,anchorY:120+i*40,w:108,h:26}))];
 const labels=layoutSceneLabels(items,{x:6,y:136,w:358,h:310},reserved);
 labels.forEach((r,i)=>{assert.ok(r.x>=6&&r.y>=136&&r.x+r.w<=364&&r.y+r.h<=446);for(const other of [...reserved,...labels.slice(0,i)])assert.ok(r.x+r.w<=other.x||other.x+other.w<=r.x||r.y+r.h<=other.y||other.y+other.h<=r.y);});
});
