import { MOUNT_SITES } from './site-features';
import type { Candidate } from './optimizer';
import type { SimParams } from './radio';
export const STARTER_PARAMS:SimParams={defaultRxDbm:-126,crowd:.35,bagLoss:false,includeRoamingRelays:false,meshHops:3,mode:'base',receiverAgl:1.5,receiverKind:'l1',meshRootId:'primary-p1'};
export const STARTER_BUDGET=3;
export const STARTER_MAX_HEIGHT=12;
export const MAST_HEIGHTS=[1.5,3,6,9,12,18,24,30];
/** Retained for low-level add-on search fixtures; application uses complete inventory planning. */
export function placementCandidates(maxHeight=STARTER_MAX_HEIGHT,allowed:Record<string,boolean>={}):Candidate[]{return MOUNT_SITES.flatMap(site=>MAST_HEIGHTS.filter(h=>h<=maxHeight).map(agl=>({id:`site-${site.id}-${agl}`,siteId:site.id,node:{id:`recommended-${site.id}-${agl}`,kind:'v4',x:site.x,y:site.y,agl,role:'client_base',deployment:'fixed',label:`${site.label} fixed client`},allowed:allowed[site.id]??true,feasibility:'unknown',reason:'Proposed placement; mounting, power and access require confirmation.'})));}
