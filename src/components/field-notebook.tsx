import { useEffect, useMemo, useState } from 'react';
import type { Node, SimParams } from '../lib/radio';
import { FIELD_SCHEMA, FIELD_STORAGE, heldoutSummary, measurementTemplate, parseFieldLog, walkPlanCsv, type FieldLog } from '../lib/field-log';

function download(name:string,body:string,type:string){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function FieldNotebook({nodes,params}:{nodes:Node[];params:SimParams}){
 const [log,setLog]=useState<FieldLog>({schema:FIELD_SCHEMA,observations:[]});const [ready,setReady]=useState(false),[error,setError]=useState('');const [text,setText]=useState('');
 useEffect(()=>{try{const saved=localStorage.getItem(FIELD_STORAGE);if(saved)setLog(parseFieldLog(saved));}catch(e){setError(`Stored field log could not load: ${e instanceof Error?e.message:String(e)}`);}setReady(true);},[]);
 const summary=useMemo(()=>heldoutSummary(log),[log]);
 const load=(value:string)=>{try{const next=parseFieldLog(value);localStorage.setItem(FIELD_STORAGE,JSON.stringify(next));setLog(next);setError('');setText('');}catch(e){setError(e instanceof Error?e.message:String(e));}};
 return <section aria-label="Field notebook" className="space-y-3 text-sm">
  <h3 className="font-semibold">Field notebook · uncalibrated</h3>
  <p>Export a walk plan, record actual antenna configuration and bidirectional deliveries, then import measurements. POI locations and access remain unverified.</p>
  <div className="flex flex-wrap gap-2">
   <button type="button" className="rounded border px-3 py-2" disabled={!nodes.length} onClick={()=>download('ridgemesh-field-walk.csv',walkPlanCsv(nodes,params),'text/csv')}>Export walk plan CSV</button>
   <button type="button" className="rounded border px-3 py-2" onClick={()=>download('ridgemesh-measurement-template.json',JSON.stringify(measurementTemplate(nodes,params),null,2),'application/json')}>Measurement template</button>
   <button type="button" className="rounded border px-3 py-2" onClick={()=>download('ridgemesh-field-log.json',JSON.stringify(log,null,2),'application/json')}>Export observations</button>
  </div>
  <label className="block">Import observation JSON (replaces saved notebook)
   <input className="block max-w-full py-2" type="file" accept=".json,application/json" disabled={!ready} onChange={async event=>{const file=event.currentTarget.files?.[0];if(!file)return;if(file.size>2_000_000){setError('Field log exceeds 2 MB');return;}try{load(await file.text());}catch(e){setError(String(e));}event.target.value='';}} />
  </label>
  <label className="block">Or paste observation JSON<textarea aria-label="Observation JSON" className="mt-1 block w-full rounded border bg-transparent p-2" rows={4} value={text} onChange={e=>setText(e.target.value)} /></label>
  <button type="button" className="rounded border px-3 py-2" disabled={!ready||!text.trim()} onClick={()=>load(text)}>Validate and import</button>
  {error&&<p role="alert" className="text-red-400">{error}</p>}
  {!log.observations.length?<p>No field observations recorded. No calibration or field accuracy has been established.</p>:<p>{summary.calibration} calibration rows · {summary.heldout} held-out rows · {summary.evaluated} classifiable · {summary.mismatches} feasibility/delivery mismatches · {summary.unknown} unknown predictions.</p>}
  <p className="text-xs opacity-75">Held-out rows alone contribute to mismatch counts; calibration rows are excluded. Likely and marginal mean predicted RF feasibility, not guaranteed packet delivery. This notebook does not fit model parameters or establish confidence limits. Recomputed against {summary.modelVersion}, terrain {summary.terrainVersion}; the imported environment and endpoint snapshots remain fixed.</p>
 </section>;
}
