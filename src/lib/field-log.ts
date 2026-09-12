import { evaluateLink, type Node, type SimParams } from './radio';
import { HARDWARE, MODEL_VERSION, type Status } from './model';
import { gridToLl, llToGrid, POIS, TERRAIN_VERSION, COLS, ROWS } from './terrain';

export const FIELD_SCHEMA = 'ridgemesh-field-log/1';
export const FIELD_STORAGE = 'ridgemesh-field-observations-v1';
export type Endpoint = { id:string;kind:Node['kind'];lat:number;lon:number;agl:number;firmware:string;txDbm:number;rxDbm:number;gainDbi:number;cableDb:number;frequencyMhz:number;channel:string;modem:string;configurationKnown:boolean };
export type Observation = { id:string;timestamp:string;split:'calibration'|'heldout';from:Endpoint;to:Endpoint;delivered:boolean;rssiDbm:number|null;snrDb:number|null;environment:SimParams;notes:string };
export type FieldLog = {schema:typeof FIELD_SCHEMA;observations:Observation[]};
const record = (v:unknown):Record<string,unknown> => {if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Expected an object');return v as Record<string,unknown>;};
const str=(v:unknown,name:string)=>{if(typeof v!=='string'||!v.trim()||v.length>2000)throw new Error(`Invalid ${name}`);return v;};
const num=(v:unknown,name:string,min:number,max:number)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw new Error(`Invalid ${name}`);return v;};
const bool=(v:unknown,name:string)=>{if(typeof v!=='boolean')throw new Error(`Invalid ${name}`);return v;};
function endpoint(raw:unknown):Endpoint {
 const e=record(raw);if(!['m1','v4','totem'].includes(String(e.kind)))throw new Error('Invalid device kind');
 const lat=num(e.lat,'latitude',-90,90),lon=num(e.lon,'longitude',-180,180),[x,y]=llToGrid(lat,lon);
 if(x<0||y<0||x>COLS-1||y>ROWS-1)throw new Error('Observation endpoint is outside the terrain extent');
 return {id:str(e.id,'endpoint ID'),kind:e.kind as Node['kind'],lat,lon,agl:num(e.agl,'antenna height',0,100),firmware:str(e.firmware,'firmware'),txDbm:num(e.txDbm,'TX dBm',-50,50),rxDbm:num(e.rxDbm,'RX sensitivity',-180,0),gainDbi:num(e.gainDbi,'antenna gain',-30,60),cableDb:num(e.cableDb,'cable loss',0,100),frequencyMhz:num(e.frequencyMhz,'frequency MHz',100,10000),channel:str(e.channel,'channel'),modem:str(e.modem,'modem'),configurationKnown:bool(e.configurationKnown,'configurationKnown')};
}
function environment(raw:unknown):SimParams {
 const e=record(raw);const p:SimParams={crowd:num(e.crowd,'crowd',0,100),bagLoss:bool(e.bagLoss,'bagLoss'),clientsHop:bool(e.clientsHop,'clientsHop'),meshHops:num(e.meshHops,'meshHops',0,10),totemHops:num(e.totemHops,'totemHops',0,10),communityTotems:bool(e.communityTotems,'communityTotems')};
 for(const key of ['fadeDb','foliageDbPerM','canopyM'] as const)if(e[key]!==undefined)p[key]=num(e[key],key,0,100);
 if(e.assumeUnknownHardware!==undefined)p.assumeUnknownHardware=bool(e.assumeUnknownHardware,'assumeUnknownHardware');return p;
}
export function parseFieldLog(text:string):FieldLog {
 if(text.length>2_000_000)throw new Error('Field log exceeds 2 MB');const data=record(JSON.parse(text));
 if(data.schema!==FIELD_SCHEMA||!Array.isArray(data.observations)||data.observations.length>5000)throw new Error('Unsupported field-log schema or observation count');
 const ids=new Set<string>();const observations=data.observations.map((raw:unknown)=>{const o=record(raw);const id=str(o.id,'observation ID');if(ids.has(id))throw new Error('Duplicate observation ID');ids.add(id);
 const timestamp=str(o.timestamp,'timestamp');if(!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(timestamp)||!Number.isFinite(Date.parse(timestamp)))throw new Error('Timestamp must include date, time and timezone');
 if(o.split!=='calibration'&&o.split!=='heldout')throw new Error('Choose calibration or heldout split');const from=endpoint(o.from),to=endpoint(o.to);if(from.id===to.id)throw new Error('Endpoints must have different IDs');
 return {id,timestamp,split:o.split,from,to,delivered:bool(o.delivered,'delivered'),rssiDbm:o.rssiDbm===null?null:num(o.rssiDbm,'RSSI',-200,20),snrDb:o.snrDb===null?null:num(o.snrDb,'SNR',-100,100),environment:environment(o.environment),notes:typeof o.notes==='string'?o.notes.slice(0,2000):''} as Observation;
 });return {schema:FIELD_SCHEMA,observations};
}
export function endpointNode(e:Endpoint):Node {const [x,y]=llToGrid(e.lat,e.lon);return {...e,x,y,label:e.id};}
export function heldoutSummary(log:FieldLog,predict:(o:Observation)=>Status=o=>evaluateLink(endpointNode(o.from),endpointNode(o.to),o.environment).status){
 let evaluated=0,mismatches=0,unknown=0;for(const o of log.observations.filter(o=>o.split==='heldout')){const status=predict(o);if(status==='unknown'){unknown++;continue;}evaluated++;if((status==='likely'||status==='marginal')!==o.delivered)mismatches++;}
 return {calibration:log.observations.filter(o=>o.split==='calibration').length,heldout:log.observations.filter(o=>o.split==='heldout').length,evaluated,mismatches,unknown,modelVersion:MODEL_VERSION,terrainVersion:TERRAIN_VERSION};
}
export function snapshotEndpoint(n:Node):Endpoint {const h=HARDWARE[n.kind],[lat,lon]=gridToLl(n.x,n.y);return {id:n.id,kind:n.kind,lat,lon,agl:n.agl??h.agl,firmware:'RECORD ACTUAL FIRMWARE',txDbm:n.txDbm??h.txDbm,rxDbm:n.rxDbm??h.rxDbm,gainDbi:n.gainDbi??0,cableDb:n.cableDb??0,frequencyMhz:n.frequencyMhz??h.mhz,channel:n.channel??'default',modem:n.modem??'default',configurationKnown:false};}
const csv=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`;
export function walkPlanCsv(nodes:Node[],params:SimParams){
 const rows:unknown[][]=[['task','from_id','to_id','from_lat','from_lon','to_lat','to_lon','from_config_json','to_config_json','environment_json','timestamp','split','delivered','rssi_dbm','snr_db','notes']];
 const add=(a:Node,b:Node,task:string)=>{const from=snapshotEndpoint(a),to=snapshotEndpoint(b);rows.push([task,a.id,b.id,from.lat,from.lon,to.lat,to.lon,JSON.stringify(from),JSON.stringify(to),JSON.stringify(params),'','','','','','Record both directions; confirm access and actual hardware configuration']);};
 for(const a of nodes)for(const b of nodes)if(a.id!==b.id&&HARDWARE[a.kind].system===HARDWARE[b.kind].system)add(a,b,'node-pair');
 for(const a of nodes)for(const poi of POIS){const b:Node={...a,id:`walk:${poi.id}`,label:poi.label,x:poi.x,y:poi.y,agl:1.3};add(a,b,`POI: ${poi.label} (inferred location)`);add(b,a,`POI return: ${poi.label}`);}
 return rows.map(r=>r.map(csv).join(',')).join('\r\n');
}
export function measurementTemplate(nodes:Node[],params:SimParams){return {schema:FIELD_SCHEMA,observations:[],instructions:'Add genuine observations using the row shape below. Record each direction separately; reserve heldout rows before changing model parameters. Replace unknown firmware/configuration. Delete exampleShape before import if desired.',exampleShape:{id:'unique-observation-id',timestamp:'YYYY-MM-DDTHH:mm:ssZ',split:'heldout',from:nodes[0]?snapshotEndpoint(nodes[0]):{},to:nodes[1]?snapshotEndpoint(nodes[1]):{},delivered:null,rssiDbm:null,snrDb:null,environment:params,notes:''}};}
