import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Upload, Undo2, RadioTower, MousePointer2, Plus, Trash2, FileCheck2 } from 'lucide-react';
import { ValleyMap } from '../components/valley-map';
import { PathInspector } from '../components/path-inspector';
import { SidePanel } from '../components/side-panel';
import { useSim, parseScenario, type Scenario, type Preset } from '../lib/store';
import { MODEL_VERSION, type SimParams } from '../lib/radio';
import { TERRAIN_VERSION } from '../lib/terrain';
import type { Analysis, WorkerRequest } from '../lib/planner-worker';
import type { Candidate, OptimizeResult } from '../lib/optimizer';
export const Route=createFileRoute('/')({component:Home});
const STORAGE='ridgemesh-scenario-v1';
function Home(){
 const s=useSim();const key=JSON.stringify(s.params());const params=useMemo<SimParams>(()=>JSON.parse(key),[key]);const worker=useRef<Worker|null>(null);const request=useRef(0);const importRef=useRef<HTMLInputElement>(null);
 const [analysis,setAnalysis]=useState<Analysis|null>(null);const [comparisons,setComparisons]=useState<Array<{preset:Preset}&Analysis>>([]);const [optimization,setOptimization]=useState<OptimizeResult|null>(null);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('Preparing terrain and radio model…');const [elapsed,setElapsed]=useState<number|null>(null);const [error,setError]=useState('');const [ready,setReady]=useState(false);
 const run=useCallback((kind:WorkerRequest['kind'],extra:Partial<WorkerRequest>={})=>{
  worker.current?.terminate();const id=++request.current;setBusy(true);setError('');setMessage(kind==='analyze'?'Computing two-way coverage…':kind==='compare'?'Comparing four configurations…':'Searching feasible placement options…');
  const w=new Worker(new URL('../lib/planner-worker.ts',import.meta.url),{type:'module'});worker.current=w;
  w.onmessage=e=>{const d=e.data;if(d.id!==request.current)return;if(d.kind==='progress'){setMessage(d.message);return;}setBusy(false);setElapsed(d.elapsed??null);if(d.kind==='error'){setError(d.message);setMessage('Calculation needs attention');}else{setMessage('Current scenario calculated');if(d.kind==='analyze'){setAnalysis(d.result);useSim.getState().setHeat(d.result.heat);}if(d.kind==='compare')setComparisons(d.result);if(d.kind==='optimize')setOptimization(d.result);}w.terminate();worker.current=null;};
  w.onerror=e=>{if(id!==request.current)return;setBusy(false);setError(e.message||'Worker could not start.');setMessage('Calculation failed');w.terminate();worker.current=null;};
  w.postMessage({id,kind,nodes:s.nodes,params,...extra});
 },[s.nodes,params]);
 useEffect(()=>{try{const saved=localStorage.getItem(STORAGE);if(saved)useSim.getState().restore(parseScenario(saved,TERRAIN_VERSION,MODEL_VERSION));}catch(e){setError(e instanceof Error?e.message:'Saved scenario could not be restored.');}setReady(true);return()=>worker.current?.terminate();},[]);
 useEffect(()=>{if(!ready)return;setAnalysis(null);setComparisons([]);setOptimization(null);useSim.getState().setHeat(null);worker.current?.terminate();request.current++;const timer=setTimeout(()=>run('analyze'),180);return()=>clearTimeout(timer);},[run,ready]);
 useEffect(()=>{if(!ready)return;const scenario:Scenario={schema:1,name:s.name,terrainVersion:TERRAIN_VERSION,modelVersion:MODEL_VERSION,nodes:s.nodes,params};try{localStorage.setItem(STORAGE,JSON.stringify(scenario));}catch{setError('Browser storage is full. Export your scenario to preserve it.');}},[s.nodes,params,s.name,ready]);
 const download=()=>{const d:Scenario={schema:1,name:s.name,terrainVersion:TERRAIN_VERSION,modelVersion:MODEL_VERSION,nodes:s.nodes,params};const url=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ridgemesh-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const cancel=()=>{worker.current?.terminate();worker.current=null;request.current++;setBusy(false);setMessage('Calculation cancelled');};
 const reached=analysis?.pois.mesh.filter(p=>p.status==='likely'||p.status==='marginal').length;const pairs=analysis?.crewPairs.filter(p=>['likely','marginal'].includes(p.forward.status)&&['likely','marginal'].includes(p.reverse.status)).length;
 return <main className="planner-shell">
  <header className="app-header"><a className="brand" href="/" aria-label="RidgeMesh home"><span className="brand-mark"><RadioTower size={24}/></span><span>RidgeMesh<small>ASTRAL VALLEY · MISSOURI</small></span></a><div className="header-status"><span className="live-dot"/>Source terrain loaded <span className="model-badge">Planning estimate</span></div><div className="header-actions"><button onClick={download}><Download size={15}/>Export</button><button onClick={()=>importRef.current?.click()}><Upload size={15}/>Import</button><input ref={importRef} aria-label="Import scenario file" type="file" accept=".json,application/json" hidden onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const d=parseScenario(await f.text(),TERRAIN_VERSION,MODEL_VERSION);s.restore(d);setError('');}catch(x){setError(x instanceof Error?x.message:'Invalid scenario');}e.target.value='';}}/></div></header>
  <div className="workspace-heading"><div><p className="eyebrow">TERRAIN-AWARE NETWORK PLANNING</p><h1>Plan coverage on the ground.</h1><p className="subtitle">Explore the valley. Compare your radios. Find a better place for the next relay.</p></div><div className="source-stamp"><FileCheck2 size={18}/><span>USGS 1 m source<small>10 m analysis grid · 3 imagery acquisitions</small></span></div></div>
  <div className="workspace"><div className="map-column">
   <div className="placement-toolbar"><div className="tool-buttons"><button className={s.tool==='select'?'active':''} onClick={()=>s.setTool('select')}><MousePointer2 size={14}/>Select / move</button><button className={s.tool==='m1'?'active':''} onClick={()=>s.setTool('m1')}><Plus size={14}/>M1</button><button className={s.tool==='v4'?'active':''} onClick={()=>s.setTool('v4')}><Plus size={14}/>V4 relay</button><button className={s.tool==='totem'?'active':''} onClick={()=>s.setTool('totem')}><Plus size={14}/>Compass</button><button title="Erase a node" aria-label="Erase a node" className={s.tool==='erase'?'active':''} onClick={()=>s.setTool('erase')}><Trash2 size={14}/></button><button aria-label="Undo node change" disabled={!s.history.length} onClick={s.undo}><Undo2 size={14}/></button></div><label className="overlay-selector">Coverage<select aria-label="Coverage overlay" value={s.overlay} onChange={e=>s.setOverlay(e.target.value as typeof s.overlay)}><option value="mesh">Meshtastic</option><option value="totem">Totem</option><option value="both">Both systems</option><option value="none">Terrain only</option></select></label></div>
   <ValleyMap optimization={optimization}/>
   <div className="map-legend"><span><i className="legend-green"/>Likely / marginal mesh reach</span><span><i className="legend-amber"/>Totem reach</span><span><i className="legend-hatch"/>Unknown</span><span>Lines = two-way RF links · locations provisional</span></div>
   <div className="summary-strip"><div><small>MESH TARGET AREA</small><strong>{analysis?`${Math.round(analysis.stats.meshFrac*100)}%`:'—'}</strong><span>including marginal paths</span></div><div><small>CAMP POINTS REACHED</small><strong>{analysis?`${reached} / ${analysis.pois.mesh.length}`:'—'}</strong><span>exact two-way evaluation</span></div><div><small>CREW PAIRS CONNECTED</small><strong>{analysis?`${pairs} / ${analysis.crewPairs.length}`:'—'}</strong><span>within hop constraints</span></div><div><small>DEVICES PLACED</small><strong>{s.nodes.length}</strong><span>{s.nodes.filter(n=>n.kind==='v4').length} fixed relays</span></div></div>
   <PathInspector/>
   <div className="compute-status" role="status"><span className={busy?'status-spinner':'status-dot'}/>{message}{elapsed!==null&&!busy&&<span className="elapsed">{(elapsed/1000).toFixed(2)} s</span>}{busy&&<button onClick={cancel}>Cancel</button>}{!busy&&!analysis&&<button onClick={()=>run('analyze')}>Recalculate</button>}</div>
   {error&&<div className="error-banner" role="alert">{error}</div>}
  </div><SidePanel analysis={analysis} comparisons={comparisons} optimization={optimization} busy={busy} message={message} onCompare={()=>run('compare')} onOptimize={(budget:number,candidates:Candidate[])=>run('optimize',{budget,candidates})} onCancel={cancel}/></div>
  <footer className="app-footer"><span>Imagery and terrain are registered to one metric frame. Site labels and RF assumptions still need field verification.</span><a href="/data/terrain-manifest.json" target="_blank" rel="noreferrer">View source manifest ↗</a></footer>
 </main>;
}
