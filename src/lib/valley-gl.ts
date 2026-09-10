import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { KIND_META, classifyLink, occludedRing, type Heat, type Node } from "./radio";
import { POIS, SPOTS, CELL_M, contourSegs, llToGrid } from "./terrain";
import { useSim, type Overlay } from "./store";
import {
  buildTerrainBuffers,
  gridToWorld,
  tintTerrain,
  treeSpecs,
  worldToGrid,
} from "./world";

export type ViewName = "overview" | "top" | "west" | "field";

export type ValleyApi = {
  destroy: () => void;
  setView: (v: ViewName) => void;
  setHeat: (heat: Heat | null, overlay: Overlay) => void;
  getHeadingDeg: () => number;
};

const VIEWS: Record<ViewName, { pos: [number, number, number]; target: [number, number, number] }> =
  {
    overview: { pos: [10, 48, 108], target: [8, 8, 4] },
    top: { pos: [8, 175, 18], target: [8, 4, -6] },
    west: { pos: [16, 28, -52], target: [12, 10, 10] },
    field: { pos: [14, 12, 24], target: [16, 5, 6] },
  };

export function mountValley(host: HTMLElement): ValleyApi {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#121610");
  scene.fog = new THREE.Fog("#121610", 160, 360);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.2, 800);
  camera.position.set(...VIEWS.top.pos);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
  renderer.setClearColor("#121610", 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "absolute inset-0 h-full w-full touch-none";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.zIndex = "0";
  host.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.style.position = "absolute";
  labels.domElement.style.inset = "0";
  labels.domElement.style.pointerEvents = "none";
  labels.domElement.style.zIndex = "1";
  host.appendChild(labels.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.06;
  controls.minDistance = 18;
  controls.maxDistance = 340;
  controls.target.set(...VIEWS.top.target);
  controls.screenSpacePanning = true;

  scene.add(new THREE.AmbientLight("#8a9084", 0.4));
  scene.add(new THREE.HemisphereLight("#e4eadc", "#3a3428", 1.05));
  const sun = new THREE.DirectionalLight("#fff3dc", 1.55);
  sun.position.set(90, 120, 50);
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#b8c4c8", 0.35);
  fill.position.set(-60, 40, -30);
  scene.add(fill);

  const terrain = makeTerrain();
  scene.add(terrain.mesh);

  const trees = makeTrees();
  scene.add(trees);

  scene.add(makeContours());
  scene.add(makeScaleBar());
  scene.add(makeSpots());
  scene.add(makeStage());
  scene.add(makeNorthMark());

  const poiGroup = makePois();
  scene.add(poiGroup);

  const nodeGroup = new THREE.Group();
  scene.add(nodeGroup);
  const radioGroup = new THREE.Group();
  scene.add(radioGroup);
  const probeLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xb0c4b8, depthTest: false }),
  );
  probeLine.frustumCulled = false;
  scene.add(probeLine);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let raf = 0;
  let running = true;
  let fly: {
    t: number;
    fromP: THREE.Vector3;
    toP: THREE.Vector3;
    fromT: THREE.Vector3;
    toT: THREE.Vector3;
  } | null = null;
  let dragId: string | null = null;
  let down: { x: number; y: number } | null = null;

  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(2, Math.floor(r.width));
    const h = Math.max(2, Math.floor(r.height));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  function syncNodes() {
    while (nodeGroup.children.length) {
      const ch = nodeGroup.children[0];
      nodeGroup.remove(ch);
    }
    while (radioGroup.children.length) {
      const ch = radioGroup.children[0];
      radioGroup.remove(ch);
    }
    const st = useSim.getState();
    for (const n of st.nodes) {
      nodeGroup.add(makeMarker(n, n.id === st.selected));
    }
    radioGroup.add(makeRadio(st.nodes, st.overlay));
    const pr = st.probe;
    if (pr && pr[0] !== pr[1]) {
      const a = st.nodes.find((n) => n.id === pr[0]);
      const b = st.nodes.find((n) => n.id === pr[1]);
      if (a && b) {
        const pa = gridToWorld(a.x, a.y);
        const pb = gridToWorld(b.x, b.y);
        probeLine.geometry.dispose();
        probeLine.geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(pa[0], pa[1] + 1.6, pa[2]),
          new THREE.Vector3(pb[0], pb[1] + 1.6, pb[2]),
        ]);
        probeLine.visible = true;
      } else probeLine.visible = false;
    } else probeLine.visible = false;
  }

  function setHeat(heat: Heat | null, overlay: Overlay) {
    const col = tintTerrain(terrain.land, heat, overlay);
    const attr = terrain.mesh.geometry.getAttribute("color") as THREE.BufferAttribute;
    attr.array.set(col);
    attr.needsUpdate = true;
  }

  const unsub = useSim.subscribe((s) => {
    syncNodes();
    setHeat(s.heat, s.overlay);
  });
  syncNodes();

  function ndcFromEvent(ev: PointerEvent) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  }

  function hitTerrain(ev: PointerEvent) {
    ndcFromEvent(ev);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(terrain.mesh);
    return hits[0] ?? null;
  }

  function hitNode(ev: PointerEvent) {
    ndcFromEvent(ev);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodeGroup.children, true);
    const h = hits[0];
    if (!h) return null;
    let o: THREE.Object3D | null = h.object;
    while (o && !o.userData.nodeId) o = o.parent;
    return o?.userData.nodeId as string | undefined;
  }

  function onDown(ev: PointerEvent) {
    down = { x: ev.clientX, y: ev.clientY };
    const id = hitNode(ev);
    const st = useSim.getState();
    if (id && st.tool === "erase") {
      st.removeNode(id);
      down = null;
      return;
    }
    if (id && st.tool === "select") {
      st.select(id);
      dragId = id;
      controls.enableRotate = false;
      controls.enablePan = false;
      if (ev.shiftKey) st.toggleProbe(id);
      renderer.domElement.setPointerCapture(ev.pointerId);
    }
  }

  function onMove(ev: PointerEvent) {
    if (!dragId) return;
    const hit = hitTerrain(ev);
    if (!hit) return;
    const g = worldToGrid(hit.point.x, hit.point.z);
    useSim.getState().moveNode(dragId, g.x, g.y);
  }

  function onUp(ev: PointerEvent) {
    const st = useSim.getState();
    const moved =
      down && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6;
    if (!dragId && !moved && down) {
      const id = hitNode(ev);
      const hit = hitTerrain(ev);
      if (st.tool === "select") {
        if (!id) st.select(null);
      } else if (st.tool !== "erase" && hit) {
        const g = worldToGrid(hit.point.x, hit.point.z);
        st.addNode(st.tool, g.x, g.y);
      }
    }
    dragId = null;
    down = null;
    controls.enableRotate = true;
    controls.enablePan = true;
  }

  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("pointerup", onUp);

  const clock = new THREE.Clock();
  function tick() {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (fly) {
      controls.enabled = false;
      fly.t = Math.min(1, fly.t + dt * 1.7);
      const k = 1 - Math.pow(1 - fly.t, 3);
      camera.position.lerpVectors(fly.fromP, fly.toP, k);
      controls.target.lerpVectors(fly.fromT, fly.toT, k);
      camera.lookAt(controls.target);
      if (fly.t >= 1) {
        camera.position.copy(fly.toP);
        controls.target.copy(fly.toT);
        fly = null;
        controls.enabled = true;
      }
    } else {
      controls.update();
    }
    renderer.render(scene, camera);
    labels.render(scene, camera);
  }
  tick();

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      unsub();
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      labels.domElement.remove();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
    },
    setView(v) {
      const spec = VIEWS[v];
      fly = {
        t: 0,
        fromP: camera.position.clone(),
        toP: new THREE.Vector3(...spec.pos),
        fromT: controls.target.clone(),
        toT: new THREE.Vector3(...spec.target),
      };
    },
    setHeat,
    getHeadingDeg() {
      const lx = controls.target.x - camera.position.x;
      const lz = controls.target.z - camera.position.z;
      return (Math.atan2(lx, -lz) * 180) / Math.PI;
    },
  };
}

