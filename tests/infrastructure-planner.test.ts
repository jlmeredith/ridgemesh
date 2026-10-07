import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planInfrastructure} from '../src/lib/infrastructure-planner';
import {DEFAULT_INVENTORY,availableRadios,validateInventory,type InventorySettings} from '../src/lib/equipment';
import {directedLink,evaluateTarget,type Environment,type Surface,type RadioNode} from '../src/lib/model';
const surface:Surface={version:'fixture',cellM:10,cols:500,rows:500,elevation:()=>0,cover:()=> 'field'};
const params:Environment={crowd:0,bagLoss:false,includeRoamingRelays:false,meshHops:3,fadeDb:8};
const sites=[{id:'stage',label:'Stage',x:0,y:0},{id:'stargazer',label:'Stargazer',x:100,y:0},{id:'camp',label:'Camp',x:200,y:0}];
const targets=[{id:'west',label:'West',x:5,y:10,weight:2},{id:'east',label:'East',x:205,y:10,weight:1}];
const settings=(patch:Partial<InventorySettings>={}):InventorySettings=>({...DEFAULT_INVENTORY,allowedSiteIds:sites.map(s=>s.id),maxAgl:3,...patch});
const plan=(patch:Partial<InventorySettings>={},lockedNodes?:RadioNode[])=>planInfrastructure({inventory:settings(patch),params,targets,surface,sites,lockedNodes});
test('one-budget main P1 equals an independently enumerated coverage oracle',()=>{
 const r=plan({budget:1});const scores=sites.flatMap(s=>[1.5,3].map(agl=>{
  const node:RadioNode={id:'primary-p1',kind:'p1',label:s.label,x:s.x,y:s.y,agl,role:'router',deployment:'fixed'};
  return targets.reduce((sum,t)=>{const result=evaluateTarget(t,[node],{...params,meshRootId:node.id},surface,'mesh');return sum+t.weight*(result.status==='likely'?1:result.status==='marginal'?.5:0);},0);
 }));
 assert.equal(r.score,Math.max(...scores));assert.equal(r.redundantFraction,0);assert.equal(r.nodes.length,1);assert.equal(r.nodes[0].kind,'p1');assert.equal(r.nodes[0].id,'primary-p1');assert.equal(r.nodes[0].role,'router');assert.equal(r.nodes[0].deployment,'fixed');assert.equal(r.evaluations,sites.length*2);
});
test('mandatory router remains even when no target can be served',()=>{const r=planInfrastructure({inventory:settings({budget:1}),params:{...params,fadeDb:1000},targets,surface,sites});assert.equal(r.score,0);assert.equal(r.used,1);assert.equal(r.nodes[0].id,'primary-p1');});
test('budget frontier is monotonic and inventory is never fabricated',()=>{const r=plan({budget:3});for(let i=1;i<r.byBudget.length;i++){assert.ok(r.byBudget[i].score>=r.byBudget[i-1].score);if(r.byBudget[i].score===r.byBudget[i-1].score)assert.ok(r.byBudget[i].redundantFraction>=r.byBudget[i-1].redundantFraction);}for(const entry of r.byBudget){assert.ok(entry.used<=entry.budget);assert.equal(entry.nodes.filter(n=>n.kind==='p1').length,1);assert.ok(entry.nodes.every(n=>['primary-p1','camp-1','camp-2'].includes(n.id)));}assert.equal(plan({campRadios:0,budget:8}).used,1);assert.equal(plan({campRadios:0,budget:8}).available,1);assert.equal(availableRadios(settings({campRadios:7,communityRadios:7,includeG3:true})),8);});
test('main site constraint relocates the primary instead of appending another router',()=>{const stage=plan({budget:1,mainSite:'stage'}),high=plan({budget:1,mainSite:'stargazer'});assert.equal(stage.nodes[0].x,0);assert.equal(high.nodes[0].x,100);assert.equal(high.used,1);assert.throws(()=>plan({mainSite:'stage',allowedSiteIds:['camp']}),/No allowed site/);});
test('locked radios survive exactly, consume inventory and reject impossible budgets',()=>{
 const primary:RadioNode={id:'primary-p1',kind:'p1',x:0,y:0,agl:6,role:'router',deployment:'fixed',locked:true,label:'Keep exact',txDbm:20};
 const camp:RadioNode={id:'camp-1',kind:'v4',x:100,y:0,agl:3,role:'client_base',deployment:'fixed',locked:true,label:'Fixed camp',favoriteIds:['primary-p1']};
 const r=plan({budget:2,maxAgl:6},[primary,camp]);assert.deepEqual(r.nodes,[primary,camp]);assert.equal(r.used,2);assert.throws(()=>plan({budget:2,maxAgl:3},[primary,camp]),/height/);assert.throws(()=>plan({budget:2,maxAgl:6},[{...primary,deployment:undefined},camp]),/fixed/);assert.throws(()=>plan({budget:1,maxAgl:6},[primary,camp]),/Budget/);assert.throws(()=>plan({campRadios:0},[camp]),/inventory/);
});
test('optional offered equipment uses its own inventory slot and router-late remains configurable',()=>{
 const g3:RadioNode={id:'offered-g3',kind:'g3',x:100,y:0,agl:3,role:'client_base',deployment:'fixed',label:'Proposed G3 campsite; owner confirmation required'};
 const r=plan({budget:2,campRadios:0,includeG3:true,mainRole:'router_late'},[g3]);assert.equal(r.available,2);assert.equal(r.nodes.find(n=>n.id==='primary-p1')?.role,'router_late');assert.deepEqual(r.nodes.find(n=>n.id==='offered-g3'),g3);assert.throws(()=>plan({includeG3:false},[g3]),/inventory/);
});
test('roaming counts neither create pinned nodes nor alter coverage',()=>{const a=plan({roamingCount:0}),b=plan({roamingCount:25});assert.deepEqual(a.nodes,b.nodes);assert.equal(a.score,b.score);assert.equal(a.likelyFraction,b.likelyFraction);assert.equal(a.available,b.available);});
test('invalid inventory and locks are rejected',()=>{assert.throws(()=>validateInventory(settings({budget:0})));assert.throws(()=>validateInventory(settings({maxAgl:NaN})));assert.throws(()=>validateInventory(settings({mainSite:'x'.repeat(101)})));assert.throws(()=>validateInventory(settings({allowedSiteIds:['stage','stage']})));assert.throws(()=>plan({},[{id:'primary-p1',kind:'p1',x:0,y:0,label:'bad',role:'client',deployment:'fixed'}]),/router role/);});

