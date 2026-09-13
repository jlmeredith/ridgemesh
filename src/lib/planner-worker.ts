import { analyzeScenario, analysisSurface, planningTargets, type Node, type SimParams } from './radio';
import { optimizePlacement, type Candidate } from './optimizer';
import { comparisonLayouts } from './planner-comparison';
import type { Preset } from './store';
export type Analysis=ReturnType<typeof analyzeScenario>;
export type Comparison=Analysis&{preset:Preset;description:string};
export type WorkerRequest={id:number;kind:'analyze'|'compare'|'optimize'|'preview';nodes:Node[];params:SimParams;budget?:number;candidates?:Candidate[]};
const STEP=4;
self.onmessage=(event:MessageEvent<WorkerRequest>)=>{
 const q=event.data,start=performance.now();
 try{
  if(q.kind==='analyze'||q.kind==='preview'){const result=analyzeScenario(q.nodes,q.params,{step:STEP});self.postMessage({id:q.id,kind:q.kind,result,elapsed:performance.now()-start});}
  if(q.kind==='compare'){const results:Comparison[]=[];for(const layout of comparisonLayouts(q.nodes,q.params)){self.postMessage({id:q.id,kind:'progress',message:`Comparing ${layout.preset} at your current locations…`});results.push({preset:layout.preset,description:layout.description,...analyzeScenario(layout.nodes,layout.params,{step:STEP})});}self.postMessage({id:q.id,kind:q.kind,result:results,elapsed:performance.now()-start});}
  if(q.kind==='optimize'){
   self.postMessage({id:q.id,kind:'progress',message:'Testing permitted sites and mast heights…'});
   const result=optimizePlacement({nodes:q.nodes,params:q.params,targets:planningTargets(q.params,STEP),candidates:q.candidates??[],budget:q.budget??2,surface:analysisSurface});
   self.postMessage({id:q.id,kind:'progress',message:'Verifying proposed coverage and remaining event-site gaps…'});
   const before=analyzeScenario(q.nodes,q.params,{step:STEP}),after=analyzeScenario(result.best.nodes,q.params,{step:STEP});
   const served=(status:string)=>status==='likely'||status==='marginal';
   result.siteGains=after.pois.mesh.filter((r,i)=>served(r.status)&&!served(before.pois.mesh[i].status)).map(r=>r.target.label);
   result.siteGaps=after.pois.mesh.filter(r=>r.status==='unavailable').map(r=>r.target.label);
   result.siteUnknown=after.pois.mesh.filter(r=>r.status==='unknown').map(r=>r.target.label);
   result.verifiedArea={baselineLikely:before.stats.meshLikelyFrac,proposedLikely:after.stats.meshLikelyFrac,baselineMarginal:before.stats.meshMarginalFrac,proposedMarginal:after.stats.meshMarginalFrac,areaSqM:after.stats.targetAreaSqM};
   self.postMessage({id:q.id,kind:q.kind,result,preview:after,elapsed:performance.now()-start});
  }
 }catch(e){self.postMessage({id:q.id,kind:'error',message:e instanceof Error?e.message:'Calculation failed'});}
};
