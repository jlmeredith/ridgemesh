import { create } from 'zustand';
import { suggestBackbone, suggestClients, suggestTotems, type Heat, type Kind, type Node, type SimParams } from './radio';
import { COLS, ROWS } from './terrain';
import { SITE_VERSION } from './site-features';

export type Overlay = 'both' | 'totem' | 'mesh' | 'none';
export type Tool = 'select' | Kind | 'erase';
export type Preset = 'empty' | 'totem-crew' | 'm1-only' | 'backbone' | 'hybrid';
export const DEFAULT_PARAMS: SimParams = { crowd: 0.35, bagLoss: false, clientsHop: false, meshHops: 3, totemHops: 5, communityTotems: false, mode: 'base', receiverAgl:1.5, meshRootId: 'm1-0', totemRootId: 'totem-0' };
export type Scenario = { schema: 2; siteVersion:string; name: string; terrainVersion: string; modelVersion: string; nodes: Node[]; params: SimParams };
export function presetNodes(name: Preset): Node[] {
  const clients = suggestClients();
  const totems = clients.map((n, i) => ({ ...n, id: `totem-${i}`, kind: 'totem' as const, label: `Compass ${i + 1}` }));
  if (name === 'empty') return [];
  if (name === 'totem-crew') return totems.length ? totems : suggestTotems();
  if (name === 'm1-only') return clients;
  if (name === 'backbone') return [...suggestBackbone(), ...clients];
  return [...totems, ...suggestBackbone(), ...clients];
}
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
export function parseScenario(text: string, terrainVersion: string, modelVersion: string): Scenario {
  if (text.length > 500_000) throw new Error('Scenario file is too large.');
  const d = JSON.parse(text) as Scenario;
  if (!d || typeof d.name !== 'string' || d.name.length > 100 || d.schema !== 2 || !Array.isArray(d.nodes) || d.nodes.length > 40) throw new Error('Expected a RidgeMesh v2 scenario with at most 40 nodes.');
  if (d.terrainVersion !== terrainVersion || d.modelVersion !== modelVersion || d.siteVersion !== SITE_VERSION) throw new Error('This scenario uses a different venue, terrain or radio model version. Recreate it against the current model.');
  const ids = new Set<string>();
  for (const n of d.nodes) {
    if (!n || typeof n.id !== 'string' || ids.has(n.id) || !['totem','m1','v4'].includes(n.kind) || !finite(n.x) || !finite(n.y) || n.x < 0 || n.x > COLS - 1 || n.y < 0 || n.y > ROWS - 1 || typeof n.label !== 'string' || n.label.length > 100) throw new Error('Invalid, duplicated or out-of-bounds node.');
    ids.add(n.id);
    if (n.role !== undefined && !['client','router','mute'].includes(n.role)) throw new Error('Invalid forwarding role.');
    for (const key of ['txDbm','rxDbm','gainDbi','cableDb','frequencyMhz'] as const) if (n[key] !== undefined && !finite(n[key])) throw new Error('Invalid device setting.');
    if ((n.txDbm !== undefined && (n.txDbm < -20 || n.txDbm > 30)) || (n.rxDbm !== undefined && (n.rxDbm < -150 || n.rxDbm > -20)) || (n.cableDb !== undefined && (n.cableDb < 0 || n.cableDb > 50)) || (n.gainDbi !== undefined && (n.gainDbi < -20 || n.gainDbi > 30)) || (n.frequencyMhz !== undefined && (n.frequencyMhz < 100 || n.frequencyMhz > 6000))) throw new Error('Device setting is outside supported limits.');
    for (const key of ['channel','modem'] as const) if (n[key] !== undefined && (typeof n[key] !== 'string' || n[key]!.length > 100)) throw new Error('Invalid modem/channel.');
    if (n.configurationKnown !== undefined && typeof n.configurationKnown !== 'boolean') throw new Error('Invalid hardware confidence.');
    if (n.agl !== undefined && (!finite(n.agl) || n.agl < 0.5 || n.agl > 30)) throw new Error('Antenna height must be between 0.5 and 30 m.');
  }
  const p = d.params;
  if (!p || !finite(p.crowd) || p.crowd < 0 || p.crowd > 1 || !Number.isInteger(p.meshHops) || p.meshHops < 1 || p.meshHops > 7 || !Number.isInteger(p.totemHops) || p.totemHops < 1 || p.totemHops > 7 || ['bagLoss','clientsHop','communityTotems'].some(k => typeof p[k as keyof SimParams] !== 'boolean')) throw new Error('Invalid radio parameters.');
  for (const key of ['rootId','meshRootId','totemRootId'] as const) if (p[key] !== undefined && (typeof p[key] !== 'string' || p[key]!.length > 100)) throw new Error('Invalid base identifier.');
  if (p.receiverAgl !== undefined && (!finite(p.receiverAgl) || p.receiverAgl < .5 || p.receiverAgl > 30)) throw new Error('Receiver height must be between 0.5 and 30 m.');
  if (p.mode !== undefined && !['base','crew'].includes(p.mode)) throw new Error('Invalid communication mode.');
  for (const key of ['fadeDb','foliageDbPerM','canopyM'] as const) if (p[key] !== undefined && (!finite(p[key]) || p[key]! < 0 || p[key]! > 100)) throw new Error('Invalid environment assumption.');
  if (p.assumeUnknownHardware !== undefined && typeof p.assumeUnknownHardware !== 'boolean') throw new Error('Invalid hardware assumption.');
  if (p.targetPolygon !== undefined && (!Array.isArray(p.targetPolygon) || p.targetPolygon.length < 3 || p.targetPolygon.length > 100 || p.targetPolygon.some(v => !Array.isArray(v) || v.length !== 2 || !finite(v[0]) || !finite(v[1]) || v[0] < 0 || v[0] > COLS-1 || v[1] < 0 || v[1] > ROWS-1))) throw new Error('Invalid target polygon.');
  if (p.crewIds !== undefined && (!Array.isArray(p.crewIds) || p.crewIds.some(id => typeof id !== 'string' || !ids.has(id)))) throw new Error('Invalid selected crew.');
  return d;
}