test('two-access-node fraction matches an independent exhaustive two-device oracle',()=>{
 const r=plan({budget:2,campRadios:1});
 const pairs=sites.flatMap(a=>sites.filter(b=>a.id!==b.id).flatMap(b=>[1.5,3].flatMap(ha=>[1.5,3].map(hb=>{
  const main:RadioNode={id:'primary-p1',kind:'p1',x:a.x,y:a.y,agl:ha,label:a.label,role:'router',deployment:'fixed'};
  const support:RadioNode={id:'camp-1',kind:'v4',x:b.x,y:b.y,agl:hb,label:b.label,role:'client_base',deployment:'fixed'};
  const both=(x:RadioNode,y:RadioNode)=>directedLink(x,y,params,surface).ok&&directedLink(y,x,params,surface).ok;
  let score=0,redundantWeight=0;
  for(const target of targets){const result=evaluateTarget(target,[main,support],{...params,meshRootId:main.id},surface,'mesh');score+=target.weight*(result.status==='likely'?1:result.status==='marginal'?.5:0);const ghost:RadioNode={id:target.id,kind:'l1',x:target.x,y:target.y,agl:1.5,label:target.label,role:'mute'};if(both(main,support)&&both(ghost,main)&&both(ghost,support))redundantWeight+=target.weight;}
  return {score,redundantFraction:redundantWeight/3};
 }))));
 const maxScore=Math.max(...pairs.map(p=>p.score));const expected=Math.max(...pairs.filter(p=>p.score===maxScore).map(p=>p.redundantFraction));
 assert.equal(r.score,maxScore);assert.equal(r.redundantFraction,expected);assert.equal(r.redundantFraction,1);assert.equal(r.used,2);assert.equal(r.nodes.find(n=>n.id==='camp-1')?.role,'client_base');
});
test('access redundancy reserves the final RF edge and stops rewarding extra stock after saturation',()=>{
 const short=planInfrastructure({inventory:settings({budget:3}),params:{...params,meshHops:1},targets,surface,sites});
 assert.equal(short.redundantFraction,0);assert.equal(short.used,1);
 const enough=plan({budget:3});assert.equal(enough.redundantFraction,1);assert.equal(enough.used,2);assert.equal(enough.byBudget[0].redundantFraction,0);
});
test('generic camp locks preserve actual hardware and overrides while enforcing physical bounds',()=>{
 const actual:RadioNode={id:'camp-1',kind:'m1',x:75,y:12,agl:2,role:'client_base',deployment:'fixed',locked:true,label:'Actual M1 camp',txDbm:19,gainDbi:2,cableDb:.3,favoriteIds:['primary-p1']};
 const r=plan({budget:2,allowedSiteIds:['stage']},[actual]);assert.deepEqual(r.nodes.find(n=>n.id===actual.id),actual);
 assert.throws(()=>plan({budget:2},[{...actual,x:-.1}]),/fixed forwarding/);
 assert.throws(()=>plan({budget:2},[{...actual,x:surface.cols}]),/fixed forwarding/);
 assert.throws(()=>plan({budget:2},[{...actual,y:surface.rows}]),/fixed forwarding/);
 assert.throws(()=>plan({budget:2},[{...actual,agl:.4}]),/height/);
 assert.throws(()=>plan({budget:2},[{...actual,kind:'p1'}]),/inventory/);
});
test('custom physical IDs reserve existing inventory slots without being renamed or duplicated',()=>{
 const custom:RadioNode={id:'my-roof-node',inventorySlot:'camp-1',kind:'m1',x:75,y:12,agl:2,role:'client_base',deployment:'fixed',locked:true,label:'My actual roof radio',txDbm:19};
 const r=plan({budget:3},[custom]);assert.deepEqual(r.nodes.find(n=>n.id===custom.id),custom);assert.ok(!r.nodes.some(n=>n.id==='camp-1'));assert.ok(r.used<=3);
 assert.throws(()=>plan({budget:3},[custom,{...custom,id:'other-physical-radio',x:80}]),/inventory/);
 assert.throws(()=>plan({budget:3,campRadios:0},[custom]),/inventory/);
 assert.throws(()=>plan({budget:2},[{...custom,id:'custom-p1',inventorySlot:'primary-p1',kind:'p1',role:'router'}]),/inventory/);
 assert.throws(()=>plan({budget:2},[{...custom,id:'primary-p1'}]),/inventory/);
});
