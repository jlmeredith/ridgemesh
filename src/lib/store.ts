import { create } from "zustand";
import type { Heat, Kind, Node, SimParams } from "./radio";
import { suggestBackbone, suggestClients, suggestTotems } from "./radio";

export type Overlay = "both" | "totem" | "mesh" | "none";
export type Tool = "select" | Kind | "erase";

type State = {
  nodes: Node[];
  overlay: Overlay;
  tool: Tool;
  crowd: number;
  bagLoss: boolean;
  clientsHop: boolean;
  meshHops: number;
  totemHops: number;
  communityTotems: boolean;
  selected: string | null;
  probe: [string, string] | null;
  hoverPoi: string | null;
  heat: Heat | null;
  params: () => SimParams;
  addNode: (kind: Kind, x: number, y: number) => void;
  moveNode: (id: string, x: number, y: number) => void;
  removeNode: (id: string) => void;
  select: (id: string | null) => void;
  setTool: (t: Tool) => void;
  setOverlay: (o: Overlay) => void;
  setCrowd: (n: number) => void;
  setBagLoss: (v: boolean) => void;
  setClientsHop: (v: boolean) => void;
  setMeshHops: (n: number) => void;
  setCommunity: (v: boolean) => void;
  setHoverPoi: (id: string | null) => void;
  loadPreset: (name: "empty" | "totem-crew" | "m1-only" | "backbone" | "hybrid") => void;
  toggleProbe: (id: string) => void;
  clearProbe: () => void;
  setHeat: (heat: Heat | null) => void;
};

let seq = 1;

export const useSim = create<State>((set, get) => ({
  nodes: [...suggestTotems(), ...suggestBackbone(), ...suggestClients()],
  overlay: "none",
  tool: "select",
  crowd: 0.45,
  bagLoss: true,
  clientsHop: false,
  meshHops: 3,
  totemHops: 5,
  communityTotems: false,
  selected: null,
  probe: null,
  hoverPoi: null,
  heat: null,
  params: () => {
    const s = get();
    return {
      crowd: s.crowd,
      bagLoss: s.bagLoss,
      clientsHop: s.clientsHop,
      meshHops: s.meshHops,
      totemHops: s.totemHops,
      communityTotems: s.communityTotems,
    };
  },
  addNode: (kind, x, y) =>
    set((s) => ({
      nodes: [
        ...s.nodes,
        {
          id: `${kind}-${seq++}`,
          kind,
          x,
          y,
          label: `${kind.toUpperCase()} ${seq}`,
        },
      ],
    })),
  moveNode: (id, x, y) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    })),
  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      selected: s.selected === id ? null : s.selected,
    })),
  select: (id) => set({ selected: id }),
  setTool: (tool) => set({ tool }),
  setOverlay: (overlay) => set({ overlay }),
  setCrowd: (crowd) => set({ crowd }),
  setBagLoss: (bagLoss) => set({ bagLoss }),
  setClientsHop: (clientsHop) => set({ clientsHop }),
  setMeshHops: (meshHops) => set({ meshHops }),
  setCommunity: (communityTotems) => set({ communityTotems }),
  setHoverPoi: (hoverPoi) => set({ hoverPoi }),
  loadPreset: (name) => {
    if (name === "empty") set({ nodes: [], probe: null });
    if (name === "totem-crew")
      set({ nodes: suggestTotems(), overlay: "totem", communityTotems: false });
    if (name === "m1-only")
      set({ nodes: suggestClients(), overlay: "mesh", clientsHop: false });
    if (name === "backbone")
      set({
        nodes: [...suggestBackbone(), ...suggestClients()],
        overlay: "mesh",
        clientsHop: false,
      });
    if (name === "hybrid")
      set({
        nodes: [...suggestTotems(), ...suggestBackbone(), ...suggestClients()],
        overlay: "both",
        communityTotems: true,
      });
  },
  toggleProbe: (id) =>
    set((s) => {
      if (!s.probe) return { probe: [id, id], selected: id };
      if (s.probe[0] === s.probe[1]) return { probe: [s.probe[0], id] };
      return { probe: [id, id] };
    }),
  clearProbe: () => set({ probe: null }),
  setHeat: (heat) => set({ heat }),
}));
