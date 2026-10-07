import {directedLink,evaluateTarget,routeBetween,HARDWARE,type RadioNode,type Environment,type Surface,type Target,type Budget} from './model';
import {MOUNT_SITES} from './site-features';
import {availableRadios,validateInventory,type InventorySettings} from './equipment';

export type InfrastructureSite={id:string;label:string;x:number;y:number};
export type BudgetPlan={budget:number;used:number;score:number;likelyFraction:number;marginalFraction:number;redundantFraction:number;nodes:RadioNode[];params:Environment};
export type InfrastructurePlan={nodes:RadioNode[];params:Environment;inventory:InventorySettings;score:number;likelyFraction:number;marginalFraction:number;redundantFraction:number;areaSqM:number;bottleneckDb:number;evaluations:number;used:number;available:number;reserve:number;byBudget:BudgetPlan[];alternatives:{label:string;nodes:RadioNode[];params:Environment;score:number;likelyFraction:number;marginalFraction:number;redundantFraction:number}[];method:string;limitations:string[]};
type Evaluation={nodes:RadioNode[];score:number;likelyFraction:number;marginalFraction:number;redundantFraction:number;bottleneckDb:number;headroom:number;height:number;connected:boolean;siteId:string};
export function planInfrastructure(req:{inventory:InventorySettings;params:Environment;targets:Target[];surface:Surface;lockedNodes?:RadioNode[];sites?:InfrastructureSite[];cancelled?:()=>boolean}):InfrastructurePlan {
 const inventory=validateInventory(req.inventory),available=availableRadios(inventory),cap=Math.min(inventory.budget,available),params:Environment={...req.params,meshRootId:'primary-p1',rootId:'primary-p1',mode:'base'};
 const allSites=req.sites??MOUNT_SITES,sites=allSites.filter(s=>inventory.allowedSiteIds.includes(s.id));
 if(new Set(allSites.map(s=>s.id)).size!==allSites.length||allSites.some(s=>![s.x,s.y].every(Number.isFinite)))throw new Error('Invalid mount sites.');
 if(req.targets.some(t=>!Number.isFinite(t.weight??1)||(t.weight??1)<0))throw new Error('Invalid target weights.');
 const slots:{id:string;kind:RadioNode['kind'];label:string}[]=[{id:'primary-p1',kind:'p1',label:'Main Seeed P1'},...Array.from({length:inventory.campRadios},(_,i)=>({id:`camp-${i+1}`,kind:'v4' as const,label:`Camp radio ${i+1}`})),...Array.from({length:inventory.communityRadios},(_,i)=>({id:`community-${i+1}`,kind:'v4' as const,label:`Community radio ${i+1}`})),...(inventory.includeG3?[{id:'offered-g3',kind:'g3' as const,label:'Offered Station G3'}]:[])];
 const locked=structuredClone(req.lockedNodes??[]);
 const slotOf=(node:RadioNode)=>node.inventorySlot??node.id;
 if(new Set(locked.map(n=>n.id)).size!==locked.length||new Set(locked.map(slotOf)).size!==locked.length||locked.some(n=>(n.id==='primary-p1'&&slotOf(n)!=='primary-p1')||!slots.some(s=>s.id===slotOf(n)&&(s.id==='primary-p1'?n.kind==='p1'&&n.id==='primary-p1':s.id==='offered-g3'?n.kind==='g3':['m1','l1','v4','g3'].includes(n.kind)))||n.deployment!=='fixed'||!['client','client_base','router','router_late'].includes(n.role??'')||![n.x,n.y,n.agl??HARDWARE[n.kind].agl].every(Number.isFinite)||n.x<0||n.x>req.surface.cols-1||n.y<0||n.y>req.surface.rows-1))throw new Error('Locked infrastructure must match available inventory and fixed forwarding devices.');
 if(locked.filter(n=>n.kind==='p1').some(n=>n.id!=='primary-p1'||slotOf(n)!=='primary-p1'||n.role!==inventory.mainRole))throw new Error('Locked P1 conflicts with the required main router role.');
 if(locked.length+Number(!locked.some(n=>n.id==='primary-p1'))>cap)throw new Error('Budget cannot preserve the locked devices and mandatory P1.');
 if(locked.some(n=>(n.agl??HARDWARE[n.kind].agl)>inventory.maxAgl||(n.agl??HARDWARE[n.kind].agl)<.5))throw new Error('Locked antenna height conflicts with the mount height limit.');
 const lockedPrimary=locked.find(n=>n.id==='primary-p1');
 if(lockedPrimary&&inventory.mainSite!=='auto'&&!sites.some(s=>s.id===inventory.mainSite&&s.x===lockedPrimary.x&&s.y===lockedPrimary.y))throw new Error('Locked P1 conflicts with the selected main site.');
 const heights=[1.5,3,6,9,12,18,24,30].filter(h=>h<=inventory.maxAgl);
 const linkCache=new Map<string,Budget>();const link=(a:RadioNode,b:RadioNode)=>{const key=JSON.stringify([a,b]);let result=linkCache.get(key);if(!result){result=directedLink(a,b,params,req.surface);if(linkCache.size<100000)linkCache.set(key,result);}return result;};
 let evaluations=0;const total=req.targets.reduce((sum,t)=>sum+(t.weight??1),0);
 const cache=new Map<string,Evaluation>();
 const evaluate=(nodes:RadioNode[],siteId:string):Evaluation=>{
  const key=JSON.stringify([...nodes].sort((a,b)=>a.id.localeCompare(b.id)));const old=cache.get(key);if(old)return old;evaluations++;
  const connected=nodes.every(n=>['likely','marginal'].includes(routeBetween(nodes,n.id,'primary-p1',params,req.surface,link).status)&&['likely','marginal'].includes(routeBetween(nodes,'primary-p1',n.id,params,req.surface,link).status));
  // Reserve one RF edge for target/access, then require both access/backbone directions.
  const remainingParams={...params,meshHops:Math.max(0,params.meshHops-1)};
  const accessNodes=params.meshHops>=1?nodes.filter(n=>['likely','marginal'].includes(routeBetween(nodes,n.id,'primary-p1',remainingParams,req.surface,link).status)&&['likely','marginal'].includes(routeBetween(nodes,'primary-p1',n.id,remainingParams,req.surface,link).status)):[];
  let likely=0,marginal=0,redundant=0,headroom=0,bottleneckDb=Infinity;
  for(const target of req.targets){const r=evaluateTarget(target,nodes,params,req.surface,'mesh',link),w=target.weight??1;if(r.status==='likely')likely+=w;if(r.status==='marginal')marginal+=w;if(r.status==='likely'||r.status==='marginal'){headroom+=w*Math.floor(Math.min(12,Math.max(0,r.marginDb))*2)/2;bottleneckDb=Math.min(bottleneckDb,r.marginDb);
   const ghost:RadioNode={id:`target:${target.id}`,label:target.label,x:target.x,y:target.y,kind:target.kind??params.receiverKind??'l1',agl:target.agl??params.receiverAgl??1.5,role:'mute'};
   let accessCount=0;for(const node of accessNodes){if(link(ghost,node).ok&&link(node,ghost).ok){accessCount++;if(accessCount===2){redundant+=w;break;}}}
  }}
  const value={nodes,score:likely+.5*marginal,likelyFraction:total?likely/total:0,marginalFraction:total?marginal/total:0,redundantFraction:total?redundant/total:0,bottleneckDb:bottleneckDb===Infinity?NaN:bottleneckDb,headroom:total?headroom/total:0,height:nodes.reduce((sum,n)=>sum+(n.agl??HARDWARE[n.kind].agl),0),connected,siteId};cache.set(key,value);return value;
 };
 const compare=(a:Evaluation,b:Evaluation)=>b.score-a.score||b.redundantFraction-a.redundantFraction||b.headroom-a.headroom||a.nodes.length-b.nodes.length||a.height-b.height||JSON.stringify(a.nodes).localeCompare(JSON.stringify(b.nodes));
 const makeNode=(slot:typeof slots[number],site:InfrastructureSite,agl:number):RadioNode=>{let id=slot.id;let suffix=1;while(locked.some(n=>n.id===id))id=`${slot.id}-planned-${suffix++}`;return {id,...(id!==slot.id?{inventorySlot:slot.id}:{}),kind:slot.kind,x:site.x,y:site.y,agl,role:slot.id==='primary-p1'?inventory.mainRole:inventory.supportRole,deployment:'fixed',label:`${slot.label} · ${site.label}`.slice(0,100)};};
 const initial:Evaluation[]=[];
 if(lockedPrimary)initial.push(evaluate(locked,allSites.find(s=>s.x===lockedPrimary.x&&s.y===lockedPrimary.y)?.id??'locked'));
 else for(const site of sites.filter(s=>inventory.mainSite==='auto'||s.id===inventory.mainSite)){if(locked.some(n=>n.x===site.x&&n.y===site.y))continue;for(const height of heights)initial.push(evaluate([...locked,makeNode(slots[0],site,height)],site.id));}
 if(!initial.length)throw new Error('No allowed site can host the mandatory P1.');
 const siteBest=new Map<string,Evaluation>();let best:Evaluation|undefined;const byBudget:BudgetPlan[]=[];
 const remember=(items:Evaluation[])=>{for(const e of items){if(!e.connected)continue;if(!best||compare(e,best)<0)best=e;const prev=siteBest.get(e.siteId);if(!prev||compare(e,prev)<0)siteBest.set(e.siteId,e);}};
 // Preserve different main sites before filling the remaining six-state beam by score.
 const beamOf=(items:Evaluation[])=>{const sorted=[...items].sort(compare),selected:Evaluation[]=[];const seen=new Set<string>();for(const e of sorted){if(!seen.has(e.siteId)){seen.add(e.siteId);selected.push(e);if(selected.length===6)return selected;}}for(const e of sorted){if(!selected.includes(e))selected.push(e);if(selected.length===6)break;}return selected;};
 let beam=beamOf(initial);const minimum=initial[0].nodes.length;remember(initial);
 const snapshot=(e:Evaluation,budget:number):BudgetPlan=>({budget,used:e.nodes.length,score:e.score,likelyFraction:e.likelyFraction,marginalFraction:e.marginalFraction,redundantFraction:e.redundantFraction,nodes:e.nodes,params});
 for(let budget=minimum;budget<=cap;budget++){
  if(budget>minimum){if(req.cancelled?.())break;const expanded:Evaluation[]=[];
   for(const state of beam){const remaining=slots.filter(slot=>!state.nodes.some(n=>slotOf(n)===slot.id));const nextSlots=remaining.filter((slot,i)=>remaining.findIndex(s=>s.kind===slot.kind&&s.id.split('-')[0]===slot.id.split('-')[0])===i);
    for(const slot of nextSlots)for(const site of sites){if(state.nodes.some(n=>n.x===site.x&&n.y===site.y))continue;for(const height of heights){if(req.cancelled?.())break;expanded.push(evaluate([...state.nodes,makeNode(slot,site,height)],state.siteId));}}
   }
   remember(expanded);beam=beamOf(expanded);
  }
  if(best)byBudget.push(snapshot(best,budget));
 }
 if(!best)throw new Error('No connected infrastructure plan satisfies the locks and budget.');
 const result:Evaluation=best;
 return {nodes:result.nodes,params,inventory,score:result.score,likelyFraction:result.likelyFraction,marginalFraction:result.marginalFraction,redundantFraction:result.redundantFraction,areaSqM:total*10000,bottleneckDb:result.bottleneckDb,evaluations,used:result.nodes.length,available,reserve:available-result.nodes.length,byBudget,alternatives:[...siteBest.entries()].sort((a,b)=>compare(a[1],b[1])).map(([id,e])=>({label:`Main P1 at ${allSites.find(s=>s.id===id)?.label??'locked position'}`,nodes:e.nodes,params,score:e.score,likelyFraction:e.likelyFraction,marginalFraction:e.marginalFraction,redundantFraction:e.redundantFraction})),method:'Exhaustive main P1 site/height comparison; six-state beam optimizing served area then two-access-node coverage; best found, not global optimum',limitations:['Budget includes one mandatory owned P1; unused inventory remains in reserve. Search supports at most eight fixed devices even when more stock is entered. Optional offers and generic camp hardware are planning inputs, not deployment confirmations.','All allowed P1 site/height combinations are checked. Support search keeps six states with distinct main sites first; only the next unused identical radio in each inventory group is expanded. Longer bridging chains can be missed.','Likely area has full weight and marginal area half weight. Equal weighted coverage prefers greater two-access-node coverage, then capped 12 dB headroom in 0.5 dB steps, then fewer devices and lower total antenna height.','Two-access-node coverage is the weighted fraction of targets with two known bidirectional direct access nodes, each linked both ways to the primary within the remaining RF edge budget. This is a planning definition, not a capacity or delivery-probability claim; it does not establish survival of primary P1 failure.','Roaming count does not add fixed locations or dependable coverage. CLIENT_BASE favorites and actual packet timing require device configuration; RF reachability does not simulate contention.','Locked physical IDs, labels and overrides are preserved exactly; each device reserves one unique existing inventory slot and counts toward the budget; explicit custom locks override allowed-site exclusions, but must satisfy physical bounds, maximum height and an explicitly chosen main site. Generic camp/community slots may use their actual non-P1 hardware profile. Candidate locations, tree/mast heights, sun exposure, power, access and owner permission require confirmation.','Target weights are hectares. Coverage, sensitivity and equipment settings are planning assumptions until field validated.',...(req.cancelled?.()?['Search cancelled; returning the best connected plan evaluated so far.']:[])]};
}
