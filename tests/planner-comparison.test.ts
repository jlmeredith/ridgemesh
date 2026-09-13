import {test} from 'node:test';
import assert from 'node:assert/strict';
import {useSim} from '../src/lib/store';
test('newly placed and removed bases reconcile to actual endpoints',()=>{const s=useSim.getState();s.loadPreset('empty');s.addNode('m1',50,50);const first=useSim.getState().nodes[0].id;assert.equal(useSim.getState().params().meshRootId,first);useSim.getState().addNode('m1',60,60);useSim.getState().removeNode(first);assert.equal(useSim.getState().params().meshRootId,useSim.getState().nodes[0].id);useSim.getState().setParams({crewIds:[useSim.getState().nodes[0].id]});useSim.getState().removeNode(useSim.getState().nodes[0].id);assert.equal(useSim.getState().params().meshRootId,undefined);assert.deepEqual(useSim.getState().params().crewIds,[]);});