function makeTerrain() {
  const { positions, colors, indices } = buildTerrainBuffers();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "terrain";
  return { mesh, land: colors.slice() };
}

function makeTrees() {
  const specs = treeSpecs();
  const geo = new THREE.ConeGeometry(0.55, 2.4, 5);
  geo.translate(0, 1.2, 0);
  const mat = new THREE.MeshLambertMaterial({ color: "#314a38" });
  const mesh = new THREE.InstancedMesh(geo, mat, specs.length);
  const dummy = new THREE.Object3D();
  specs.forEach((s, i) => {
    dummy.position.set(s.x, s.y, s.z);
    dummy.rotation.set(0, s.rot, 0);
    dummy.scale.set(s.s * 0.85, s.s, s.s * 0.85);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function makeRadio(nodes: Node[], overlay: Overlay) {
  const g = new THREE.Group();
  if (overlay === "none" || nodes.length === 0) return g;
  const wantT = overlay === "totem" || overlay === "both";
  const wantM = overlay === "mesh" || overlay === "both";

  const addSegs = (
    segs: { ax: number; ay: number; bx: number; by: number; clear: boolean }[],
    clearCol: number,
    blockCol: number,
  ) => {
    const cPts: THREE.Vector3[] = [];
    const bPts: THREE.Vector3[] = [];
    for (const s of segs) {
      const a = gridToWorld(s.ax, s.ay);
      const b = gridToWorld(s.bx, s.by);
      const arr = s.clear ? cPts : bPts;
      arr.push(
        new THREE.Vector3(a[0], a[1] + 0.5, a[2]),
        new THREE.Vector3(b[0], b[1] + 0.5, b[2]),
      );
    }
    if (cPts.length) {
      g.add(
        new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints(cPts),
          new THREE.LineBasicMaterial({ color: clearCol, transparent: true, opacity: 0.88 }),
        ),
      );
    }
    if (bPts.length) {
      const line = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(bPts),
        new THREE.LineDashedMaterial({
          color: blockCol,
          dashSize: 0.7,
          gapSize: 0.55,
          transparent: true,
          opacity: 0.38,
        }),
      );
      line.computeLineDistances();
      g.add(line);
    }
  };

  for (const n of nodes) {
    const sys = KIND_META[n.kind].system;
    if (sys === "totem" && !wantT) continue;
    if (sys === "mesh" && !wantM) continue;
    const radii = sys === "totem" ? [250, 500, 1000] : [250, 500, 1000, 2000];
    const clearCol = sys === "totem" ? 0xe8a040 : 0x3ec7c9;
    const blockCol = sys === "totem" ? 0x6a4030 : 0x2a4a50;
    for (const r of radii) addSegs(occludedRing(n, r), clearCol, blockCol);
    const rM = radii[1];
    const [lx, ly, lz] = gridToWorld(n.x + rM / CELL_M, n.y);
    const div = document.createElement("div");
    div.textContent = `${rM} m`;
    div.style.cssText = `color:${sys === "totem" ? "#e8a040" : "#3ec7c9"};font:500 10px 'IBM Plex Sans',sans-serif;text-shadow:0 1px 4px #0e1210`;
    const lab = new CSS2DObject(div);
    lab.position.set(lx, ly + 1.3, lz);
    g.add(lab);
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const sa = KIND_META[a.kind].system;
      if (sa !== KIND_META[b.kind].system) continue;
      if (sa === "totem" && !wantT) continue;
      if (sa === "mesh" && !wantM) continue;
      const kind = classifyLink(a, b);
      const pa = gridToWorld(a.x, a.y);
      const pb = gridToWorld(b.x, b.y);
      const ya = pa[1] + (a.kind === "v4" ? 5.4 : 2.1);
      const yb = pb[1] + (b.kind === "v4" ? 5.4 : 2.1);
      const col = kind === "clear" ? 0x5ee0a0 : kind === "around" ? 0xf0c040 : 0xe05050;
      const mat =
        kind === "clear"
          ? new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9 })
          : new THREE.LineDashedMaterial({
              color: col,
              dashSize: 0.9,
              gapSize: 0.5,
              transparent: true,
              opacity: 0.95,
            });
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(pa[0], ya, pa[2]),
          new THREE.Vector3(pb[0], yb, pb[2]),
        ]),
        mat,
      );
      if (kind !== "clear") line.computeLineDistances();
      g.add(line);
    }
  }
  return g;
}

