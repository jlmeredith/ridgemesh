import { useMemo, type ReactNode } from "react";
import {
  Antenna,
  CircleDot,
  Eraser,
  MousePointer2,
  Radio,
  Trees,
} from "lucide-react";
import { POIS } from "@/lib/terrain";
import { KIND_META, coverageStats } from "@/lib/radio";
import { useSim, type Tool } from "@/lib/store";
import { cn } from "@/lib/utils";

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: "select", label: "Move", hint: "Drag nodes. Shift-click to probe." },
  { id: "totem", label: "Totem", hint: "Place a Totem Compass (2.4 GHz)." },
  { id: "m1", label: "M1", hint: "Place a ThinkNode M1 handheld." },
  { id: "v4", label: "V4", hint: "Place a Heltec V4 ridge repeater." },
  { id: "erase", label: "Erase", hint: "Click a node to remove it." },
];

export function SidePanel() {
  const tool = useSim((s) => s.tool);
  const overlay = useSim((s) => s.overlay);
  const crowd = useSim((s) => s.crowd);
  const bagLoss = useSim((s) => s.bagLoss);
  const clientsHop = useSim((s) => s.clientsHop);
  const meshHops = useSim((s) => s.meshHops);
  const totemHops = useSim((s) => s.totemHops);
  const communityTotems = useSim((s) => s.communityTotems);
  const nodes = useSim((s) => s.nodes);
  const heat = useSim((s) => s.heat);

  const stats = useMemo(() => {
    if (!heat) {
      return {
        totemFrac: 0,
        meshFrac: 0,
        totemCamps: 0,
        meshCamps: 0,
        campCount: 4,
        totemCount: nodes.filter((n) => n.kind === "totem").length,
        m1Count: nodes.filter((n) => n.kind === "m1").length,
        v4Count: nodes.filter((n) => n.kind === "v4").length,
      };
    }
    return coverageStats(heat, nodes);
  }, [heat, nodes]);

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto border-border bg-elev px-4 py-4 md:border-l">
      <header>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          Astral Valley Art Park
        </p>
        <h1 className="font-display text-2xl leading-tight text-fg">RidgeMesh</h1>
        <p className="mt-1 text-sm text-muted">
          Totem Compass vs 915 MHz Meshtastic on the real ridge-and-creek layout
          — French Village, St. Francois County, MO.
        </p>
      </header>

      <section>
        <Label>Place</Label>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              title={t.hint}
              onClick={() => useSim.getState().setTool(t.id)}
              className={cn(
                "flex h-11 items-center justify-center rounded-md border text-[11px] font-medium",
                tool === t.id
                  ? "border-fg bg-fg text-bg"
                  : "border-border bg-bg text-fg",
              )}
            >
              {t.id === "select" && <MousePointer2 className="size-3.5" />}
              {t.id === "totem" && <CircleDot className="size-3.5" />}
              {t.id === "m1" && <Radio className="size-3.5" />}
              {t.id === "v4" && <Antenna className="size-3.5" />}
              {t.id === "erase" && <Eraser className="size-3.5" />}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          {TOOLS.find((t) => t.id === tool)?.hint}
        </p>
      </section>

      <section>
        <Label>Overlay</Label>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {(["both", "totem", "mesh", "none"] as const).map((o) => (
            <button
              key={o}
              onClick={() => useSim.getState().setOverlay(o)}
              className={cn(
                "h-9 rounded-md border text-[11px] capitalize",
                overlay === o
                  ? "border-fg bg-fg text-bg"
                  : "border-border bg-bg text-fg",
              )}
            >
              {o}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-muted">
          Rings: amber Totem, cyan Mesh. Gaps behind hills = would have to go
          through. Green hop = clear, gold = around a bend, red = through a mountain.
        </p>
      </section>

      <section>
        <Label>Presets</Label>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {(
            [
              ["totem-crew", "Totem crew of 5"],
              ["m1-only", "M1 handhelds"],
              ["backbone", "V4 backbone"],
              ["hybrid", "Hybrid"],
            ] as const
          ).map(([id, lab]) => (
            <button
              key={id}
              onClick={() => useSim.getState().loadPreset(id)}
              className="h-9 rounded-md border border-border bg-bg px-2 text-left text-[11px] text-fg"
            >
              {lab}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label>Ground truth knobs</Label>
        <Row
          label={`Crowd ${Math.round(crowd * 100)}%`}
          hint="Bodies eat 2.4 GHz. 915 MHz barely notices."
        >
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={crowd}
            onChange={(e) => useSim.getState().setCrowd(Number(e.target.value))}
            className="w-full accent-fg"
            suppressHydrationWarning
          />
        </Row>
        <Toggle
          on={communityTotems}
          set={useSim.getState().setCommunity}
          label="Other Totems on site"
          hint="Unity mesh only exists if strangers also brought Compasses."
        />
        <Toggle
          on={bagLoss}
          set={useSim.getState().setBagLoss}
          label="M1 / V4 in a dry bag"
          hint="~2 dB if the whip is inside the bag. Keep the antenna out."
        />
        <Toggle
          on={clientsHop}
          set={useSim.getState().setClientsHop}
          label="Handhelds rebroadcast"
          hint="CLIENT vs CLIENT_MUTE. Hopping helps coverage, clogs 915 at a packed drop."
        />
        <Row label={`Meshtastic hop limit ${meshHops}`}>
          <input
            type="range"
            min={1}
            max={7}
            step={1}
            value={meshHops}
            onChange={(e) =>
              useSim.getState().setMeshHops(Number(e.target.value))
            }
            className="w-full accent-fg"
            suppressHydrationWarning
          />
        </Row>
      </section>

      <section className="rounded-xl border border-border bg-bg p-3">
        <Label>Coverage on this placement</Label>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <Stat k="Totem wash" v={`${Math.round(stats.totemFrac * 100)}%`} />
          <Stat k="LoRa wash" v={`${Math.round(stats.meshFrac * 100)}%`} />
          <Stat
            k="Camps reached (T)"
            v={`${stats.totemCamps}/${stats.campCount}`}
          />
          <Stat
            k="Camps reached (L)"
            v={`${stats.meshCamps}/${stats.campCount}`}
          />
          <Stat k="Totems" v={`${stats.totemCount}`} />
          <Stat k="M1 / V4" v={`${stats.m1Count} / ${stats.v4Count}`} />
        </dl>
      </section>

      <CompareCopy />
      <OptimizeCopy />
      <PoiList />
    </aside>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
      {children}
    </h2>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[12px] text-fg">
        {label}
      </div>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

function Toggle({
  on,
  set,
  label,
  hint,
}: {
  on: boolean;
  set: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={() => set(!on)}
      className="flex w-full items-start justify-between gap-3 rounded-lg border border-border bg-bg px-3 py-2 text-left"
    >
      <span>
        <span className="block text-[12px] text-fg">{label}</span>
        <span className="block text-[11px] text-muted">{hint}</span>
      </span>
      <span
        className={cn(
          "mt-0.5 h-5 w-9 shrink-0 rounded-full border",
          on ? "border-fg bg-fg" : "border-border bg-elev",
        )}
      >
        <span
          className={cn(
            "mt-0.5 block size-3.5 rounded-full bg-bg transition-transform",
            on ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted">{k}</dt>
      <dd className="font-medium tabular-nums text-fg">{v}</dd>
    </div>
  );
}

function CompareCopy() {
  return (
    <section className="space-y-2 text-sm leading-relaxed text-muted">
      <Label>How they actually behave here</Label>
      <p>
          The park sits in the valley. Creek is the drain on the floor.
          Stargazer is the huge flat 785 ft hilltop — about 100 ft of climb.
          Signal is rings, not a heat wash: solid = LOS, dashed gap = radio
          shadow behind a hill (would have to go through). Gold hops are
          around a bend; red hops punch a mountain.
      </p>
      <p>
        <span className="text-fg">Totem Compass</span> — GNSS + proprietary 2.4
        GHz. About 1 km P2P in open meadow, collapsing through bodies, metal
        (35 ft stage roof), and the rise onto Stargazer. It cannot see over
        that mesa from the field. It gets better only if many other Totems
        sit on the connecting trail. GNSS also weakens under Grove canopy and
        next to the steel roof.
      </p>
      <p>
        <span className="text-fg">ThinkNode M1</span> — nRF52840, SX1262, 22
        dBm, GPS, e-ink, ~48 h, RP-SMA whip. Waterproof it in a clear dry bag
        but leave the antenna outside. Ground-to-ground through Ozark timber is
        typically hundreds of meters, not kilometers.
      </p>
      <p>
        <span className="text-fg">Heltec V4</span> — 28 dBm (~6× the M1’s
        radiated power), solar header, optional GNSS. Put it in a gasketed 3D
        printed case on a 4–8 m mast. Antenna height beats transmit power on
        this property. The 35 ft Main Stage is the free mast.
      </p>
    </section>
  );
}

function OptimizeCopy() {
  return (
    <section className="space-y-2 text-sm leading-relaxed text-muted">
      <Label>Backbone recipe</Label>
      <ol className="list-decimal space-y-1.5 pl-4">
        <li>
          Three V4 routers: Stargazer on the 785 ft knob, the 885 ft ridge west
          of the creek looking into camp, stage mast on the meadow bench.
        </li>
        <li>
          Every handheld as CLIENT_MUTE (toggle off “Handhelds rebroadcast”) so
          the drop does not saturate LongFast.
        </li>
        <li>
          Position interval 5–15 min, not 30 s. Text is the payload; GPS spam is
          the enemy.
        </li>
        <li>
          Keep Totems for the dancefloor crew of 4. Do not expect them to find
          someone in Dreamcatcher from the rail.
        </li>
        <li>
          A node at the gate covers the road bench that neither meadow system
          sees well.
        </li>
      </ol>
      <button
        onClick={() => useSim.getState().loadPreset("backbone")}
        className="mt-2 h-10 w-full rounded-md bg-fg text-sm font-medium text-bg"
      >
        Drop the three-mast backbone
      </button>
      <p className="flex items-center gap-1.5 text-[11px]">
        <Trees className="size-3.5" />
        Schematic terrain, not a survey. Treat placements as a plan to walk with
        a range test.
      </p>
    </section>
  );
}

function PoiList() {
  return (
    <section>
      <Label>Named ground</Label>
      <ul className="mt-2 space-y-2">
        {POIS.filter((p) => p.kind !== "amenity").map((p) => (
          <li key={p.id} className="text-[12px]">
            <span className="text-fg">{p.label}</span>
            <span className="block text-muted">{p.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted">
        {KIND_META.totem.band} vs {KIND_META.m1.band}. Devices do not mesh with
        each other.
      </p>
    </section>
  );
}
