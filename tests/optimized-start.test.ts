import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStarterScenario,isStarterPlan,STARTER_PLAN} from '../src/lib/starter-plan';
import {resolveStartup} from '../src/lib/startup';
import {parseScenario,type Scenario} from '../src/lib/store';
import {STARTER_PARAMS} from '../src/lib/placement-policy';
import {DEFAULT_INVENTORY} from '../src/lib/equipment';
import {MODEL_VERSION,analyzeScenario,analysisSurface,planningTargets,suggestClients} from '../src/lib/radio';
import {TERRAIN_VERSION} from '../src/lib/terrain';
import {planInfrastructure} from '../src/lib/infrastructure-planner';
import legacyInventory from '../src/lib/legacy-inventory-start.json';
test('committed starter is actual current inventory search with mandatory solar P1 and no invented roaming positions',()=>{
 const scenario=createStarterScenario();assert.deepEqual(parseScenario(JSON.stringify(scenario),TERRAIN_VERSION,MODEL_VERSION),scenario);
 const result=planInfrastructure({inventory:DEFAULT_INVENTORY,params:STARTER_PARAMS,targets:planningTargets(STARTER_PARAMS,4),surface:analysisSurface});
 assert.deepEqual(scenario.nodes,result.nodes);assert.equal(result.score,STARTER_PLAN.score);assert.equal(result.redundantFraction,STARTER_PLAN.redundantFraction);
 assert.equal(scenario.nodes.filter(n=>n.kind==='p1'&&n.id==='primary-p1').length,1);assert.ok(scenario.nodes.every(n=>n.deployment==='fixed'));assert.equal(scenario.params.meshRootId,'primary-p1');
 const analysis=analyzeScenario(scenario.nodes,scenario.params,{step:4});assert.equal(analysis.stats.meshLikelyFrac,result.likelyFraction);assert.ok(Math.abs(analysis.stats.targetAreaSqM-result.areaSqM)<1e-6);
});
test('fresh starter snapshots are independent; valid custom and deliberately empty plans win',()=>{
 const initial=resolveStartup(null);assert.equal(initial.source,'recommended');assert.ok(isStarterPlan(initial.scenario.nodes,initial.scenario.params));
 const original=createStarterScenario().nodes[0].agl;initial.scenario.nodes[0].agl=29;assert.equal(createStarterScenario().nodes[0].agl,original);
 for(const nodes of [initial.scenario.nodes,[]]){const custom:Scenario={...initial.scenario,name:'My own decision',nodes};const result=resolveStartup(JSON.stringify(custom));assert.equal(result.source,'saved');assert.deepEqual(result.scenario,custom);}
});
const oldStarter=()=>({...createStarterScenario(),schema:2,modelVersion:'ridgemesh-rf-3.0',name:'My event plan',nodes:suggestClients().map(n=>{const {deployment:_,...old}=n;void _;return old;}),params:{crowd:.35,bagLoss:false,clientsHop:false,meshHops:3,totemHops:5,communityTotems:false,mode:'base',receiverAgl:1.5,meshRootId:'m1-0',totemRootId:'totem-0'}});
test('only exact old scaffold upgrades; named, physical and RF changes survive migration with raw backup',()=>{
 const old=oldStarter(),raw=JSON.stringify(old);const upgraded=resolveStartup(raw);assert.equal(upgraded.source,'upgraded');assert.equal(upgraded.backup,raw);assert.ok(upgraded.scenario.nodes.some(n=>n.kind==='p1'));
 for(const changed of [{...old,name:'Saved camp'},{...old,nodes:old.nodes.map((n,i)=>i?n:{...n,label:'Named by owner'})},{...old,nodes:old.nodes.map((n,i)=>i?n:{...n,x:n.x+.1})},{...old,params:{...old.params,receiverAgl:1.6}}]){const text=JSON.stringify(changed),result=resolveStartup(text);assert.equal(result.source,'saved');assert.equal(result.backup,text);assert.equal(result.scenario.nodes[0].x,changed.nodes[0].x);assert.equal(result.scenario.schema,3);}
});
test('retired hardware migration preserves original bytes and supported devices; corrupt contents remain recoverable',()=>{
 const old=oldStarter();const raw=JSON.stringify({...old,name:'Custom mixed legacy',nodes:[...old.nodes,{...old.nodes[0],kind:'totem',id:'retired'}]});const result=resolveStartup(raw);assert.equal(result.source,'saved');assert.equal(result.backup,raw);assert.equal(result.scenario.nodes.length,old.nodes.length);assert.ok(result.scenario.nodes.every(n=>n.kind!=='totem' as string));
 for(const raw of ['', '{broken',JSON.stringify({...createStarterScenario(),siteVersion:'old-site'})]){const result=resolveStartup(raw);assert.equal(result.source,'recovered');assert.equal(result.rejected,raw);assert.ok(result.error);}
});
test('only the exact prior inventory starter upgrades to MediumFast; custom physical and RF decisions retain previous assumptions',()=>{const raw=JSON.stringify(legacyInventory),upgraded=resolveStartup(raw);assert.equal(upgraded.source,'upgraded');assert.equal(upgraded.backup,raw);assert.equal(upgraded.scenario.params.defaultRxDbm,-126);for(const changed of [{...legacyInventory,name:'My saved radio decision'},{...legacyInventory,nodes:legacyInventory.nodes.map((n,i)=>i?n:{...n,agl:9})}]){const text=JSON.stringify(changed),r=resolveStartup(text);assert.equal(r.source,'saved');assert.equal(r.backup,text);assert.equal(r.scenario.params.defaultRxDbm,undefined);assert.deepEqual(r.scenario.nodes,changed.nodes);}});
