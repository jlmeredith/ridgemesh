import { create } from 'zustand';
import { suggestClients, type Heat, type Kind, type Node, type SimParams, isFixed, MODEL_VERSION } from './radio';
import { COLS, ROWS } from './terrain';
import { SITE_VERSION } from './site-features';
import { STARTER_PARAMS } from './placement-policy';
import { createStarterScenario } from './starter-plan';
import { DEFAULT_INVENTORY, validateInventory, type InventorySettings } from './equipment';

export type Overlay = 'mesh' | 'none';
export type Tool = 'select' | Kind | 'erase';
export type Preset = 'empty' | 'm1-only' | 'backbone';
export const DEFAULT_PARAMS: SimParams = {...STARTER_PARAMS};
export type Scenario = {schema:3;siteVersion:string;name:string;terrainVersion:string;modelVersion:string;nodes:Node[];params:SimParams;inventory:InventorySettings};
export function presetNodes(name:Preset):Node[]{return name==='empty'?[]:name==='backbone'?createStarterScenario().nodes:suggestClients();}
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
/** Old supported radios migrate without silently losing their positions; caller preserves original bytes. */
export function parseScenario(text:string,terrainVersion:string,modelVersion:string):Scenario{
 if(text.length>500_000)throw new Error('Scenario file is too large.');
 const raw=JSON.parse(text);
 if(!raw||typeof raw.name!=='string'||raw.name.length>100||![2,3].includes(raw.schema)||!Array.isArray(raw.nodes)||raw.nodes.length>40)throw new Error('Expected a RidgeMesh scenario with at most 40 radios.');
 if(raw.terrainVersion!==terrainVersion||raw.siteVersion!==SITE_VERSION||!(raw.modelVersion===modelVersion||(raw.schema===2&&raw.modelVersion==='ridgemesh-rf-3.0')))throw new Error('This file uses an incompatible venue, terrain or radio model.');
 const legacy=raw.schema===2;
 const nodes=legacy?raw.nodes.filter((n:{kind:string})=>n?.kind!=='totem').map((n:Node)=>({...n,deployment:n.kind==='v4'?'fixed':'roaming'})):raw.nodes;
 const old=raw.params??{};
 const params:SimParams=legacy?{crowd:old.crowd,bagLoss:old.bagLoss,includeRoamingRelays:old.clientsHop,meshHops:old.meshHops,fadeDb:old.fadeDb,foliageDbPerM:old.foliageDbPerM,canopyM:old.canopyM,meshRootId:old.meshRootId??old.rootId,mode:old.mode,crewIds:old.crewIds?.filter((id:string)=>nodes.some((n:Node)=>n.id===id)),assumeUnknownHardware:old.assumeUnknownHardware,receiverAgl:old.receiverAgl,receiverKind:'m1',targetPolygon:old.targetPolygon}:old;
 const d:Scenario={schema:3,siteVersion:SITE_VERSION,name:raw.name,terrainVersion,modelVersion:MODEL_VERSION,nodes,params,inventory:validateInventory(legacy?DEFAULT_INVENTORY:raw.inventory)};
 const ids=new Set<string>();
 for(const n of d.nodes){
  if(!n||typeof n.id!=='string'||ids.has(n.id)||!['m1','v4','p1','l1','g3'].includes(n.kind)||!finite(n.x)||!finite(n.y)||n.x<0||n.x>COLS-1||n.y<0||n.y>ROWS-1||typeof n.label!=='string'||n.label.length>100)throw new Error('Invalid, duplicated or out-of-bounds radio.');
  ids.add(n.id);
  if(n.role!==undefined&&!['client','client_base','router','router_late','mute'].includes(n.role))throw new Error('Invalid forwarding role.');
  if(n.deployment!==undefined&&!['fixed','roaming'].includes(n.deployment))throw new Error('Invalid deployment type.');
  if(n.inventorySlot!==undefined&&(typeof n.inventorySlot!=='string'||n.inventorySlot.length>100))throw new Error('Invalid equipment slot.');
  if(n.locked!==undefined&&typeof n.locked!=='boolean')throw new Error('Invalid placement lock.');
  if(n.favoriteIds!==undefined&&(!Array.isArray(n.favoriteIds)||n.favoriteIds.length>100||n.favoriteIds.some(id=>typeof id!=='string'||id.length>100)))throw new Error('Invalid favorites.');
  for(const k of ['txDbm','rxDbm','gainDbi','cableDb','frequencyMhz'] as const)if(n[k]!==undefined&&!finite(n[k]))throw new Error('Invalid device setting.');
  if((n.txDbm!==undefined&&(n.txDbm< -20||n.txDbm>30))||(n.rxDbm!==undefined&&(n.rxDbm< -150||n.rxDbm> -20))||(n.gainDbi!==undefined&&(n.gainDbi< -20||n.gainDbi>30))||(n.cableDb!==undefined&&(n.cableDb<0||n.cableDb>50))||(n.frequencyMhz!==undefined&&(n.frequencyMhz<100||n.frequencyMhz>6000)))throw new Error('Device setting is outside supported limits.');
  if(n.agl!==undefined&&(!finite(n.agl)||n.agl<.5||n.agl>30))throw new Error('Antenna height must be between 0.5 and 30 m.');
  for(const k of ['channel','modem'] as const)if(n[k]!==undefined&&(typeof n[k]!=='string'||n[k]!.length>100))throw new Error('Invalid modem/channel.');
  if(n.configurationKnown!==undefined&&typeof n.configurationKnown!=='boolean')throw new Error('Invalid hardware confidence.');
 }
 const p=d.params;
 if(!p||!finite(p.crowd)||p.crowd<0||p.crowd>1||!Number.isInteger(p.meshHops)||p.meshHops<1||p.meshHops>7||typeof p.bagLoss!=='boolean'||typeof p.includeRoamingRelays!=='boolean')throw new Error('Invalid radio parameters.');
 for(const k of ['rootId','meshRootId'] as const)if(p[k]!==undefined&&(typeof p[k]!=='string'||p[k]!.length>100))throw new Error('Invalid destination identifier.');
 if(p.receiverAgl!==undefined&&(!finite(p.receiverAgl)||p.receiverAgl<.5||p.receiverAgl>30))throw new Error('Invalid roaming receiver height.');
 if(p.receiverKind!==undefined&&!['m1','v4','p1','l1','g3'].includes(p.receiverKind))throw new Error('Invalid roaming receiver hardware.');
 if(p.mode!==undefined&&!['base','crew'].includes(p.mode))throw new Error('Invalid communication mode.');
 for(const k of ['fadeDb','foliageDbPerM','canopyM'] as const)if(p[k]!==undefined&&(!finite(p[k])||p[k]!<0||p[k]!>100))throw new Error('Invalid environment assumption.');
 if(p.assumeUnknownHardware!==undefined&&typeof p.assumeUnknownHardware!=='boolean')throw new Error('Invalid hardware assumption.');
 if(p.targetPolygon!==undefined&&(!Array.isArray(p.targetPolygon)||p.targetPolygon.length<3||p.targetPolygon.length>100||p.targetPolygon.some(v=>!Array.isArray(v)||v.length!==2||!finite(v[0])||!finite(v[1])||v[0]<0||v[0]>COLS-1||v[1]<0||v[1]>ROWS-1)))throw new Error('Invalid target polygon.');
 if(p.crewIds!==undefined&&(!Array.isArray(p.crewIds)||p.crewIds.some(id=>typeof id!=='string'||!ids.has(id))))throw new Error('Invalid selected crew.');
 return d;
}
const reconcile=(nodes:Node[],params:SimParams):SimParams=>({...params,meshRootId:nodes.some(n=>n.id===params.meshRootId)?params.meshRootId:nodes.find(n=>n.kind==='p1'&&isFixed(n))?.id??nodes.find(isFixed)?.id??nodes[0]?.id,rootId:nodes.some(n=>n.id===params.rootId)?params.rootId:undefined,crewIds:params.crewIds?.filter(id=>nodes.some(n=>n.id===id))});
type State={nodes:Node[];inventory:InventorySettings;parameters:SimParams;name:string;overlay:Overlay;tool:Tool;selected:string|null;probe:[string,string]|null;heat:Heat|null;history:Node[][];focusPoint:{x:number;y:number;label?:string}|null;hydrated:boolean;
 params:()=>SimParams;setParams:(p:Partial<SimParams>)=>void;setInventory:(v:InventorySettings)=>void;restore:(s:Scenario)=>void;replaceNodes:(n:Node[])=>void;applyPlan:(nodes:Node[],params:SimParams,inventory:InventorySettings)=>void;addNode:(kind:Kind,x:number,y:number)=>void;updateNode:(id:string,p:Partial<Node>)=>void;moveNode:(id:string,x:number,y:number)=>void;removeNode:(id:string)=>void;select:(id:string|null)=>void;setTool:(v:Tool)=>void;setOverlay:(v:Overlay)=>void;setHeat:(h:Heat|null)=>void;setFocusPoint:(p:State['focusPoint'])=>void;undo:()=>void;loadPreset:(p:Preset)=>void;toggleProbe:(id:string)=>void;clearProbe:()=>void};
