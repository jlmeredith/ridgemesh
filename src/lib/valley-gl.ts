import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COLS, ROWS, CELL_M, HEIGHT, ELEV_MIN, elevBilinear } from './terrain';
import { KIND_META, type Heat, type Node, type SimParams } from './radio';
import type { Overlay } from './store';
export type ViewName = 'north'|'east'|'south'|'west'|'top';
export type SceneState = { nodes:Node[];params:SimParams;heat:Heat|null;overlay:Overlay;imagery:string;exaggeration:number;view:ViewName;opacity:number };
export type ValleyApi = { destroy:()=>void; update:(s:SceneState)=>void };

export function mountValley(host:HTMLElement, initial:SceneState): ValleyApi {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#15202c');
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(43,1,0.1,1500);const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-0.02;controls.minDistance=25;controls.maxDistance=550;
  const geometry=new THREE.BufferGeometry();const positions=new Float32Array(COLS*ROWS*3);const uv=new Float32Array(COLS*ROWS*2);const indices:number[]=[];
  for(let j=0;j<ROWS;j++)for(let i=0;i<COLS;i++){const k=j*COLS+i;positions[3*k]=i-(COLS-1)/2;positions[3*k+2]=j-(ROWS-1)/2;uv[k*2]=i/(COLS-1);uv[k*2+1]=1-j/(ROWS-1);if(i<COLS-1&&j<ROWS-1)indices.push(k,k+COLS,k+1,k+1,k+COLS,k+COLS+1);}
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);
  const material=new THREE.MeshBasicMaterial({color:'#ffffff',side:THREE.DoubleSide});const land=new THREE.Mesh(geometry,material);scene.add(land);
  const overlayGeo=geometry.clone();const rgba=new Float32Array(COLS*ROWS*4);overlayGeo.setAttribute('color',new THREE.BufferAttribute(rgba,4));
  const overlayMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,side:THREE.DoubleSide});const overlayMesh=new THREE.Mesh(overlayGeo,overlayMat);overlayMesh.position.y=0.045;overlayMesh.visible=false;scene.add(overlayMesh);
  const samplesGeo=new THREE.BufferGeometry(),samplesMat=new THREE.PointsMaterial({vertexColors:true,size:1.1,sizeAttenuation:true,depthTest:true});const samplesCloud=new THREE.Points(samplesGeo,samplesMat);scene.add(samplesCloud);
  const objects=new THREE.Group();scene.add(objects);let state=initial;let raf=0;let alive=true;let imageKey='';let loadId=0;let lastNodes:Node[]|null=null;let lastParams='';let lastExag=-1;let lastOverlay='';let lastView='';
  const point=(n:Node)=>new THREE.Vector3(n.x-(COLS-1)/2,(elevBilinear(n.x,n.y)-ELEV_MIN+(n.agl??KIND_META[n.kind].agl))/CELL_M*state.exaggeration,n.y-(ROWS-1)/2);
  function disposeGroup(){objects.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});objects.clear();}
  function update(s:SceneState){
    state=s;
    if(s.exaggeration!==lastExag){for(let k=0;k<HEIGHT.length;k++)positions[k*3+1]=(HEIGHT[k]-ELEV_MIN)/CELL_M*s.exaggeration;geometry.attributes.position.needsUpdate=true;overlayGeo.setAttribute('position',new THREE.BufferAttribute(positions.slice(),3));geometry.computeBoundingSphere();overlayGeo.computeBoundingSphere();}
    if(s.imagery!==imageKey){imageKey=s.imagery;const id=++loadId;new THREE.TextureLoader().load(s.imagery,t=>{if(!alive||id!==loadId){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;material.map?.dispose();material.map=t;material.needsUpdate=true;},undefined,()=>host.dispatchEvent(new CustomEvent('imagery-error')));}
    const samplePositions:number[]=[],sampleColors:number[]=[];
    if(s.heat&&s.overlay!=='none'){const h=s.heat;for(let k=0;k<h.w*h.h;k++){if(!h.targetWeights[k])continue;const x=(k%h.w)*h.step+Math.min(h.step,COLS-1-(k%h.w)*h.step)/2,y=Math.floor(k/h.w)*h.step+Math.min(h.step,ROWS-1-Math.floor(k/h.w)*h.step)/2;const v=h.mesh[k];const color=v<0?[.7,.75,.8]:v===0?[.96,.49,.46]:v<1?[.95,.73,.36]:[.41,.72,1];samplePositions.push(x-(COLS-1)/2,(elevBilinear(x,y)-ELEV_MIN)/CELL_M*s.exaggeration+.15,y-(ROWS-1)/2);sampleColors.push(...color);}}
    samplesGeo.setAttribute('position',new THREE.Float32BufferAttribute(samplePositions,3));samplesGeo.setAttribute('color',new THREE.Float32BufferAttribute(sampleColors,3));samplesGeo.computeBoundingSphere();
    const pk=JSON.stringify(s.params);
    if(lastNodes!==s.nodes||pk!==lastParams||s.exaggeration!==lastExag||lastOverlay!==s.overlay){disposeGroup();for(const n of s.nodes){const p=point(n);const ground=(elevBilinear(n.x,n.y)-ELEV_MIN)/CELL_M*s.exaggeration;const height=p.y-ground;const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,Math.max(height,0.05),6),new THREE.MeshBasicMaterial({color:'#78baff'}));pole.position.set(p.x,ground+height/2,p.z);objects.add(pole);const marker=new THREE.Mesh(new THREE.SphereGeometry(n.kind==='p1'?0.9:0.6,10,8),new THREE.MeshBasicMaterial({color:'#78baff'}));marker.position.copy(p);objects.add(marker);}
      lastNodes=s.nodes;lastParams=pk;lastOverlay=s.overlay;
    }
    if(lastView!==s.view){const d=Math.max(COLS,ROWS)*0.92;const target=new THREE.Vector3(8,8,0);controls.target.copy(target);const v=s.view==='north'?[0,d*0.6,-d]:s.view==='east'?[d,d*0.6,0]:s.view==='west'?[-d,d*0.6,0]:s.view==='top'?[0,d*1.35,0.01]:[0,d*0.6,d];camera.position.set(...v as [number,number,number]);camera.lookAt(target);lastView=s.view;}lastExag=s.exaggeration;
  }
  const resize=()=>{const r=host.getBoundingClientRect();renderer.setSize(r.width,Math.max(r.height,1));camera.aspect=r.width/Math.max(r.height,1);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();update(initial);
  function frame(){if(!alive)return;controls.update();renderer.render(scene,camera);renderer.domElement.dataset.geometries=String(renderer.info.memory.geometries);renderer.domElement.dataset.textures=String(renderer.info.memory.textures);raf=requestAnimationFrame(frame);}frame();
  const contextLost=(e:Event)=>{e.preventDefault();host.dispatchEvent(new CustomEvent('webgl-failed'));};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  return {update,destroy(){alive=false;++loadId;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();disposeGroup();geometry.dispose();overlayGeo.dispose();material.map?.dispose();material.dispose();overlayMat.dispose();samplesGeo.dispose();samplesMat.dispose();renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.dispose();renderer.domElement.remove();}};
}
