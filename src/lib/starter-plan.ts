import data from '../../public/data/optimized-plan.json';
import type { Scenario } from './store';
import type { Node, SimParams } from './radio';

export const STARTER_VERSION=data.version;
export const STARTER_EVIDENCE=data.evidence;
export function createStarterScenario():Scenario{return structuredClone(data.scenario) as Scenario;}
function stable(value:unknown):unknown{return Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):value;}
export function samePlan(a:{nodes:Node[];params:SimParams},b:{nodes:Node[];params:SimParams}){return JSON.stringify(stable(a))===JSON.stringify(stable(b));}
export function isStarterPlan(nodes:Node[],params:SimParams){return samePlan({nodes,params},{nodes:data.scenario.nodes as Node[],params:data.scenario.params as SimParams});}
