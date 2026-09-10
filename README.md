# RidgeMesh

3D RF planner for **Astral Valley Art Park** (French Village, MO). Compare Totem Compass (2.4 GHz festival mesh) vs a LoRa Meshtastic deployment (ThinkNode M1 / Heltec V4) on real Koester-quad terrain.

## What it shows

- USGS NED 10 m heights, 20-ft contours, spot elevations (785 / 824 / 885 / 920 / 922 ft)
- Satellite-registered camp layout: lodge, Main Stage field on the valley floor, Stargazer hilltop (~100 ft climb), spring-fed Plattin Creek in the drain
- Range **rings** with radio shadows (solid = LOS, dashed = would have to go through a hill)
- Link color: green clear, gold around a bend, red through a mountain
- Repeater placement presets (Totem crew, M1 handhelds, V4 ridge backbone, hybrid)

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). North-up is the default camera. Hit **V4 backbone** to see mesh rings.

`npm run typecheck` for TS. Terrain and radio live in `src/lib/terrain.ts`, `src/lib/radio.ts`, `src/lib/valley-gl.ts`.