const initial=createStarterScenario();
export const useSim=create<State>((set,get)=>({nodes:initial.nodes,inventory:initial.inventory??DEFAULT_INVENTORY,parameters:initial.params,name:initial.name,overlay:'none',tool:'select',selected:null,probe:null,heat:null,history:[],focusPoint:null,hydrated:false,
 params:()=>get().parameters,setParams:p=>set(s=>({parameters:{...s.parameters,...p},heat:null})),setInventory:inventory=>set({inventory:validateInventory(inventory)}),
 restore:s=>set({nodes:s.nodes,parameters:s.params,inventory:s.inventory,name:s.name,selected:null,probe:null,history:[],heat:null,focusPoint:null,overlay:'none',hydrated:true}),
 replaceNodes:nodes=>set(s=>({nodes,parameters:reconcile(nodes,s.parameters),history:[...s.history.slice(-29),s.nodes],selected:null,probe:null,focusPoint:null,heat:null})),
 applyPlan:(nodes,parameters,inventory)=>set(s=>({nodes,parameters,inventory,name:'Computed infrastructure plan',history:[...s.history.slice(-29),s.nodes],selected:null,probe:null,focusPoint:null,heat:null})),
 addNode:(kind,x,y)=>{const s=get();if(s.nodes.length>=40)return;const id=crypto.randomUUID(),fixed=['p1','v4','g3'].includes(kind);s.replaceNodes([...s.nodes,{id,kind,x:Math.max(0,Math.min(COLS-1,x)),y:Math.max(0,Math.min(ROWS-1,y)),label:fixed?'Custom fixed radio':'Roaming test radio',agl:fixed?3:1.5,role:kind==='p1'?'router':fixed?'client_base':'client',deployment:fixed?'fixed':'roaming',locked:fixed}]);set({selected:id,tool:'select'});},
 updateNode:(id,p)=>set(s=>{const nodes=s.nodes.map(n=>n.id===id?{...n,...p,id:n.id}:n);return{nodes,parameters:reconcile(nodes,s.parameters),history:[...s.history.slice(-29),s.nodes],heat:null};}),
 moveNode:(id,x,y)=>get().updateNode(id,{x:Math.max(0,Math.min(COLS-1,x)),y:Math.max(0,Math.min(ROWS-1,y)),locked:true}),removeNode:id=>get().replaceNodes(get().nodes.filter(n=>n.id!==id)),select:selected=>set({selected,focusPoint:null}),setTool:tool=>set({tool}),setOverlay:overlay=>set({overlay}),setHeat:heat=>set({heat}),setFocusPoint:focusPoint=>set({focusPoint,selected:null}),
 undo:()=>{const s=get();if(s.history.length){const nodes=s.history.at(-1)!;set({nodes,parameters:reconcile(nodes,s.parameters),history:s.history.slice(0,-1),selected:null,probe:null,heat:null});}},
 loadPreset:p=>{get().replaceNodes(presetNodes(p));set({parameters:{...DEFAULT_PARAMS},name:p,tool:'select',overlay:'none'});},toggleProbe:id=>set(s=>({probe:!s.probe||s.probe[0]!==s.probe[1]?[id,id]:[s.probe[0],id],selected:id})),clearProbe:()=>set({probe:null}),
}));
