import {isFixed,isRouter,ROLE_LABELS,type Node,type SimParams} from './radio';
import {MOUNT_SITES} from './site-features';
import type {InventorySettings} from './equipment';
import type {InfrastructurePlan} from './infrastructure-planner';
export type ScenarioChoice={id:string;title:string;detail:string;nodes:Node[];params:SimParams;inventory:InventorySettings;strong?:number;access?:number};
export const siteName=(n:Node)=>MOUNT_SITES.find(s=>Math.hypot(s.x-n.x,s.y-n.y)<2)?.label??'Custom location';
export function radioCode(n:Node,nodes:Node[]){return isRouter(n)?`R${nodes.filter(isRouter).findIndex(v=>v.id===n.id)+1}`:isFixed(n)?`C${nodes.filter(v=>isFixed(v)&&!isRouter(v)).findIndex(v=>v.id===n.id)+1}`:'H';}
export function scenarioChoices(nodes:Node[],params:SimParams,inventory:InventorySettings,plan:InfrastructurePlan|null):ScenarioChoice[]{
 const primary=nodes.find(n=>n.id===(params.meshRootId??'primary-p1'));const options:ScenarioChoice[]=[];
 if(primary&&nodes.some(n=>isFixed(n)&&n.id!==primary.id))options.push({id:'primary-only',title:`${radioCode(primary,nodes)} alone`,detail:'Remove fixed support radios; keep the primary site, height and all other test settings.',nodes:nodes.filter(n=>n.id===primary.id||!isFixed(n)),params:{...params},inventory:{...inventory,budget:1}});
 if(plan){const alternatives=plan.alternatives.filter(a=>{const next=a.nodes.find(n=>n.id==='primary-p1');return next&&(!primary||next.x!==primary.x||next.y!==primary.y||next.agl!==primary.agl);});const stage=alternatives.find(a=>siteName(a.nodes.find(n=>n.id==='primary-p1')!)==='Main Stage');const ordered=[...(stage?[stage]:[]),...alternatives.filter(a=>a!==stage)];for(const a of ordered){const p=a.nodes.find(n=>n.id==='primary-p1')!;options.push({id:`site-${p.x}-${p.y}-${p.agl}`,title:`R1 at ${siteName(p).replace(/ camp$/i,'')}`,detail:`${a.nodes.filter(isFixed).length} fixed radios · primary antenna ${p.agl} m above ground`,nodes:a.nodes,params:a.params,inventory:plan.inventory,strong:a.likelyFraction,access:a.redundantFraction});}}
 return options;
}
/** Compare physical identity, including moved existing radios; previews must never infer changes from new IDs only. */
export function placementChanges(before:Node[],after:Node[]):string[]{
 const changes:string[]=[];
 for(const n of before.filter(isFixed)){const next=after.find(v=>v.id===n.id);const code=radioCode(n,before);if(!next){changes.push(`${code} removed from this scenario`);continue;}if(next.x!==n.x||next.y!==n.y)changes.push(`${code}: ${siteName(n)} → ${siteName(next)}`);if(next.agl!==n.agl)changes.push(`${code}: antenna ${n.agl??'default'} → ${next.agl??'default'} m`);if(next.role!==n.role)changes.push(`${code}: ${ROLE_LABELS[n.role??'client']} → ${ROLE_LABELS[next.role??'client']}`);}
 for(const n of after.filter(isFixed))if(!before.some(v=>v.id===n.id))changes.push(`${radioCode(n,after)} added at ${siteName(n)}`);
 return changes;
}
