import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inventoryLocks,withRoamingTests} from '../src/lib/planning-state';
import {DEFAULT_INVENTORY} from '../src/lib/equipment';
import type {Node} from '../src/lib/radio';
const radio:Node={id:'actual-custom-mast',kind:'m1',deployment:'fixed',role:'client_base',locked:true,x:20,y:30,agl:9,label:'My roof radio',txDbm:17};
test('custom locks reserve existing inventory and retain user identity, position and RF values',()=>{const locks=inventoryLocks([radio],DEFAULT_INVENTORY);assert.deepEqual(locks[0],{...radio,inventorySlot:'camp-1'});assert.throws(()=>inventoryLocks([radio],{...DEFAULT_INVENTORY,campRadios:0}),/No camp/);assert.throws(()=>inventoryLocks([{...radio,inventorySlot:'camp-1'}],{...DEFAULT_INVENTORY,campRadios:0}),/removed/);assert.throws(()=>inventoryLocks([{...radio,inventorySlot:'camp-1'},{...radio,id:'second',inventorySlot:'camp-1'}],DEFAULT_INVENTORY),/same equipment/);});
test('complete infrastructure replacement preserves deliberate roaming test nodes exactly',()=>{const roaming={...radio,id:'my-roaming-test',deployment:'roaming' as const,role:'client' as const,locked:false};const next=[{...radio,id:'primary-p1',kind:'p1' as const,role:'router' as const}];assert.deepEqual(withRoamingTests(next,[radio,roaming]),[...next,roaming]);assert.deepEqual(inventoryLocks([roaming],DEFAULT_INVENTORY),[]);});
test('an imported roaming identity collision cannot silently delete a physical radio',()=>{const roaming={...radio,id:'primary-p1',deployment:'roaming' as const,role:'client' as const};const next=[{...radio,id:'primary-p1',kind:'p1' as const,role:'router' as const}];assert.throws(()=>withRoamingTests(next,[roaming]),/unique ID/);assert.equal(roaming.deployment,'roaming');});
