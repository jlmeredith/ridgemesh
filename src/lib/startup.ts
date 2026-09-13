import { parseScenario } from './store';
import { createStarterScenario } from './starter-plan';
import { MODEL_VERSION } from './radio';
import { TERRAIN_VERSION } from './terrain';
export const SCENARIO_STORAGE='ridgemesh-scenario-v3';
export const LEGACY_STORAGE='ridgemesh-scenario-v2';
export const BACKUP_STORAGE='ridgemesh-scenario-before-recommended';
export const REJECTED_STORAGE='ridgemesh-scenario-unreadable-backup';
/** Only the precise old generated scaffold may be replaced automatically. */
function untouchedOldStarter(raw:Record<string,unknown>){
 const nodes=raw.nodes as Array<Record<string,unknown>>,p=raw.params as Record<string,unknown>;
 const expected=[['m1-0',118.1,112],['m1-1',125.7,108.4],['m1-2',123.4,70.7],['m1-3',140.9,75.7],['m1-4',158.2,61],['m1-5',92.6,72.4]];
 if(raw.schema!==2||raw.modelVersion!=='ridgemesh-rf-3.0'||!['My event plan','Optimized starting plan'].includes(String(raw.name))||!Array.isArray(nodes)||!p)return false;
 if(nodes.length!==(raw.name==='My event plan'?6:7))return false;
 const labels=['Main Stage handheld','Main Stage Field handheld','Stargazer camp handheld','Harmony Grove handheld','Dreamcatcher camp handheld','Family / quiet camp handheld'];
 if(!expected.every(([id,x,y],i)=>{const n=nodes[i];return n.id===id&&n.label===labels[i]&&n.x===x&&n.y===y&&n.agl===1.5&&n.kind==='m1'&&n.role==='client'&&Object.keys(n).sort().join(',')==='agl,id,kind,label,role,x,y';}))return false;
 if(nodes.length===7){const n=nodes[6];if(n.id!=='recommended-star-1.5'||n.kind!=='v4'||n.x!==123.4||n.y!==70.7||n.agl!==1.5||n.role!=='router'||n.label!=='Stargazer camp router'||Object.keys(n).sort().join(',')!=='agl,id,kind,label,role,x,y')return false;}
 const allowed=['crowd','bagLoss','clientsHop','meshHops','totemHops','communityTotems','mode','receiverAgl','meshRootId','totemRootId'];
 return Object.keys(p).every(k=>allowed.includes(k))&&p.crowd===.35&&p.bagLoss===false&&p.clientsHop===false&&p.meshHops===3&&p.totemHops===5&&p.communityTotems===false&&p.mode==='base'&&p.receiverAgl===1.5&&p.meshRootId==='m1-0';
}
export function resolveStartup(saved:string|null){
 if(saved===null)return{scenario:createStarterScenario(),source:'recommended' as const};
 try{const scenario=parseScenario(saved,TERRAIN_VERSION,MODEL_VERSION),raw=JSON.parse(saved);if(untouchedOldStarter(raw))return{scenario:createStarterScenario(),source:'upgraded' as const,backup:saved};return{scenario,source:'saved' as const,...(raw.schema===2?{backup:saved,notice:'Previous supported radios retained; original file backed up. Compute a plan to use the P1 inventory.'}:{})};}
 catch(error){return{scenario:createStarterScenario(),source:'recovered' as const,rejected:saved,error:error instanceof Error?error.message:'Saved plan could not be read.'};}
}
