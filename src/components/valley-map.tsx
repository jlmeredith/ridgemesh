import { useEffect, useRef, useState } from "react";
import { KIND_META, computeHeat, evaluateLink, profile } from "@/lib/radio";
import { useSim } from "@/lib/store";
import { mountValley, type ValleyApi, type ViewName } from "@/lib/valley-gl";

const VIEWS: { id: ViewName; label: string }[] = [
  { id: "overview", label: "From south" },
  { id: "top", label: "North up" },
  { id: "west", label: "Stargazer" },
  { id: "field", label: "Field" },
];

export function ValleyMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ValleyApi | null>(null);
  const nodes = useSim((s) => s.nodes);
  const overlay = useSim((s) => s.overlay);
  const crowd = useSim((s) => s.crowd);
  const bagLoss = useSim((s) => s.bagLoss);
  const clientsHop = useSim((s) => s.clientsHop);
  const meshHops = useSim((s) => s.meshHops);
  const totemHops = useSim((s) => s.totemHops);
  const communityTotems = useSim((s) => s.communityTotems);

  useEffect(() => {
    const host = wrapRef.current;
    if (!host) return;
    const api = mountValley(host);
    apiRef.current = api;
    return () => {
      api.destroy();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const s = useSim.getState();
      const heat = computeHeat(
        s.nodes,
        {
          crowd: s.crowd,
          bagLoss: s.bagLoss,
          clientsHop: s.clientsHop,
          meshHops: s.meshHops,
          totemHops: s.totemHops,
          communityTotems: s.communityTotems,
        },
        5,
      );
      s.setHeat(heat);
      apiRef.current?.setHeat(heat, s.overlay);
    }, 40);
    return () => window.clearTimeout(handle);
  }, [nodes, overlay, crowd, bagLoss, clientsHop, meshHops, totemHops, communityTotems]);

  return (
    <div
      ref={wrapRef}
      className="relative h-full min-h-[320px] w-full overflow-hidden bg-bg"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap gap-1 rounded-lg border border-border bg-bg/85 p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => apiRef.current?.setView(v.id)}
              className="h-8 rounded-md px-2.5 text-[11px] font-medium text-fg hover:bg-elev"
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="hidden rounded-md border border-border bg-bg/85 px-2 py-1 text-[11px] text-muted sm:block">
          Drag orbit · Scroll zoom · Right-drag pan · Click to place
        </div>
      </div>
      <Compass apiRef={apiRef} />
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md border border-border bg-bg/80 px-2 py-1 text-[11px] text-muted">
        CI 20 ft · rings: solid LOS · dashed = through a hill
      </div>
      <Legend />
      <ProbeCard />
    </div>
  );
}

function Compass({
  apiRef,
}: {
  apiRef: React.RefObject<ValleyApi | null>;
}) {
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      id = requestAnimationFrame(tick);
      const next = apiRef.current?.getHeadingDeg();
      if (next !== undefined) setDeg(next);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [apiRef]);
  return (
    <div className="pointer-events-none absolute left-3 top-14 z-10 size-16 rounded-full border border-border bg-bg/85 text-[10px] font-medium text-fg">
      <div
        className="relative size-full"
        style={{ transform: `rotate(${-deg}deg)` }}
      >
        <span className="absolute left-1/2 top-1 -translate-x-1/2 text-stone">
          N
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-muted">
          S
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted">
          W
        </span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-muted">
          E
        </span>
        <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg" />
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10 space-y-1 rounded-lg border border-border bg-bg/85 px-3 py-2 text-[11px] text-fg">
      <div className="flex items-center gap-2">
        <span className="inline-block size-2 rounded-full bg-stone" /> Totem
        2.4 GHz
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block size-2 bg-sage" /> LoRa 915 MHz
      </div>
      <div className="text-muted">Glow on the ground is coverage</div>
    </div>
  );
}

function ProbeCard() {
  const probe = useSim((s) => s.probe);
  const nodes = useSim((s) => s.nodes);
  const crowd = useSim((s) => s.crowd);
  const bagLoss = useSim((s) => s.bagLoss);
  const clientsHop = useSim((s) => s.clientsHop);
  const meshHops = useSim((s) => s.meshHops);
  const totemHops = useSim((s) => s.totemHops);
  const communityTotems = useSim((s) => s.communityTotems);
  if (!probe || probe[0] === probe[1]) return null;
  const a = nodes.find((n) => n.id === probe[0]);
  const b = nodes.find((n) => n.id === probe[1]);
  if (!a || !b) return null;
  const link = evaluateLink(a, b, {
    crowd,
    bagLoss,
    clientsHop,
    meshHops,
    totemHops,
    communityTotems,
  });
  const pr = profile(
    { x: a.x, y: a.y, agl: KIND_META[a.kind].agl },
    { x: b.x, y: b.y, agl: KIND_META[b.kind].agl },
  );
  return (
    <div className="absolute bottom-14 right-3 z-10 w-[min(100%-1.5rem,280px)] rounded-xl border border-border bg-elev p-3 text-xs text-fg shadow-soft">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium">Path probe</span>
        <button
          className="text-muted"
          onClick={() => useSim.getState().clearProbe()}
        >
          Close
        </button>
      </div>
      <p className="text-muted">
        {a.label} → {b.label} · {Math.round(link.distM)} m ·{" "}
        {Math.round(link.forestM)} m timber
      </p>
      <p className={link.ok ? "mt-1 text-sage" : "mt-1 text-warn"}>
        {link.ok ? "Link holds" : "Link fails"} — {link.reason}
      </p>
      <p className="mt-1 tabular-nums text-muted">
        {Math.round(link.lossDb)} dB path / {Math.round(link.budgetDb)} dB budget
        {pr.blocked ? ` · ${pr.excessM.toFixed(1)} m of dirt in the way` : ""}
      </p>
    </div>
  );
}