type State = {
  focusPoint:{x:number;y:number;label?:string}|null;setFocusPoint:(point:{x:number;y:number;label?:string}|null)=>void;
  nodes: Node[]; overlay: Overlay; tool: Tool; selected: string | null; probe: [string,string] | null; heat: Heat | null;
  crowd: number; bagLoss: boolean; clientsHop: boolean; meshHops: number; totemHops: number; communityTotems: boolean;
  name: string; extraParams: Partial<SimParams>; setParams:(patch:Partial<SimParams>)=>void; history: Node[][]; hydrated: boolean; params: () => SimParams;
  addNode: (kind: Kind,x:number,y:number) => void; moveNode: (id:string,x:number,y:number) => void;
  updateNode: (id:string,patch:Partial<Node>) => void; removeNode: (id:string) => void; select: (id:string|null) => void;
  setTool: (tool:Tool) => void; setOverlay: (overlay:Overlay) => void; setCrowd: (v:number) => void;
  setBagLoss: (v:boolean) => void; setClientsHop: (v:boolean) => void; setMeshHops: (v:number) => void; setCommunity: (v:boolean) => void;
  loadPreset: (name:Preset) => void; toggleProbe: (id:string) => void; clearProbe: () => void; setHeat: (v:Heat|null) => void;
  undo: () => void; replaceNodes: (nodes:Node[]) => void; restore: (scenario:Scenario) => void;
};
const reconcile=(nodes:Node[],params:Partial<SimParams>):Partial<SimParams>=>({...params,
 meshRootId:nodes.some(n=>n.id===params.meshRootId&&n.kind!=='totem')?params.meshRootId:nodes.find(n=>n.kind!=='totem')?.id,
 totemRootId:nodes.some(n=>n.id===params.totemRootId&&n.kind==='totem')?params.totemRootId:nodes.find(n=>n.kind==='totem')?.id,
 rootId:nodes.some(n=>n.id===params.rootId)?params.rootId:undefined,
 crewIds:params.crewIds?.filter(id=>nodes.some(n=>n.id===id)),
});
const clampX=(x:number)=>Math.max(0,Math.min(COLS-1,x));
const clampY=(y:number)=>Math.max(0,Math.min(ROWS-1,y));
export const useSim = create<State>((set,get)=>({
  ...DEFAULT_PARAMS, nodes:presetNodes('m1-only'), overlay:'none', tool:'select', selected:null, probe:null, heat:null,
  name:'My event plan',focusPoint:null,setFocusPoint:focusPoint=>set({focusPoint,selected:null}),extraParams:{receiverAgl:1.5,mode:'base',meshRootId:'m1-0',totemRootId:'totem-0'},history:[],hydrated:false,
  setParams:patch=>set(s=>({...patch,extraParams:{...s.extraParams,...patch},heat:null})),
  params:()=>{const s=get();return {...s.extraParams,crowd:s.crowd,bagLoss:s.bagLoss,clientsHop:s.clientsHop,meshHops:s.meshHops,totemHops:s.totemHops,communityTotems:s.communityTotems};},
  replaceNodes:nodes=>set(s=>({nodes,extraParams:reconcile(nodes,s.extraParams),history:[...s.history.slice(-29),s.nodes],selected:null,probe:null,focusPoint:null,heat:null})),
  addNode:(kind,x,y)=>{const s=get();if(s.nodes.length>=40)return;const id=crypto.randomUUID();s.replaceNodes([...s.nodes,{id,kind,x:clampX(x),y:clampY(y),label:`${kind==='v4'?'Relay':kind==='totem'?'Compass':'Handheld'} ${s.nodes.length+1}`,agl:kind==='v4'?3:1.5,role:kind==='v4'?'router':'client'}]);set({selected:id,tool:'select'});},
  moveNode:(id,x,y)=>get().updateNode(id,{x:clampX(x),y:clampY(y)}),
  updateNode:(id,patch)=>set(s=>{const nodes=s.nodes.map(n=>n.id===id?{...n,...patch,id:n.id}:n);return {nodes,extraParams:reconcile(nodes,s.extraParams),history:[...s.history.slice(-29),s.nodes],heat:null};}),
  removeNode:id=>get().replaceNodes(get().nodes.filter(n=>n.id!==id)),
  select:selected=>set({selected,focusPoint:null}),setTool:tool=>set({tool}),setOverlay:overlay=>set({overlay}),
  setCrowd:crowd=>set({crowd,heat:null}),setBagLoss:bagLoss=>set({bagLoss,heat:null}),setClientsHop:clientsHop=>set({clientsHop,heat:null}),setMeshHops:meshHops=>set({meshHops,heat:null}),setCommunity:communityTotems=>set({communityTotems,heat:null}),
  loadPreset:name=>{get().replaceNodes(presetNodes(name));set({...DEFAULT_PARAMS,extraParams:{...DEFAULT_PARAMS},name:name==='backbone'?'V4-assisted crew':name,overlay:'none',tool:'select'});},
  toggleProbe:id=>set(s=>({probe:!s.probe||s.probe[0]!==s.probe[1]?[id,id]:[s.probe[0],id],selected:id})),
  clearProbe:()=>set({probe:null}),setHeat:heat=>set({heat}),
  undo:()=>set(s=>s.history.length?{nodes:s.history[s.history.length-1],extraParams:reconcile(s.history[s.history.length-1],s.extraParams),history:s.history.slice(0,-1),selected:null,probe:null,focusPoint:null,heat:null}:{}),
  restore:d=>set({...d.params,extraParams:{...d.params},nodes:d.nodes,name:d.name,selected:null,probe:null,history:[],heat:null,focusPoint:null,overlay:'none',hydrated:true}),
}));
