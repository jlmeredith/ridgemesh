import { MOUNT_SITES } from './site-features';
import type { Candidate } from './optimizer';
import type { SimParams } from './radio';

export const STARTER_PARAMS:SimParams={crowd:.35,bagLoss:false,clientsHop:false,meshHops:3,totemHops:5,communityTotems:false,mode:'base',receiverAgl:1.5,meshRootId:'m1-0',totemRootId:'totem-0'};
export const STARTER_BUDGET=2;
export const STARTER_MAX_HEIGHT=12;
export const MAST_HEIGHTS=[1.5,3,6,9,12,18,24,30];
export function placementCandidates(maxHeight=STARTER_MAX_HEIGHT,allowed:Record<string,boolean>={}):Candidate[]{
 return MOUNT_SITES.flatMap(site=>MAST_HEIGHTS.filter(h=>h<=maxHeight).map(agl=>({id:`site-${site.id}-${agl}`,siteId:site.id,node:{id:`recommended-${site.id}-${agl}`,kind:'v4',x:site.x,y:site.y,agl,role:'router',label:`${site.label} router`},allowed:allowed[site.id]??true,feasibility:'unknown',reason:'Source-informed location; permission, mounting, power and exact ground position require confirmation.'})));
}
