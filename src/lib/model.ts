/** Versioned planning model. RF feasibility is not delivery probability or capacity. */
export const MODEL_VERSION = 'ridgemesh-rf-3.0';
export type Status = 'likely' | 'marginal' | 'unavailable' | 'unknown';
export type Surface = {version:string; cellM:number; cols:number; rows:number; elevation:(x:number,y:number)=>number; cover:(x:number,y:number)=>string};
export type RadioNode = {id:string;kind:'totem'|'m1'|'v4';x:number;y:number;label:string;agl?:number;role?:'client'|'router'|'mute';txDbm?:number;rxDbm?:number;gainDbi?:number;cableDb?:number;frequencyMhz?:number;channel?:string;modem?:string;configurationKnown?:boolean};
export type Environment = {crowd:number;bagLoss:boolean;clientsHop:boolean;meshHops:number;totemHops:number;communityTotems:boolean;fadeDb?:number;foliageDbPerM?:number;canopyM?:number;rootId?:string;meshRootId?:string;totemRootId?:string;mode?:'base'|'crew';crewIds?:string[];assumeUnknownHardware?:boolean;receiverAgl?:number;targetPolygon?:[number,number][]};
export const HARDWARE = {
 totem:{title:'Totem Compass (parameters unknown)',txDbm:10,rxDbm:-92,agl:1.4,mhz:2400,system:'totem' as const,known:false},
 m1:{title:'ThinkNode M1 (assumed configuration)',txDbm:22,rxDbm:-132,agl:1.3,mhz:915,system:'mesh' as const,known:true},
 v4:{title:'Heltec V4 (assumed standard-power configuration)',txDbm:22,rxDbm:-132,agl:6,mhz:915,system:'mesh' as const,known:true},
};
export const MODEL_ASSUMPTIONS = ['M1/V4 915 MHz, 22 dBm, -132 dBm sensitivity, 0 dBi antennas and 0 dB cables are editable scenario assumptions, not verified SKU/firmware specifications.','Totem physical and forwarding specifications are unknown: results remain unknown unless explicitly assumed.','Single dominant knife-edge ITU-R P.526 approximation; no multiple-edge, building, reflection or interference solution.','Foliage is integrated below assumed canopy; unverified land cover and crowd/body penalties are scenario assumptions.','Hop limit counts RF edges, including the final receiver; two-way routes evaluated separately.','No field calibration: no claims of delivery probability, capacity, latency or GNSS availability.'];
export function fsplDb(distanceM:number,frequencyMhz:number){return 32.44+20*Math.log10(Math.max(1,distanceM)/1000)+20*Math.log10(frequencyMhz);}
export function knifeEdgeDb(v:number){return v<=-0.78?0:6.9+20*Math.log10(Math.sqrt((v-.1)**2+1)+v-.1);}
export function pathProfile(a:{x:number;y:number;agl:number},b:{x:number;y:number;agl:number},surface:Surface,stepM=5,canopyM=15){
 const distM=Math.hypot(a.x-b.x,a.y-b.y)*surface.cellM;
 const h0=surface.elevation(a.x,a.y)+a.agl,h1=surface.elevation(b.x,b.y)+b.agl;
 const count=Math.max(1,Math.ceil(distM/Math.max(1,stepM)));
 let forestM=0,excessM=0,unknown=!Number.isFinite(h0+h1);
 const samples=Array.from({length:count+1},(_,k)=>{const t=k/count,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,ground=surface.elevation(x,y),los=h0+(h1-h0)*t,cover=surface.cover(x,y),clearance=los-ground;unknown ||= !Number.isFinite(ground);if(k>0&&k<count)excessM=Math.max(excessM,-clearance);return {x,y,t,ground,los,cover,clearance};});
 for(let k=0;k<count;k++){const t=(k+.5)/count,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,g=surface.elevation(x,y);if(surface.cover(x,y)==='forest'&&h0+(h1-h0)*t<=g+canopyM)forestM+=distM/count;}
 return {samples,forestM,blocked:excessM>0,excessM,distM,h0,h1,unknown};
}
export type Budget = {ok:boolean;status:Status;marginDb:number;distM:number;forestM:number;blocked:boolean;excessM:number;lossDb:number;budgetDb:number;hops:number;reason:string;diffractionDb:number;fresnelClearanceRatio:number;assumptions:string[]};
export function directedLink(a:RadioNode,b:RadioNode,p:Environment,s:Surface):Budget{
 const ma=HARDWARE[a.kind],mb=HARDWARE[b.kind];
 const empty=(status:Status,reason:string):Budget=>({ok:false,status,marginDb:NaN,distM:0,forestM:0,blocked:false,excessM:0,lossDb:NaN,budgetDb:NaN,hops:1,reason,diffractionDb:NaN,fresnelClearanceRatio:NaN,assumptions:MODEL_ASSUMPTIONS});
 const freq=a.frequencyMhz??ma.mhz;
 if(ma.system!==mb.system||freq!==(b.frequencyMhz??mb.mhz)||(a.channel??'default')!==(b.channel??'default')||(a.modem??'default')!==(b.modem??'default'))return empty('unavailable','Incompatible frequency, modem, channel or system.');
 if(!(a.configurationKnown??ma.known)||!(b.configurationKnown??mb.known)){if(!p.assumeUnknownHardware)return empty('unknown','Hardware/protocol configuration is unverified.');}
 const aglA=a.agl??ma.agl,aglB=b.agl??mb.agl;
 const inputs=[a.x,a.y,b.x,b.y,aglA,aglB,freq,a.txDbm??ma.txDbm,b.rxDbm??mb.rxDbm,a.gainDbi??0,b.gainDbi??0,a.cableDb??0,b.cableDb??0,p.fadeDb??8,p.foliageDbPerM??0,p.canopyM??15,p.crowd];
 if(inputs.some(v=>!Number.isFinite(v))||aglA<0||aglB<0||freq<=0||(a.cableDb??0)<0||(b.cableDb??0)<0||(p.foliageDbPerM??0)<0||(p.canopyM??15)<0||(p.fadeDb??8)<0||p.crowd<0||p.crowd>1)return empty('unknown','Invalid physical input.');
 const path=pathProfile({...a,agl:aglA},{...b,agl:aglB},s,Math.min(s.cellM,5),p.canopyM??15);
 if(path.unknown)return empty('unknown','Terrain is unavailable along this path.');
 const wavelength=299.792458/freq;
 let vMax=-Infinity,fresnel=Infinity;
 for(const sample of path.samples.slice(1,-1)){const d1=path.distM*sample.t,d2=path.distM-d1;const radius=Math.sqrt(wavelength*d1*d2/path.distM);vMax=Math.max(vMax,-sample.clearance*Math.sqrt(2)/radius);fresnel=Math.min(fresnel,sample.clearance/radius);}
 const diffractionDb=knifeEdgeDb(vMax);
 const foliage=path.forestM*(p.foliageDbPerM??(ma.system==='mesh'?.045:.16));
 const body=p.bagLoss?2.2:0,crowd=Math.max(0,p.crowd)* (ma.system==='mesh'?3.5:14)*Math.min(1,path.distM/180);
 const lossDb=fsplDb(path.distM,freq)+diffractionDb+foliage+body+crowd;
 const budgetDb=(a.txDbm??ma.txDbm)+(a.gainDbi??0)+(b.gainDbi??0)-(a.cableDb??0)-(b.cableDb??0)-(b.rxDbm??mb.rxDbm)-(p.fadeDb??8);
 const marginDb=budgetDb-lossDb,status:Status=marginDb<0?'unavailable':marginDb<6?'marginal':'likely';
 return {...path,ok:marginDb>=0,status,marginDb,lossDb,budgetDb,hops:1,diffractionDb,fresnelClearanceRatio:fresnel,reason:`${status}: ${marginDb.toFixed(1)} dB directed margin after fade allowance.`,assumptions:MODEL_ASSUMPTIONS};
}
export type Route = {status:Status;route:string[];marginDb:number;hops:number;reason:string};
export function canForward(n:RadioNode,p:Environment){return n.role?(n.role==='router'||(n.role==='client'&&p.clientsHop)):n.kind==='v4'||n.kind==='totem'||p.clientsHop;}
export function routeBetween(nodes:RadioNode[],fromId:string,toId:string,p:Environment,s:Surface,link=(a:RadioNode,b:RadioNode)=>directedLink(a,b,p,s)):Route{
 const from=nodes.find(n=>n.id===fromId),to=nodes.find(n=>n.id===toId);
 if(!from||!to)return {status:'unknown',route:[],marginDb:NaN,hops:0,reason:'Choose an origin and destination.'};
 const limit=Math.max(0,Math.min(16,Math.floor(from.kind==='totem'?p.totemHops:p.meshHops)));
 type State={node:RadioNode;route:string[];margin:number;unknown:boolean};let frontier:State[]=[{node:from,route:[fromId],margin:Infinity,unknown:false}];
 const best=new Map<string,number>();let unknownRoute:Route|undefined,knownRoute:Route|undefined;
 for(let h=0;h<=limit;h++){const next:State[]=[];for(const q of frontier){if(q.node.id===toId){const result:Route={status:q.unknown?'unknown':q.margin<6?'marginal':'likely',route:q.route,marginDb:q.unknown?NaN:q.margin,hops:h,reason:q.unknown?'A required link has unknown inputs.':'Directed route; RF edge hop convention.'};if(!q.unknown){if(!knownRoute||result.marginDb>knownRoute.marginDb)knownRoute=result;}else unknownRoute=result;continue;}if(h===limit||(h>0&&!canForward(q.node,p)))continue;for(const n of nodes){if(q.route.includes(n.id))continue;const edge=link(q.node,n);if(!edge.ok&&edge.status!=='unknown')continue;const unknown=q.unknown||edge.status==='unknown',margin=unknown?-Infinity:Math.min(q.margin,edge.marginDb),key=`${h+1}:${n.id}:${unknown}`;if(best.has(key)&&best.get(key)!>=margin)continue;best.set(key,margin);next.push({node:n,route:[...q.route,n.id],margin,unknown});}}frontier=next.sort((a,b)=>Number(a.unknown)-Number(b.unknown)||b.margin-a.margin);}
 return knownRoute??unknownRoute??{status:'unavailable',route:[],marginDb:-Infinity,hops:0,reason:'No allowed route within the RF edge hop limit.'};
}
export type Target={id:string;label:string;x:number;y:number;weight?:number;kind?:RadioNode['kind'];agl?:number};
export type TargetResult={target:Target;status:Status;marginDb:number;forward:Route;reverse:Route;reason:string};
export function evaluateTarget(target:Target,nodes:RadioNode[],p:Environment,s:Surface,system:'mesh'|'totem',link?:(a:RadioNode,b:RadioNode)=>Budget):TargetResult{
 const root=p[system==='mesh'?'meshRootId':'totemRootId']??p.rootId??nodes.find(n=>HARDWARE[n.kind].system===system)?.id;
 const ghost:RadioNode={x:target.x,y:target.y,label:target.label,id:`target:${target.id}`,kind:target.kind&&['m1','v4','totem'].includes(target.kind)?target.kind:(system==='mesh'?'m1':'totem'),agl:target.agl??p.receiverAgl??1.5,role:'mute'};
 const peers=p.mode==='crew'?(p.crewIds??nodes.filter(n=>n.kind!=='v4').map(n=>n.id)).filter(id=>nodes.some(n=>n.id===id&&HARDWARE[n.kind].system===system)):[root??''];
 const set=[...nodes,ghost];let worst:TargetResult|undefined;
 const rank={unknown:1,unavailable:0,marginal:2,likely:3};
 for(const peer of peers.length?peers:['']){const forward=routeBetween(set,ghost.id,peer,p,s,link),reverse=routeBetween(set,peer,ghost.id,p,s,link);const status=forward.status==='unavailable'||reverse.status==='unavailable'?'unavailable':forward.status==='unknown'||reverse.status==='unknown'?'unknown':forward.status==='marginal'||reverse.status==='marginal'?'marginal':'likely';const result={target,status,marginDb:Math.min(forward.marginDb,reverse.marginDb),forward,reverse,reason:`${p.mode==='crew'?'All selected crew peers':'Selected base'}; both directions required.`} as TargetResult;if(!worst||rank[status]<rank[worst.status]||(status===worst.status&&result.marginDb<worst.marginDb))worst=result;}
 return worst!;
}

/** Scenario sensitivity, not a confidence interval: deterministic +/-6 dB fade allowance. */
export function marginSensitivity(a:RadioNode,b:RadioNode,p:Environment,s:Surface){return {optimistic:directedLink(a,b,{...p,fadeDb:Math.max(0,(p.fadeDb??8)-6)},s),nominal:directedLink(a,b,p,s),pessimistic:directedLink(a,b,{...p,fadeDb:(p.fadeDb??8)+6},s),interpretation:'Assumed fade allowance sweep; not measured uncertainty or probability.'};}
