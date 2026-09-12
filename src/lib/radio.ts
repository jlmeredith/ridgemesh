import {CAMPS,CELL_M,COLS,COVER,HEIGHT,ROWS,POIS,TERRAIN_VERSION,coverAt,elevBilinear} from './terrain';
import {HARDWARE,MODEL_VERSION,pathProfile,directedLink,evaluateTarget,routeBetween,type Surface,type RadioNode,type Environment,type Budget,type TargetResult} from './model';
export * from './model';
export type Kind=RadioNode['kind'];
export type Role='client'|'router'|'mute';
export type Node=RadioNode;
export type SimParams=Environment;
export type LinkResult=Budget;
export const KIND_META=Object.fromEntries(Object.entries(HARDWARE).map(([k,v])=>[k,{...v,band:`${v.mhz} MHz`}])) as Record<Kind,{title:string;txDbm:number;rxDbm:number;agl:number;mhz:number;system:'mesh'|'totem';known:boolean;band:string}>;
export const analysisSurface:Surface={version:TERRAIN_VERSION,cellM:CELL_M,cols:COLS,rows:ROWS,elevation:elevBilinear,cover:coverAt};
export function profile(a:{x:number;y:number;agl:number},b:{x:number;y:number;agl:number},coarse=false){return pathProfile(a,b,analysisSurface,coarse?10:5);}
export function evaluateLink(a:Node,b:Node,p:SimParams,_coarse=false){return directedLink(a,b,p,analysisSurface);}
export function reachability(nodes:Node[],p:SimParams,system:'mesh'|'totem',originId?:string){const set=nodes.filter(n=>HARDWARE[n.kind].system===system),root=originId??p[system==='mesh'?'meshRootId':'totemRootId']??p.rootId??set[0]?.id;const hops=new Map<string,number>(),prev=new Map<string,string|null>();for(const n of set){const r=routeBetween(set,root??'',n.id,p,analysisSurface);if(r.status==='likely'||r.status==='marginal'){hops.set(n.id,r.hops);prev.set(n.id,r.route.at(-2)??null);}}return {hops,prev,set,rootId:root};}
export type Heat={w:number;h:number;step:number;totem:Float32Array;mesh:Float32Array;totemMargin:Float32Array;meshMargin:Float32Array;pois:{mesh:TargetResult[];totem:TargetResult[]};modelVersion:string;targetWeights:Float32Array;targetAreaSqM:number};
/** Cells: -1 unknown, 0 unavailable, .5 marginal, 1 likely. Grid samples at cell centers. */
export function computeHeat(nodes:Node[],p:SimParams,step=10):Heat{
 step=Math.max(4,Math.min(40,Math.round(step)));const w=Math.ceil((COLS-1)/step),h=Math.ceil((ROWS-1)/step),totem=new Float32Array(w*h),mesh=new Float32Array(w*h),totemMargin=new Float32Array(w*h),meshMargin=new Float32Array(w*h);
 const cache=new Map<string,Budget>();const link=(a:Node,b:Node)=>{const key=JSON.stringify([a,b]);let r=cache.get(key);if(!r){r=directedLink(a,b,p,analysisSurface);if(cache.size<20000)cache.set(key,r);}return r;};
 const polygon=p.targetPolygon??(()=>{const xs=CAMPS.map(c=>c.x),ys=CAMPS.map(c=>c.y);return [[Math.min(...xs)-3,Math.min(...ys)-3],[Math.max(...xs)+3,Math.min(...ys)-3],[Math.max(...xs)+3,Math.max(...ys)+3],[Math.min(...xs)-3,Math.max(...ys)+3]] as [number,number][];})();
 const inside=(x:number,y:number)=>{let on=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])on=!on;}return on;};const targetWeights=new Float32Array(w*h);
 const code={unknown:-1,unavailable:0,marginal:.5,likely:1};
 for(let gy=0;gy<h;gy++)for(let gx=0;gx<w;gx++){const target={id:`${gx}:${gy}`,label:'Area cell',x:gx*step+Math.min(step,COLS-1-gx*step)/2,y:gy*step+Math.min(step,ROWS-1-gy*step)/2};const index=gy*w+gx;if(inside(target.x,target.y))targetWeights[index]=Math.min(step,COLS-1-gx*step)*Math.min(step,ROWS-1-gy*step)*CELL_M*CELL_M;for(const system of ['mesh','totem'] as const){const r=evaluateTarget(target,nodes,p,analysisSurface,system,link);(system==='mesh'?mesh:totem)[index]=code[r.status];(system==='mesh'?meshMargin:totemMargin)[index]=r.marginDb;}}
 const pois={mesh:[] as TargetResult[],totem:[] as TargetResult[]};for(const system of ['mesh','totem'] as const)pois[system]=CAMPS.map((c,i)=>evaluateTarget({id:`camp-${i}`,label:c.label,x:c.x,y:c.y},nodes,p,analysisSurface,system,link));
 return {w,h,step,totem,mesh,totemMargin,meshMargin,pois,modelVersion:MODEL_VERSION,targetWeights,targetAreaSqM:targetWeights.reduce((a,b)=>a+b,0)};
}
export function coverageStats(heat:Heat,nodes:Node[]){const frac=(g:Float32Array,test:(n:number)=>boolean)=>heat.targetAreaSqM?Array.from(g).reduce((sum,v,i)=>sum+(test(v)?heat.targetWeights[i]:0),0)/heat.targetAreaSqM:0;return {targetAreaSqM:heat.targetAreaSqM,totemFrac:frac(heat.totem,v=>v>0),meshFrac:frac(heat.mesh,v=>v>0),totemUnknownFrac:frac(heat.totem,v=>v<0),meshUnknownFrac:frac(heat.mesh,v=>v<0),totemCamps:heat.pois.totem.filter(r=>r.status==='likely'||r.status==='marginal').length,meshCamps:heat.pois.mesh.filter(r=>r.status==='likely'||r.status==='marginal').length,campCount:CAMPS.length,totemCount:nodes.filter(n=>n.kind==='totem').length,m1Count:nodes.filter(n=>n.kind==='m1').length,v4Count:nodes.filter(n=>n.kind==='v4').length};}
export function analyzeScenario(nodes:Node[],params:SimParams,options:{step?:number}={}){const heat=computeHeat(nodes,params,options.step);return {heat,stats:coverageStats(heat,nodes),pois:heat.pois,crewPairs:nodes.filter(n=>n.kind!=='v4').flatMap((a,i,crew)=>crew.slice(i+1).filter(b=>HARDWARE[a.kind].system===HARDWARE[b.kind].system).map(b=>({from:a.id,to:b.id,forward:routeBetween(nodes,a.id,b.id,params,analysisSurface),reverse:routeBetween(nodes,b.id,a.id,params,analysisSurface)})))};}
export function occludedRing(n: Node, radiusM: number, segs = 64) {
  const r = radiusM / CELL_M;
  const agl = KIND_META[n.kind].agl;
  const pts: { x: number; y: number; clear: boolean }[] = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const x = n.x + Math.cos(a) * r;
    const y = n.y + Math.sin(a) * r;
    const p = profile({ x: n.x, y: n.y, agl }, { x, y, agl: 1.2 }, true);
    pts.push({ x, y, clear: !p.blocked });
  }
  const segsOut: { ax: number; ay: number; bx: number; by: number; clear: boolean }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    segsOut.push({
      ax: pts[i].x,
      ay: pts[i].y,
      bx: pts[i + 1].x,
      by: pts[i + 1].y,
      clear: pts[i].clear && pts[i + 1].clear,
    });
  }
  return segsOut;
}

export type LinkClass = "clear" | "around" | "through";

export function classifyLink(a: Node, b: Node): LinkClass {
  const p = profile(
    { x: a.x, y: a.y, agl: KIND_META[a.kind].agl },
    { x: b.x, y: b.y, agl: KIND_META[b.kind].agl },
    true,
  );
  if (!p.blocked) return "clear";
  if (p.excessM >= 8) return "through";
  return "around";
}

function preset(kind:Kind,limit:number):Node[]{return POIS.filter(p=>p.kind==='camp'||p.kind==='stage').slice(0,limit).map((p,i)=>({id:`${kind}-${i}`,kind,x:p.x,y:p.y,label:`${p.label} ${kind.toUpperCase()}`}));}
/** Illustrative starting layout, not a placement recommendation. */
export function suggestBackbone():Node[]{return preset('v4',2);}
export function suggestClients():Node[]{return preset('m1',5);}
export function suggestTotems():Node[]{return preset('totem',5);}

export { COVER, HEIGHT, COLS, ROWS };
