<div align="center">

# microcharts

**Word-sized charts for React — made for AI first, and for the people reading what it writes.**

[![npm](https://img.shields.io/npm/v/@microcharts/react?color=0072b2&label=npm)](https://www.npmjs.com/package/@microcharts/react)
[![gzip per chart](https://img.shields.io/badge/per_chart-0.9–3.6_kB_gz-0072b2)](https://microcharts.dev/docs/performance)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-009e73)](https://microcharts.dev)
[![types](https://img.shields.io/npm/types/@microcharts/react?color=0072b2)](https://microcharts.dev)
[![React 18 · 19](https://img.shields.io/badge/React-18_·_19-009e73)](https://microcharts.dev/docs/quickstart)
[![MIT](https://img.shields.io/npm/l/@microcharts/react?color=666)](./LICENSE)

**[Docs](https://microcharts.dev)** · **[Gallery](https://microcharts.dev/docs/charts)** · **[Quickstart](https://microcharts.dev/docs/quickstart)** · **[AI usage](https://microcharts.dev/docs/ai)** · **[llms.txt](https://microcharts.dev/llms.txt)**

</div>

---

microcharts is **106 tiny, handcrafted chart types** built to sit _inside_ an interface — in a
sentence, a table cell, a KPI card, a tab header, a streamed AI reply — where a full chart
library would be too heavy and too loud. One quiet signal, read at a glance.

The grammar is small enough for a model to emit correctly mid-sentence, and every chart describes
itself in words. So a chart an LLM streams into a chat reply is one a person can read and trust —
the properties that make it safe for a model to write are the ones that make it pleasant for a
human to use.

## Why

- **AI-native.** A chart is plain `data` plus a generated sentence. One grammar across all 106
  types — a model that has seen one chart can write them all. → [AI usage](https://microcharts.dev/docs/ai)
- **Zero dependencies.** No chart engine, no D3 — just SVG. React is the only peer. CI-enforced, forever.
- **Server-component safe.** Static charts are hook-free and render to HTML with **zero client
  JavaScript**. Interactivity is a separate opt-in `/interactive` import.
- **Accessible by default.** Every chart is an `img` with a natural-language summary built from
  your data — nothing to remember, nothing to drift. → [Accessibility](https://microcharts.dev/docs/accessibility)
- **Tiny + honest.** **0.92–3.62 kB gzip** per chart (median 2.28; 26 of 106 under 2 kB),
  budget-gated in CI. Every type has one documented, honest encoding channel. Delight never lies.

## Install

```bash
npm install @microcharts/react
```

Import the stylesheet **once** at the root of your app — it carries every theming token and chart
style in a low-specificity cascade layer, so your own styles always win:

```tsx
// app/layout.tsx
import "@microcharts/react/styles.css";
```

## Your first chart

Every chart renders from `data` alone. This works in a **React Server Component** with zero
client JavaScript — pure SVG, and its accessible name is generated from the data.

```tsx
import { Sparkline } from "@microcharts/react/sparkline";

<Sparkline data={[3, 5, 4, 8, 6, 9]} title="Weekly revenue" />;
```

Each chart imports from its **own subpath**, so you only ship what you use. Every chart follows
the same two-entry pattern: a static default, and an `/interactive` twin.

## Add interactivity

Need hover, keyboard navigation, or live announcements? Import the same chart from
`/interactive`. Props, output, and accessibility are identical — you just opt into the client
component where it matters.

```tsx
import { Sparkline } from "@microcharts/react/sparkline/interactive";

<Sparkline data={[3, 5, 4, 8, 6, 9]} title="Weekly revenue" />;
```

## Annotate with children

Thresholds, markers, and target zones are **children** — the same grammar on every chart that
supports them:

```tsx
import { Sparkline } from "@microcharts/react/sparkline";
import { Threshold, Marker } from "@microcharts/react/annotations";

<Sparkline data={[120, 180, 240, 210, 260]} title="Latency p95">
  <Threshold y={200} label="SLO" />
  <Marker x={2} celebrate />
</Sparkline>;
```

## Theme it

Roughly 20 `--mc-*` CSS custom properties are the runtime contract; presets are token bundles.
Set one on a subtree with the provider — presets are visual only and never change what the data
means:

```tsx
import { MicroProvider } from "@microcharts/react";

<MicroProvider preset="editorial">
  <Sparkline data={[3, 5, 4, 8, 6, 9]} />
</MicroProvider>;
```

Presets: `modern` (default), `editorial`, `mono`, `vivid`. Dark mode is hand-tuned, not inverted.
→ [Theming guide](https://microcharts.dev/docs/theming)

## The catalog

**106 stable chart types** — 34 core, 26 decision, 23 expressive, 23 frontier — grouped by the
_question_ each one answers. `data` alone always renders something correct, and a prop name means
the same thing on every chart (`domain`, `color`, `title`, `summary`, `label`, `format`…), so you
pick by the decision you need read, not by fighting an options bag.

Sparklines, bars, deltas, and bullets through bump charts, funnels, honeycombs, calendar strips,
and confidence bands — **[browse them all in the live gallery →](https://microcharts.dev/docs/charts)**

> **Not shipping, on purpose:** pie, needle-gauge/speedometer, battery, waffle, violin. Each fails
> at micro scale or on the honest-encoding bar, and each has a strictly-better in-catalog
> replacement (Bullet for gauges, SegmentedBar for pie, MicroBox for violin).
> → [what to use instead](https://microcharts.dev/llms.txt)

## Made for models

microcharts is built to be written _by_ an LLM and read _by_ a person. The docs site publishes
machine surfaces alongside the human ones:

| Surface | What it is |
| --- | --- |
| [`/llms.txt`](https://microcharts.dev/llms.txt) | Curated map of the catalog and guides |
| [`/llms-full.txt`](https://microcharts.dev/llms-full.txt) | The complete generated docs corpus |
| [`/catalog.json`](https://microcharts.dev/catalog.json) | Every chart's name, import path, props, data shapes |

## Compatibility

React **18 and 19**. ESM-only, per-component subpath exports, `sideEffects: false`, types-first
export conditions. Static charts render in any RSC or SSR setup with no client runtime.

## Contributing

```bash
pnpm install
pnpm check     # typecheck + lint + format + test + knip + sizes
pnpm build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and ideas welcome — new chart types are held to
a high bar (≤ 200×60 px, a unique data story, an honest channel, readable without training).

## License

[MIT](./LICENSE) © [Ganapati V S](https://meetguns.com)