function makeContours() {
  const { minor, major, labels } = contourSegs();
  const g = new THREE.Group();
  g.add(linesFrom(minor, 0x8a6544, 0.5));
  g.add(linesFrom(major, 0x5a3824, 0.9));
  for (const lab of labels) {
    const [x, y, z] = gridToWorld(lab.x, lab.y);
    const div = document.createElement("div");
    div.textContent = String(lab.ft);
    div.style.cssText =
      "color:#c4a070;font:600 10px 'IBM Plex Sans',sans-serif;letter-spacing:.06em;text-shadow:0 1px 4px #0e1210";
    const obj = new CSS2DObject(div);
    obj.position.set(x, y + 0.6, z);
    g.add(obj);
  }
  return g;
}

function linesFrom(segs: number[], color: number, opacity: number) {
  const pos = new Float32Array((segs.length / 2) * 3);
  let k = 0;
  for (let i = 0; i < segs.length; i += 2) {
    const [wx, wy, wz] = gridToWorld(segs[i], segs[i + 1]);
    pos[k++] = wx;
    pos[k++] = wy + 0.15;
    pos[k++] = wz;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const line = new THREE.LineSegments(geo, mat);
  line.frustumCulled = false;
  line.renderOrder = 2;
  return line;
}

function makeScaleBar() {
  const g = new THREE.Group();
  const [x0, y0, z0] = gridToWorld(18, 188);
  const len = 50;
  const mat = new THREE.LineBasicMaterial({ color: 0xe8e0d0 });
  const pts = [new THREE.Vector3(x0, y0 + 0.3, z0), new THREE.Vector3(x0 + len, y0 + 0.3, z0)];
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  for (const t of [0, 0.5, 1]) {
    const tick = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x0 + len * t, y0 + 0.3, z0 - 0.8),
        new THREE.Vector3(x0 + len * t, y0 + 0.3, z0 + 0.8),
      ]),
      mat,
    );
    g.add(tick);
  }
  const mk = (text: string, t: number) => {
    const div = document.createElement("div");
    div.textContent = text;
    div.style.cssText =
      "color:#e8e0d0;font:500 10px 'IBM Plex Sans',sans-serif;text-shadow:0 1px 4px #0e1210;white-space:nowrap";
    const obj = new CSS2DObject(div);
    obj.position.set(x0 + len * t, y0 + 1.6, z0);
    g.add(obj);
  };
  mk("0", 0);
  mk("250 m", 0.5);
  mk("500 m", 1);
  return g;
}

