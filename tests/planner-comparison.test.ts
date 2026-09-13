import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparisonLayouts } from '../src/lib/planner-comparison';
import { DEFAULT_PARAMS, useSim } from '../src/lib/store';
import type { Node } from '../src/lib/radio';
test('hardware comparisons preserve user positions, heights, base and same-system colocated endpoints',()=>{
 const nodes:Node[]=[{id:'a',label:'My west radio',kind:'m1',x:50,y:70,agl:2,txDbm:10},{id:'b',label:'My east radio',kind:'m1',x:90,y:95,agl:3},{id:'c',label:'Same place lower radio',kind:'m1',x:90,y:95,agl:1},{id:'r',label:'Existing mast',kind:'v4',x:80,y:40,agl:9}];
 const snapshots=comparisonLayouts(nodes,{...DEFAULT_PARAMS,meshRootId:'b',receiverAgl:1.7});
 assert.equal(snapshots.length,4);
 for(const snapshot of snapshots){const handhelds=snapshot.nodes.filter(n=>n.kind===(snapshot.preset==='totem-crew'?'totem':'m1'));assert.deepEqual(handhelds.map(n=>[n.x,n.y,n.agl]),[[50,70,2],[90,95,3],[90,95,1]]);assert.equal(snapshot.params.receiverAgl,1.7);const base=handhelds.find(n=>n.id===(snapshot.preset==='totem-crew'?snapshot.params.totemRootId:snapshot.params.meshRootId));assert.equal(base?.x,90);assert.equal(base?.agl,3);}
 assert.equal(snapshots[0].nodes[0].txDbm,undefined,'M1 power must not contaminate Totem assumption');
 assert.equal(snapshots[1].nodes[0].txDbm,10,'Configured M1 power stays configured');
 assert.equal(snapshots[1].nodes.some(n=>n.kind==='v4'),false);assert.equal(snapshots[2].nodes.find(n=>n.kind==='v4')?.agl,9);
});
test('newly placed and removed bases reconcile to actual endpoints',()=>{const s=useSim.getState();s.loadPreset('empty');s.addNode('m1',50,50);const first=useSim.getState().nodes[0].id;assert.equal(useSim.getState().params().meshRootId,first);useSim.getState().addNode('m1',60,60);useSim.getState().removeNode(first);assert.equal(useSim.getState().params().meshRootId,useSim.getState().nodes[0].id);useSim.getState().setParams({crewIds:[useSim.getState().nodes[0].id]});useSim.getState().removeNode(useSim.getState().nodes[0].id);assert.equal(useSim.getState().params().meshRootId,undefined);assert.deepEqual(useSim.getState().params().crewIds,[]);});
