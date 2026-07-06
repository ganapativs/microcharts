# 13 — Universal Rendering: Exports, Print, Everywhere

> Status: draft v1 · Added 2026-07-06 per expanded vision: charts must live anywhere text lives — forms, posters, business cards, pamphlets, promos, email, READMEs — and export pixel-identically.

## 1. The architectural unlock: core emits geometry, renderers are thin

`core/` computes geometry (points, paths, colors, labels) with zero React. That makes renderers cheap:

| Renderer | Output | Package | Deps |
|---|---|---|---|
| React static (v1) | SVG elements, RSC-safe | `microcharts` | 0 |
| React interactive (v1) | + listeners/animation | `microcharts/*/interactive` | 0 |
| **String renderer (v1.x)** | standalone SVG string (no React, no DOM) | `microcharts/string` | 0 |
| Unicode renderer (v1.x) | `▁▂▄▇` block strings | `microcharts/text` | 0 |
| Canvas (horizon) | shared-surface for virtualized grids | later | 0 |

The **string renderer** is the universal adapter: SVG strings work in email `<img>` (after rasterizing), markdown images, OG images, README badges, server responses, PDFs, print pipelines — no browser, no React, runs in any JS runtime (Node/Bun/Deno/edge/workers).

## 2. Export — "exactly as it looks"

### 2.1 Client-side (zero-dep, browser-native)

```ts
import { toSVG, toPNG, toClipboard } from "microcharts/export";
toSVG(ref.current, { fonts: "embed" })   // → Blob/string
toPNG(ref.current, { scale: 2 })         // → Blob (device-pixel-perfect @2x/@3x)
toClipboard(ref.current, "png")          // one-call copy
```

- `toSVG`: `XMLSerializer` on the live node + **computed-style inlining** (resolve every `var(--mc-*)` and inherited font property into attributes so the exported file is context-free — exact fidelity to what's on screen, including theme).
- `toPNG`: serialized SVG → `Image` → `canvas.drawImage` → `toBlob`. All platform APIs. `scale` for print-DPI exports (e.g. `scale: 12` ≈ 300 DPI for a 25 mm business-card spark).
- No dependency, ever, for client export.

### 2.2 Font fidelity (the hard part, three tiers)

| Tier | Mechanism | Fidelity | Cost |
|---|---|---|---|
| `fonts: "system"` (default) | export names the font stack; renderer's fonts apply | good enough for same-org use | 0 |
| `fonts: "embed"` | fetch the used font (FontFace API / document.fonts), subset to used glyphs where possible, inline as data-URI `@font-face` in the SVG | **exact** in browsers/tools honoring SVG @font-face | 0 deps |
| `fonts: "outline"` | text → `<path>` outlines | exact everywhere (incl. old email clients, cutting plotters) | optional `@microcharts/outline` pkg using **opentype.js 2.0** (verified active 2026-05-06) — never in core |

Charts render few glyphs (a value label, min/max) — embedding/outlining stays tiny. Docs state fidelity guarantees per tier honestly.

### 2.3 Server-side & remote generation

- `microcharts/string` renders themed SVG anywhere. **PNG on server**: documented recipe using **sharp** (verified active 2026-07-01) — `sharp(Buffer.from(svg)).png()`. Recipe/example first; optional `@microcharts/node` wrapper only if demand shows. resvg-js rejected (stale since 2024-03, violates maintained-only rule).
- **Chart-as-URL endpoint (recipe + deployable template)**: an edge-function example (`/spark.svg?data=3,5,4,8&type=line&theme=newspaper&w=120&h=24`) → cache-friendly SVG/PNG. Enables:
  - **README badges** — sparkline badges for GitHub (shields.io-style). Dogfood loop: our repo's README shows our npm-downloads sparkline as one of our own badges. Marketing that demos the product.
  - Email (PNG variant), Notion/docs embeds, OG images, CMS content.
- Spec input for the endpoint = the same JSON chart spec as the AI layer (`14-ai-native.md`) — one spec, three consumers (React props, URL params, streaming blocks).

## 3. Print & physical contexts

- **`print.css` shipped**: `@media print` block — exact-color hints (`print-color-adjust: exact`), pt-safe stroke minimums (hairlines below ~0.75 pt vanish on laser printers), background-band fallbacks to outlined bands (browsers strip backgrounds by default when printing).
- **Physical sizing guidance** in docs: mm/pt sizing table per chart (business card ≥ 20×8 mm, poster scale rules — strokes scale with `vector-effect` off for print).
- SVG exports are vector → native crispness at any print size; PNG exports take `scale` for target DPI.

## 4. Context themes (extends `06-design-language.md` presets)

Same token mechanism, new presets — each a real design exercise, not a palette swap:

| Preset | Design intent |
|---|---|
| `modern` (default) | crispy SaaS (existing) |
| `tufte` | grayscale, hairline, red endpoint (existing) |
| `mono` / `vivid` | existing |
| **`newspaper`** | pure black ink, no grays below ~40%, slightly heavier strokes, serif-friendly metrics, dashed/dotted patterns replace color entirely |
| **`magazine`** | editorial: one saturated spot color + black, generous dots, tighter labels |
| **`poster`** | display scale: bold strokes, oversized endpoint labels, high contrast at distance |
| **`eink`** | e-readers/e-ink dashboards: pure B/W + patterns, no anti-aliasing reliance (`shape-rendering: crispEdges` on rectilinear marks), no animation ever, thicker minimum strokes (ghosting), no grays that dither badly |
| **`print`** | neutral ink-safe default pairing with print.css |

Synergy note: the pattern-instead-of-color machinery (dashes, marker shapes, fills) is the **same code** required for forced-colors/a11y (`08`) — one investment, three payoffs (a11y, print, e-ink).

Preset architecture unchanged: token sets + `data-mc-theme` attr; all presets export-safe (computed-style inlining captures them).

## 5. Out-of-the-box additions (invented, ranked)

| Idea | Verdict |
|---|---|
| README badge service (self-hostable template) | **Do** — v1.x; marketing loop |
| Unicode/text renderer (`▁▂▄▇`, win-loss `WLLW`, bar `▮▮▯`) | **Do** — v1.x; terminals, plaintext email, code comments, PDF fallback (matches vision's "inline spark token") |
| `toDataURI()` helper (inline `<img src=>` embedding) | **Do** — trivial on string renderer |
| Copy-as-SVG/PNG UI affordance recipe (hover button) | **Do** — docs recipe, not core |
| Email guide (PNG + width rules per client) | **Do** — docs page |
| OG-image recipe (chart in social cards via satori-compatible embed or direct SVG) | **Do** — docs recipe |
| Web Component wrapper (`<micro-chart spec=…>`) | Horizon — after vanilla core ships |
| Figma plugin (paste real chart vectors into design files) | Horizon — strong fit (designers making posters/cards), needs traction first |
| Animated export (GIF/video) | **No** — scope creep, contradicts micro ethos |

## 6. Dependency policy (reaffirmed)

- Core + all v1/v1.x renderers + client export: **0 dependencies**, enforced in CI.
- Optional packages only where platform APIs genuinely can't (text outlining → opentype.js; server PNG → sharp recipe), always separate packages, always registry-verified active before adoption (rule now in `11-oss-operations.md` §2 spirit + audit doc).