function makeSpots() {
  const g = new THREE.Group();
  for (const s of SPOTS) {
    const [gx, gy] = llToGrid(s.lat, s.lon);
    const [x, y, z] = gridToWorld(gx, gy);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.1, 4),
      new THREE.MeshLambertMaterial({ color: "#c4a070" }),
    );
    cone.position.set(x, y + 1.1, z);
    g.add(cone);
    const div = document.createElement("div");
    div.textContent = `▲ ${s.label}`;
    div.style.cssText =
      "color:#d8c4a0;font:500 10px 'IBM Plex Sans',sans-serif;text-shadow:0 1px 4px #0e1210;white-space:nowrap";
    const lab = new CSS2DObject(div);
    lab.position.set(x, y + 2.4, z);
    g.add(lab);
  }
  return g;
}

function makeStage() {
  const g = new THREE.Group();
  const [sx, sy] = llToGrid(38.02275, -90.41031);
  const [x, y, z] = gridToWorld(sx, sy);
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.35, 2.2),
    new THREE.MeshLambertMaterial({ color: "#6a6458" }),
  );
  deck.position.set(x, y + 0.4, z);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.12, 2.6),
    new THREE.MeshLambertMaterial({ color: "#9a9488" }),
  );
  roof.position.set(x, y + 2.6, z);
  const postGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.2, 6);
  const postMat = new THREE.MeshLambertMaterial({ color: "#c4b7a4" });
  for (const dx of [-1.5, 1.5]) {
    for (const dz of [-0.8, 0.8]) {
      const p = new THREE.Mesh(postGeo, postMat);
      p.position.set(x + dx, y + 1.4, z + dz);
      g.add(p);
    }
  }
  g.add(deck, roof);
  return g;
}

