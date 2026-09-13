import data from '../../public/data/optimized-plan.json';
import type {Scenario} from './store';
import type {InfrastructurePlan} from './infrastructure-planner';
import type {Node,SimParams} from './radio';
export const STARTER_VERSION=data.version;
export const STARTER_EVIDENCE=data.evidence;
export const STARTER_PLAN=(data as unknown as {plan:InfrastructurePlan}).plan;
export function createStarterScenario():Scenario{return structuredClone(data.scenario) as unknown as Scenario;}
function stable(value:unknown):unknown{return Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):value;}
export function samePlan(a:{nodes:Node[];params:SimParams},b:{nodes:Node[];params:SimParams}){return JSON.stringify(stable({nodes:a.nodes,params:a.params}))===JSON.stringify(stable({nodes:b.nodes,params:b.params}));}
export function isStarterPlan(nodes:Node[],params:SimParams){return samePlan({nodes,params},createStarterScenario());}
