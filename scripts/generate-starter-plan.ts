import { writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { analyzeScenario, analysisSurface, planningTargets, suggestClients, MODEL_VERSION } from '../src/lib/radio';
import { optimizePlacement } from '../src/lib/optimizer';
import { placementCandidates, STARTER_PARAMS, STARTER_BUDGET, STARTER_MAX_HEIGHT } from '../src/lib/placement-policy';
import { SITE_VERSION } from '../src/lib/site-features';
import { TERRAIN_VERSION } from '../src/lib/terrain';

if(hostname()!=='z370')throw new Error('Generate on z370, never the Mac.');
const nodes=suggestClients(),targets=planningTargets(STARTER_PARAMS,4),candidates=placementCandidates();
const result=optimizePlacement({nodes,params:STARTER_PARAMS,targets,candidates,budget:STARTER_BUDGET,surface:analysisSurface});
if(!result.best.nodes.some(n=>n.role==='router'))throw new Error('No router selected; review the changed model before publishing a router starter.');
const analysis=analyzeScenario(result.best.nodes,STARTER_PARAMS,{step:4});
const output={version:'astral-optimized-start-v1',scenario:{schema:2,siteVersion:SITE_VERSION,name:'Optimized starting plan',terrainVersion:TERRAIN_VERSION,modelVersion:MODEL_VERSION,nodes:result.best.nodes,params:STARTER_PARAMS},evidence:{host:hostname(),runId:process.env.RIDGEMESH_RUN_ID??'optimized-start-generation',method:result.method,candidateCount:candidates.length,budget:STARTER_BUDGET,maxHeight:STARTER_MAX_HEIGHT,targetStepM:40,targetAreaSqM:analysis.stats.targetAreaSqM,evaluations:result.evaluations,baselineScore:result.baseline.score,proposedScore:result.best.score,likelyFraction:analysis.stats.meshLikelyFrac,marginalFraction:analysis.stats.meshMarginalFrac,limitations:result.limitations}};
writeFileSync(new URL('../public/data/optimized-plan.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output.evidence));console.log(JSON.stringify(result.best.nodes.filter(n=>n.role==='router')));