function makeNorthMark() {
  const g = new THREE.Group();
  const [x, y, z] = gridToWorld(98, 6);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 2.2, 4),
    new THREE.MeshLambertMaterial({ color: "#ebe6dc" }),
  );
  cone.position.set(x, y + 2.4, z);
  g.add(cone);
  const div = document.createElement("div");
  div.textContent = "N";
  div.style.cssText =
    "color:#ebe6dc;font:600 11px 'IBM Plex Sans',sans-serif;text-shadow:0 1px 4px #0e1210";
  const lab = new CSS2DObject(div);
  lab.position.set(x, y + 4, z);
  g.add(lab);
  return g;
}

function makePois() {
  const g = new THREE.Group();
  const key = new Set(["gate", "stage", "star", "field", "grove", "dream", "family", "eastMeadow"]);
  for (const p of POIS) {
    if (!key.has(p.id)) continue;
    const [x, y, z] = gridToWorld(p.x, p.y);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 10, 8),
      new THREE.MeshBasicMaterial({ color: "#e8e4dc" }),
    );
    dot.position.set(x, y + 0.5, z);
    g.add(dot);
    const div = document.createElement("div");
    div.className = "poi-label";
    div.textContent = p.label;
    div.style.cssText =
      "color:#ebe6dc;font:500 11px 'IBM Plex Sans',sans-serif;letter-spacing:.01em;text-shadow:0 1px 8px #0e1210;white-space:nowrap;opacity:.9";
    const lab = new CSS2DObject(div);
    lab.position.set(x, y + 2.2, z);
    g.add(lab);
  }
  return g;
}

function makeMarker(n: Node, selected: boolean) {
  const g = new THREE.Group();
  g.userData.nodeId = n.id;
  const [x, y, z] = gridToWorld(n.x, n.y);
  g.position.set(x, y, z);
  const meta = KIND_META[n.kind];
  const h = n.kind === "v4" ? 5.2 : n.kind === "totem" ? 2.4 : 1.6;
  const col =
    n.kind === "totem" ? "#c4b7a4" : n.kind === "v4" ? "#d8ddd8" : "#8aa396";
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(n.kind === "v4" ? 0.12 : 0.16, 0.18, h, 8),
    new THREE.MeshLambertMaterial({ color: col }),
  );
  pole.position.y = h / 2;
  pole.userData.nodeId = n.id;
  const cap = new THREE.Mesh(
    n.kind === "v4"
      ? new THREE.BoxGeometry(0.7, 0.22, 0.5)
      : new THREE.SphereGeometry(0.28, 12, 10),
    new THREE.MeshLambertMaterial({ color: selected ? "#f2efe8" : col }),
  );
  cap.position.y = h + (n.kind === "v4" ? 0.1 : 0);
  cap.userData.nodeId = n.id;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55, selected ? 0.95 : 0.75, 20),
    new THREE.MeshBasicMaterial({
      color: selected ? "#f2efe8" : col,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  g.add(pole, cap, ring);
  if (selected) {
    const tip = document.createElement("div");
    tip.textContent = `${n.label} · ${meta.band}`;
    tip.style.cssText =
      "color:#ebe6dc;font:500 10px 'IBM Plex Sans',sans-serif;text-shadow:0 1px 6px #0e1210;white-space:nowrap;opacity:.9";
    const lab = new CSS2DObject(tip);
    lab.position.set(0, h + 1.1, 0);
    g.add(lab);
  }
  return g;
}
