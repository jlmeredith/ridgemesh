import {analyzeScenario,analysisSurface,planningTargets,type Node,type SimParams} from './radio';
import {planInfrastructure} from './infrastructure-planner';
import type {InventorySettings} from './equipment';
export type Analysis=ReturnType<typeof analyzeScenario>;
export type WorkerRequest={id:number;kind:'analyze'|'plan'|'preview';nodes:Node[];params:SimParams;inventory?:InventorySettings;lockedNodes?:Node[]};
self.onmessage=(event:MessageEvent<WorkerRequest>)=>{const q=event.data,start=performance.now();try{
 if(q.kind==='plan'){
  if(!q.inventory)throw new Error('Choose the available equipment first.');
  self.postMessage({id:q.id,kind:'progress',message:'Comparing P1 locations, antenna heights and fixed-radio budgets…'});
  const result=planInfrastructure({inventory:q.inventory,params:q.params,targets:planningTargets(q.params,4),surface:analysisSurface,lockedNodes:q.lockedNodes});
  const analysis=analyzeScenario(result.nodes,result.params,{step:4});
  self.postMessage({id:q.id,kind:q.kind,result,analysis,elapsed:performance.now()-start});
 }else self.postMessage({id:q.id,kind:q.kind,result:analyzeScenario(q.nodes,q.params,{step:4}),elapsed:performance.now()-start});
 }catch(e){self.postMessage({id:q.id,kind:'error',message:e instanceof Error?e.message:'Calculation failed'});}};
