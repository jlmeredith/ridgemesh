import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RadioTower, Settings2 } from 'lucide-react';
import { ValleyMap } from '../components/valley-map';
import { PathInspector } from '../components/path-inspector';
import { SidePanel } from '../components/side-panel';
import { useSim, parseScenario, type Scenario, type Preset } from '../lib/store';
import { MODEL_VERSION, type SimParams, type Node } from '../lib/radio';
import { TERRAIN_VERSION } from '../lib/terrain';
import { SITE_VERSION, MOUNT_SITES } from '../lib/site-features';
import { createStarterScenario, isStarterPlan, STARTER_EVIDENCE } from '../lib/starter-plan';
import { resolveStartup, SCENARIO_STORAGE, BACKUP_STORAGE, REJECTED_STORAGE } from '../lib/startup';
import type { Analysis, WorkerRequest } from '../lib/planner-worker';
import type { Candidate, OptimizeResult } from '../lib/optimizer';
export const Route=createFileRoute('/')({component:Home});
function Home(){
 const s=useSim(),key=JSON.stringify(s.params()),params=useMemo<SimParams>(()=>JSON.parse(key),[key]);
 const activeKind=useRef<WorkerRequest['kind']|null>(null);
 const worker=useRef<Worker|null>(null),request=useRef(0),scheduled=useRef<ReturnType<typeof setTimeout>|null>(null),importRef=useRef<HTMLInputElement>(null);
 const [customizing,setCustomizing]=useState(false),[pathOpen,setPathOpen]=useState(false),[backup,setBackup]=useState<string|null>(null),[preserved,setPreserved]=useState<string|null>(null);
 const [previewNodes,setPreviewNodes]=useState<Node[]|null>(null),[previewAnalysis,setPreviewAnalysis]=useState<Analysis|null>(null),[bestPreview,setBestPreview]=useState<Analysis|null>(null);
 const [analysis,setAnalysis]=useState<Analysis|null>(null),[comparisons,setComparisons]=useState<Array<{preset:Preset}&Analysis>>([]),[optimization,setOptimization]=useState<OptimizeResult|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('Preparing your plan…'),[error,setError]=useState(''),[ready,setReady]=useState(false),[canPersist,setCanPersist]=useState(false),[storageError,setStorageError]=useState('');
 const snapshot=():Scenario=>({schema:2,siteVersion:SITE_VERSION,name:s.name,terrainVersion:TERRAIN_VERSION,modelVersion:MODEL_VERSION,nodes:s.nodes,params});
 const run=useCallback((kind:WorkerRequest['kind'],extra:Partial<WorkerRequest>={})=>{
  if(scheduled.current){clearTimeout(scheduled.current);scheduled.current=null;}worker.current?.terminate();const id=++request.current;activeKind.current=kind;setBusy(true);setError('');setMessage(kind==='preview'?'Calculating proposed layout…':kind==='analyze'?'Updating coverage…':kind==='compare'?'Comparing your equipment options…':'Finding useful router sites and heights…');
  const w=new Worker(new URL('../lib/planner-worker.ts',import.meta.url),{type:'module'});worker.current=w;
  w.onmessage=e=>{const d=e.data;if(d.id!==request.current)return;if(d.kind==='progress'){setMessage(d.message);return;}setBusy(false);activeKind.current=null;if(d.kind==='error'){setError(d.message);setMessage('Calculation needs attention');}else{setMessage(d.kind==='preview'?'Proposed layout calculated':'Current scenario calculated');if(d.kind==='analyze'){setAnalysis(d.result);useSim.getState().setHeat(d.result.heat);}if(d.kind==='compare')setComparisons(d.result);if(d.kind==='optimize'){setOptimization(d.result);setPreviewNodes(d.result.best.nodes);setBestPreview(d.preview);setPreviewAnalysis(d.preview);}if(d.kind==='preview')setPreviewAnalysis(d.result);}w.terminate();worker.current=null;};
  w.onerror=e=>{if(id!==request.current)return;activeKind.current=null;setBusy(false);setError(e.message||'Worker could not start.');setMessage('Calculation failed');w.terminate();worker.current=null;};
  w.postMessage({id,kind,nodes:s.nodes,params,...extra});
 },[s.nodes,params]);
 useEffect(()=>{
  try{
   const result=resolveStartup(localStorage.getItem(SCENARIO_STORAGE));setBackup(localStorage.getItem(BACKUP_STORAGE)??null);
   if(result.rejected!==undefined){setPreserved(result.rejected);localStorage.setItem(`${REJECTED_STORAGE}-${Date.now()}`,result.rejected);setStorageError('Your earlier file could not be restored. Its original contents are preserved; the recommended plan is shown.');}
   if(result.backup!==undefined){localStorage.setItem(BACKUP_STORAGE,result.backup);setBackup(result.backup);}
   useSim.getState().restore(result.scenario);setCanPersist(true);
  }catch{setStorageError('Browser storage is unavailable. Your saved contents will not be overwritten; export your changes to keep them.');setCanPersist(false);}
  setReady(true);return()=>{if(scheduled.current)clearTimeout(scheduled.current);worker.current?.terminate();};
 },[]);
 useEffect(()=>{if(!ready)return;setAnalysis(null);setComparisons([]);setOptimization(null);setPreviewNodes(null);setPreviewAnalysis(null);setBestPreview(null);useSim.getState().setHeat(null);worker.current?.terminate();request.current++;setBusy(true);setMessage('Updating coverage…');scheduled.current=setTimeout(()=>run('analyze'),180);return()=>{if(scheduled.current)clearTimeout(scheduled.current);scheduled.current=null;};},[run,ready]);
 useEffect(()=>{if(!ready||!canPersist)return;const scenario:Scenario={schema:2,siteVersion:SITE_VERSION,name:s.name,terrainVersion:TERRAIN_VERSION,modelVersion:MODEL_VERSION,nodes:s.nodes,params};try{localStorage.setItem(SCENARIO_STORAGE,JSON.stringify(scenario));}catch{setStorageError('Browser storage is full. Export your scenario to preserve it.');}},[s.nodes,params,s.name,ready,canPersist]);
 const download=(content=JSON.stringify(snapshot(),null,2),name='ridgemesh-scenario.json')=>{const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const remember=()=>{const value=JSON.stringify(snapshot());setBackup(value);try{localStorage.setItem(BACKUP_STORAGE,value);}catch{setStorageError('The previous plan is available for this visit only; browser storage is full.');}};
 const toggleCustomize=()=>{if(customizing){if(activeKind.current==='optimize'||activeKind.current==='preview')cancel();setPreviewNodes(null);setPreviewAnalysis(null);setPathOpen(false);}setCustomizing(!customizing);s.setTool('select');s.select(null);s.setFocusPoint(null);};
 const cancel=()=>{if(scheduled.current){clearTimeout(scheduled.current);scheduled.current=null;}worker.current?.terminate();worker.current=null;activeKind.current=null;request.current++;setBusy(false);setMessage('Calculation cancelled');};
 const shown=previewNodes?previewAnalysis:analysis,recommended=isStarterPlan(s.nodes,params),routers=s.nodes.filter(n=>n.role==='router'||(n.kind==='v4'&&!n.role));
 const router=routers[0],routerSite=router?MOUNT_SITES.find(site=>Math.hypot(site.x-router.x,site.y-router.y)<2):null;
 const system=s.nodes.some(n=>n.kind!=='totem')?'mesh':'totem',unknown=shown?shown.stats[system==='mesh'?'meshUnknownFrac':'totemUnknownFrac']===1:false;
 const strong=unknown?null:shown?.stats[system==='mesh'?'meshLikelyFrac':'totemLikelyFrac']??(recommended&&!previewNodes?STARTER_EVIDENCE.likelyFraction:null);
 return <main className={`planner-shell progressive-planner ${customizing?'is-customizing':''}`}>
  <header className="app-header"><a className="brand" href="/" aria-label="RidgeMesh home"><span className="brand-mark"><RadioTower size={23}/></span><span>RidgeMesh<small>ASTRAL VALLEY</small></span></a><span className="model-badge">Planning estimate</span><div className="header-actions"><details className="plan-menu" onClick={e=>{if((e.target as HTMLElement).closest('button'))e.currentTarget.open=false}}><summary>Plan</summary><div><button onClick={()=>download()}>Export plan</button><button onClick={()=>importRef.current?.click()}>Import plan</button><button onClick={()=>{remember();s.restore(createStarterScenario());setCustomizing(false);}}>Load optimized plan</button>{backup&&<button onClick={()=>{try{const previous=parseScenario(backup,TERRAIN_VERSION,MODEL_VERSION);remember();s.restore(previous);}catch(e){setError(e instanceof Error?e.message:'Previous plan unavailable');}}}>Restore previous plan</button>}{preserved&&<button onClick={()=>download(preserved,'preserved-ridgemesh-plan.json')}>Download preserved file</button>}</div></details><input ref={importRef} aria-label="Import scenario file" type="file" accept=".json,application/json" hidden onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{const d=parseScenario(await f.text(),TERRAIN_VERSION,MODEL_VERSION);remember();s.restore(d);setError('');}catch(x){setError(x instanceof Error?x.message:'Invalid scenario');}e.target.value='';}}/></div></header>
  <section className="plan-overview" aria-label="Plan overview"><div><p className="eyebrow">{recommended?'RECOMMENDED STARTING NETWORK':'YOUR NETWORK'}</p><h1>{recommended?'Optimized and ready to customize.':'Your custom plan.'}</h1><p className="router-summary">{routers.length===1?`Router at ${routerSite?.label??'your chosen location'} · ${router.agl??3} m antenna`:routers.length?`${routers.length} forwarding routers in your plan`:'No forwarding router in this plan'}<span> · {s.nodes.filter(n=>n.kind!=='v4').length} handhelds</span></p></div><div className="overview-coverage"><strong>{strong===null?'—':`${Math.round(strong*100)}%`}</strong><span>{unknown?'coverage unknown':`${previewNodes?'proposed':'estimated'} strong coverage`}<small>within event-use areas</small></span></div><button className="customize-button" aria-pressed={customizing} onClick={toggleCustomize}><Settings2 size={17}/>{customizing?'Done customizing':'Customize plan'}</button></section>
  <div className="workspace"><div className="map-column">
   {previewNodes&&!previewAnalysis&&<div className="preview-summary" role="status">Calculating proposed coverage…<button onClick={()=>{cancel();setPreviewNodes(null);setPreviewAnalysis(null);}}>Close preview</button></div>}
   {previewNodes&&previewAnalysis&&<div className="preview-summary"><div><strong>Proposed layout · not applied</strong><span>Strong coverage {Math.round((analysis?.stats.meshLikelyFrac??0)*100)}% → {Math.round(previewAnalysis.stats.meshLikelyFrac*100)}% · weak {Math.round((analysis?.stats.meshMarginalFrac??0)*100)}% → {Math.round(previewAnalysis.stats.meshMarginalFrac*100)}%</span></div><button onClick={()=>s.replaceNodes(previewNodes)}>Apply preview</button><button onClick={()=>{setPreviewNodes(null);setPreviewAnalysis(null);}}>Close preview</button></div>}
   <ValleyMap previewNodes={previewNodes} previewHeat={previewAnalysis?.heat??null} editing={customizing}/>
   {s.overlay!=='none'&&<div className="map-legend"><span><i className="legend-blue"/>Strong</span><span><i className="legend-amber"/>Weak</span><span><i className="legend-red"/>No route</span><span><i className="legend-hatch"/>Unknown</span><span>Modeled two-way coverage at {params.receiverAgl??1.5} m handheld height</span></div>}
   {customizing&&<details className="path-disclosure" onToggle={e=>setPathOpen(e.currentTarget.open)}><summary>Inspect a radio path and required mast height</summary>{pathOpen&&<PathInspector/>}</details>}
   <div className="compute-status" role="status"><span className={busy?'status-spinner':'status-dot'}/>{message}{busy&&<button onClick={cancel}>Cancel</button>}{!busy&&!analysis&&<button onClick={()=>run('analyze')}>Recalculate</button>}</div>
   {(error||storageError)&&<div className="error-banner" role="alert">{error||storageError}</div>}
  </div>{customizing&&<SidePanel analysis={analysis} comparisons={comparisons} optimization={optimization} busy={busy} message={message} onCompare={()=>run('compare',{nodes:previewNodes??s.nodes})} onOptimize={(budget:number,candidates:Candidate[])=>run('optimize',{budget,candidates})} onCancel={cancel} onPreviewLayout={nodes=>{setPreviewNodes(nodes);if(!nodes)setPreviewAnalysis(null);else if(nodes===optimization?.best.nodes&&bestPreview)setPreviewAnalysis(bestPreview);else{setPreviewAnalysis(null);run('preview',{nodes});}}}/>}</div>
  <footer className="app-footer"><span>Explore the recommended plan, then customize equipment, positions and heights.</span><a href="/data/optimized-plan.json" target="_blank" rel="noreferrer">Plan assumptions & sources ↗</a></footer>
 </main>;
}
