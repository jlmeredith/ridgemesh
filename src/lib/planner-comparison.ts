import { HARDWARE, type Node, type SimParams } from './radio';
import type { Preset } from './store';
/** Hold the user's endpoint and base locations constant while changing hardware. */
export function comparisonLayouts(nodes:Node[],params:SimParams):Array<{preset:Preset;nodes:Node[];params:SimParams;description:string}>{
 const locations:Node[]=[];
 const same=(a:Node,b:Node)=>Math.hypot(a.x-b.x,a.y-b.y)<.01;
 for(const n of nodes.filter(n=>n.kind!=='v4'))if(n.kind!=='totem'||!nodes.some(p=>p.kind==='m1'&&same(p,n)&&(p.agl??1.5)===(n.agl??1.5)))locations.push(n);
 const base=nodes.find(n=>n.id===(params.meshRootId??params.rootId))??nodes.find(n=>n.id===params.totemRootId)??nodes[0];
 if(base&&!locations.some(n=>same(n,base)&&(n.agl??1.5)===(base.agl??1.5)))locations.unshift(base);
 if(!locations.length)throw new Error('Place a base or handheld before comparing hardware.');
 const exactBase=locations.findIndex(n=>n.id===base?.id);const baseIndex=exactBase>=0?exactBase:base?Math.max(0,locations.findIndex(n=>same(n,base))):0;
 const convert=(kind:'m1'|'totem')=>locations.map((location,i):Node=>{const original=location.kind===kind?location:nodes.find(n=>n.kind===kind&&same(n,location));return {...(original??{}),id:`compare-${kind}-${i}`,kind,x:location.x,y:location.y,agl:location.agl??params.receiverAgl??1.5,role:original?.role??'client',label:location.label};});
 const mesh=convert('m1'),totem=convert('totem');
 const relays=nodes.filter(n=>n.kind==='v4').map(n=>({...n,id:`compare-relay-${n.id}`}));
 return (['totem-crew','m1-only','backbone','hybrid'] as Preset[]).map(preset=>{
  const set=preset==='totem-crew'?totem:preset==='m1-only'?mesh:preset==='backbone'?[...mesh,...relays]:[...mesh,...totem,...relays];
  const chosenIds=params.crewIds?locations.map((n,i)=>({n,i})).filter(({n})=>nodes.some(original=>params.crewIds!.includes(original.id)&&same(original,n))).flatMap(({i})=>set.filter(n=>n.id===`compare-m1-${i}`||n.id===`compare-totem-${i}`).map(n=>n.id)):undefined;
  return {preset,nodes:set,params:{...params,rootId:undefined,meshRootId:mesh[baseIndex].id,totemRootId:totem[baseIndex].id,crewIds:chosenIds},description:`${locations.length} shared endpoint locations · ${preset==='backbone'||preset==='hybrid'?relays.length:0} planned relays · ${HARDWARE[base?.kind??'m1'].system==='mesh'?'mesh':'Totem'} base location held fixed`};
 });
}
