/** Geometry is in terrain-grid units; one unit is cellM metres on every axis. */
export type GridPoint = [number, number];
export function scenePoint(x:number,y:number,elevationM:number,aglM:number,cols:number,rows:number,cellM:number,elevationMinM:number):[number,number,number]{
 return [x-(cols-1)/2,(elevationM-elevationMinM+aglM)/cellM,y-(rows-1)/2];
}
/** Clip a convex polygon (terrain renderer passes triangulated target polygons) to a cell. */
export function clipPolygonToRect(polygon:GridPoint[],minX:number,minY:number,maxX:number,maxY:number):GridPoint[]{
 let result=polygon;
 for(const [axis,bound,greater] of [[0,minX,true],[0,maxX,false],[1,minY,true],[1,maxY,false]] as const){
  const input=result;result=[];if(!input.length)break;
  for(let i=0;i<input.length;i++){const a=input[i],b=input[(i+1)%input.length],insideA=greater?a[axis]>=bound:a[axis]<=bound,insideB=greater?b[axis]>=bound:b[axis]<=bound;
   if(insideA)result.push(a);if(insideA!==insideB){const t=(bound-a[axis])/(b[axis]-a[axis]);result.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
 }
 return result;
}
export function heatCellIndex(x:number,y:number,step:number,width:number,height:number):number|null{
 if(x<0||y<0||step<=0)return null;const col=Math.floor(x/step),row=Math.floor(y/step);return col>=width||row>=height?null:row*width+col;
}
export function polygonArea(points:GridPoint[]):number{return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;}
/** Height on the renderer's NW-SE cell triangulation, without changing the RF surface. */
export function triangleSurfaceElevation(x:number,y:number,cols:number,rows:number,height:(x:number,y:number)=>number):number{
 const ix=Math.max(0,Math.min(cols-2,Math.floor(x))),iy=Math.max(0,Math.min(rows-2,Math.floor(y))),u=Math.max(0,Math.min(1,x-ix)),v=Math.max(0,Math.min(1,y-iy));
 const nw=height(ix,iy),ne=height(ix+1,iy),sw=height(ix,iy+1),se=height(ix+1,iy+1);
 return u+v<=1?nw+(ne-nw)*u+(sw-nw)*v:se+(sw-se)*(1-u)+(ne-se)*(1-v);
}
/** Intersect a convex target fragment with one convex terrain triangle. */
export function clipPolygonToTriangle(polygon:GridPoint[],triangle:[GridPoint,GridPoint,GridPoint]):GridPoint[]{
 const signedArea=triangle.reduce((sum,p,i)=>{const q=triangle[(i+1)%3];return sum+p[0]*q[1]-q[0]*p[1];},0);if(Math.abs(signedArea)<1e-12)return [];
 const orientation=Math.sign(signedArea);let result=polygon;
 for(let edge=0;edge<3;edge++){const a=triangle[edge],b=triangle[(edge+1)%3],distance=(p:GridPoint)=>orientation*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])),input=result;result=[];
  for(let i=0;i<input.length;i++){const p=input[i],q=input[(i+1)%input.length],dp=distance(p),dq=distance(q),insideP=dp>=-1e-10,insideQ=dq>=-1e-10;if(insideP)result.push(p);if(insideP!==insideQ){const t=dp/(dp-dq);result.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}
 }
 return result;
}
export type ScreenRect={x:number;y:number;w:number;h:number};
/** Priority is input order: radio labels reserve their space before place labels. */
export function layoutSceneLabels(items:Array<{anchorX:number;anchorY:number;w:number;h:number}>,bounds:ScreenRect,reserved:ScreenRect[]=[]):ScreenRect[]{
 const placed:ScreenRect[]=[];
 const overlap=(a:ScreenRect,b:ScreenRect)=>Math.max(0,Math.min(a.x+a.w+3,b.x+b.w+3)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h+3,b.y+b.h+3)-Math.max(a.y,b.y));
 for(const item of items){const maxX=Math.max(bounds.x,bounds.x+bounds.w-item.w),maxY=Math.max(bounds.y,bounds.y+bounds.h-item.h),clamp=(x:number,y:number):ScreenRect=>({x:Math.max(bounds.x,Math.min(maxX,x)),y:Math.max(bounds.y,Math.min(maxY,y)),w:item.w,h:item.h});
  const candidates=[clamp(item.anchorX-item.w/2,item.anchorY-item.h-7),clamp(item.anchorX+7,item.anchorY-item.h/2),clamp(item.anchorX-item.w-7,item.anchorY-item.h/2),clamp(item.anchorX-item.w/2,item.anchorY+7)];
  for(let y=bounds.y;y<=maxY;y+=8)for(let x=bounds.x;x<=maxX;x+=8)candidates.push(clamp(x,y));
  const cost=(r:ScreenRect)=>[...reserved,...placed].reduce((sum,o)=>sum+overlap(r,o)*100000,0)+Math.pow(Math.max(r.x,Math.min(r.x+r.w,item.anchorX))-item.anchorX,2)+Math.pow(Math.max(r.y,Math.min(r.y+r.h,item.anchorY))-item.anchorY,2);
  let best=candidates[0],bestCost=cost(best);for(const c of candidates){const value=cost(c);if(value<bestCost){best=c;bestCost=value;}}placed.push(best);
 }
 return placed;
}
