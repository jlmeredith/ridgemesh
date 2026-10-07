import {HARDWARE,directedLink,pathProfile,type RadioNode,type Environment,type Surface} from './model';
export type MastPlan={status:'sufficient'|'over-cap'|'unknown';minimumAgl:number|null;losAgl:number|null;fresnelAgl:number|null;marginDb:number|null;maxAgl:number;reason:string};
/** Raise endpoint a only; b remains at its configured height. Geometric clearance is not an RF guarantee. */
export function planMastHeight(a:RadioNode,b:RadioNode,params:Environment,surface:Surface,options:{maxAgl?:number;stepM?:number;requiredMarginDb?:number}={}):MastPlan{
 const maxAgl=options.maxAgl??30,step=options.stepM??.5,required=options.requiredMarginDb??6;
 const unknown=(reason:string):MastPlan=>({status:'unknown',minimumAgl:null,losAgl:null,fresnelAgl:null,marginDb:null,maxAgl,reason});
 if(!Number.isFinite(maxAgl)||maxAgl<.5||maxAgl>30||!Number.isFinite(step)||step<.5||!Number.isFinite(required))return unknown('Invalid height search settings.');
 const path=pathProfile({...a,agl:0},{...b,agl:b.agl??HARDWARE[b.kind].agl},surface,Math.min(surface.cellM,5),params.canopyM??15);
 if(path.unknown)return unknown('Terrain is unavailable along the sampled path.');
 const wavelength=299.792458/(a.frequencyMhz??HARDWARE[a.kind].mhz);let losAgl=0,fresnelAgl=0;
 for(const v of path.samples.slice(1,-1)){const radius=Math.sqrt(wavelength*path.distM*v.t*(1-v.t));losAgl=Math.max(losAgl,(v.ground-path.h1*v.t)/(1-v.t)-path.h0);fresnelAgl=Math.max(fresnelAgl,(v.ground+.6*radius-path.h1*v.t)/(1-v.t)-path.h0);}
 let marginDb:number|null=null;
 const heights=Array.from({length:Math.floor((maxAgl-.5)/step)+1},(_,i)=>.5+i*step);if(heights.at(-1)!==maxAgl)heights.push(maxAgl);
 for(const agl of heights){const raised={...a,agl};const forward=directedLink(raised,b,params,surface),reverse=directedLink(b,raised,params,surface);if(forward.status==='unknown'||reverse.status==='unknown')return {...unknown('Unknown radio configuration or terrain prevents a height estimate.'),losAgl,fresnelAgl};marginDb=Math.min(forward.marginDb,reverse.marginDb);if(marginDb>=required)return {status:'sufficient',minimumAgl:agl,losAgl,fresnelAgl,marginDb,maxAgl,reason:`Lowest tested antenna height meeting ${required} dB in both directions; ${step} m search increments. Geometric clearance excludes canopy; RF includes the scenario foliage assumption.`};}
 return {status:'over-cap',minimumAgl:null,losAgl,fresnelAgl,marginDb:Number.isFinite(marginDb)?marginDb:null,maxAgl,reason:`No tested height at or below ${maxAgl} m meets ${required} dB in both directions. Height alone may not solve this path.`};
}
