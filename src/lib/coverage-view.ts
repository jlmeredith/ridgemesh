/** Fixed scale shared by the legend, plan map and 3D terrain. Margin is two-way route headroom, not RSSI. */
export const COVERAGE_STOPS=[{db:0,color:'#f2b05e'},{db:6,color:'#77cbe8'},{db:12,color:'#438fe2'},{db:24,color:'#615be8'},{db:40,color:'#ac68ed'},{db:60,color:'#e8a2e3'}];
export function coverageColor(value:number,margin:number):string{
 if(value===0)return '#ed655d';
 if(value<0||Number.isNaN(margin))return '#aeb8c5';
 const m=Math.max(0,Math.min(60,margin));
 const hi=COVERAGE_STOPS.findIndex(s=>s.db>=m);if(hi<=0)return COVERAGE_STOPS[0].color;
 const a=COVERAGE_STOPS[hi-1],b=COVERAGE_STOPS[hi],t=(m-a.db)/(b.db-a.db);
 return '#'+[1,3,5].map(i=>Math.round(parseInt(a.color.slice(i,i+2),16)*(1-t)+parseInt(b.color.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
}
export const COVERAGE_GRADIENT=`linear-gradient(90deg,${COVERAGE_STOPS.map(s=>`${s.color} ${s.db/60*100}%`).join(',')})`;
