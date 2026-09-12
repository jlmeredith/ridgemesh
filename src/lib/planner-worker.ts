import { analyzeScenario, analysisSurface, type Node, type SimParams } from './radio';
import { optimizePlacement, type Candidate } from './optimizer';
import { CAMPS } from './terrain';
import { presetNodes, type Preset } from './store';
export type Analysis = ReturnType<typeof analyzeScenario>;
export type WorkerRequest = {id:number;kind:'analyze'|'compare'|'optimize';nodes:Node[];params:SimParams;budget?:number;candidates?:Candidate[]};
self.onmessage=(event:MessageEvent<WorkerRequest>)=>{
 const q=event.data;const start=performance.now();
 try{
  if(q.kind==='analyze'){const result=analyzeScenario(q.nodes,q.params,{step:8});self.postMessage({id:q.id,kind:q.kind,result,elapsed:performance.now()-start});}
  if(q.kind==='compare'){const results=[];for(const preset of ['totem-crew','m1-only','backbone','hybrid'] as Preset[]){self.postMessage({id:q.id,kind:'progress',message:`Comparing ${preset}…`});const params={...q.params,rootId:undefined,meshRootId:'m1-0',totemRootId:'totem-0',crewIds:undefined};const result=analyzeScenario(presetNodes(preset),params,{step:12});results.push({preset,...result});}self.postMessage({id:q.id,kind:q.kind,result:results,elapsed:performance.now()-start});}
  if(q.kind==='optimize'){self.postMessage({id:q.id,kind:'progress',message:'Evaluating connected placement alternatives…'});const result=optimizePlacement({nodes:q.nodes,params:q.params,targets:CAMPS.map(c=>({...c,kind:'m1' as const,weight:1})),candidates:q.candidates??[],budget:q.budget??2,surface:analysisSurface});self.postMessage({id:q.id,kind:q.kind,result,elapsed:performance.now()-start});}
 }catch(e){self.postMessage({id:q.id,kind:'error',message:e instanceof Error?e.message:'Calculation failed'});}
};
