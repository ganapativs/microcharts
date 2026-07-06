# 06 — Design Language & Theming

> Status: draft v1 · Inputs: Tufte/aesthetic research (Vercel Geist, Linear, Stripe token analyses), color-accessibility research (Okabe-Ito, Paul Tol, WCAG 1.4.11)

## 1. Design stance

**"Handcrafted, crispy, enterprise-modern."** The defaults must look like a senior designer at a Stripe/Linear/Vercel-class company shipped them — restrained, precise, quietly confident. Never AI-slop rainbow-Recharts.

What separates handcrafted from generic, at token level (from Vercel/Linear/Stripe design-system analyses):

1. **Restraint is the aesthetic.** Monochrome/near-neutral base + exactly one saturated accent per context. The accent "functions as a flashlight," not a paint bucket. Default palette: 2–3 semantic colors + neutral gray. Wider categorical sets are opt-in.
2. **Hairline precision.** 1–1.5 px strokes at micro scale. Elevation via 0.5–1 px borders, never shadow stacks. Data marks get 0–2 px radius max; larger radii belong to the *container* card, not the chart canvas — the data should feel sharper than its chrome.
3. **Transparent canvas.** Charts never paint their own background rect; they inherit the host surface. Avoids the boxed-in "chart library default" look.
4. **Typography discipline.** Values adjacent to charts always render with `font-variant-numeric: tabular-nums` (no layout jitter on update). Labels inherit the host font (system-ui/Inter/Geist class). No forced monospace.
5. **Motion restraint.** Animate only on data change and entrance — a sparkline updating should feel like "a fact being corrected, not a flourish." 150–250 ms, ease-out or linear. No idle loops, no bounce on KPI numbers. Full spec in `07-performance.md` + `08-accessibility.md`.
6. **Optical corrections** — the handcrafted tells: half-pixel stroke alignment for crisp hairlines, endpoint dots optically centered on line ends, `vector-effect: non-scaling-stroke` where scaling applies, deliberate whitespace (padding derived from font metrics, not arbitrary constants).

## 2. Color system

### Semantic tokens (primary — data with valence)
| Token | Role | Default (light) |
|---|---|---|
| `--mc-stroke` | primary data ink | near-black neutral `#171717` |
| `--mc-positive` | up/good | Okabe-Ito bluish green `#009E73` |
| `--mc-negative` | down/bad | Okabe-Ito vermillion `#D55E00` |
| `--mc-neutral` | no-valence data | gray `#8A8A8A`-class |
| `--mc-band` | range band fill | ~6-8% opacity neutral |
| `--mc-accent` | emphasis (endpoint dot, active) | single saturated accent, default blue `#0072B2` |

Green/red pair deliberately chosen from Okabe-Ito (colorblind-safe: bluish-green + vermillion, not pure green/red). Direction is **always** doubly encoded (arrow glyph/sign + color) — color never alone (WCAG 1.4.1).

### Categorical tokens (secondary — valence-free series)
`--mc-cat-1 … --mc-cat-6`, default = Okabe-Ito subset (orange `#E69F00`, sky blue `#56B4E9`, bluish green `#009E73`, blue `#0072B2`, vermillion `#D55E00`, reddish purple `#CC79A7`). Paul Tol *bright*/*muted* ship as alternative built-in scales. Micro charts rarely need > 3 series; docs discourage more.

### Contrast rules (WCAG 1.4.11)
- Strokes at 1–1.5 px sit in the anti-aliasing risk zone: target **≥ 4.5:1** against background for data strokes (exceeding the 3:1 minimum deliberately, per W3C's own thin-line guidance).
- Sequential color steps in ActivityGrid/HeatCell: ≥ 3:1 between adjacent steps or cell borders as separator; numeric tooltip/label as non-color channel.
- CI check: contrast-test all default token values, both themes.

### Dark mode
First-class, not derived: hand-tuned dark values for every token (light strokes desaturate + lighten; band opacities increase slightly). Shipped as `[data-mc-theme="dark"]` block + `color-scheme` awareness. Never auto-invert.

## 3. Theming architecture (two layers, one mechanism)

**Layer 1 — CSS custom properties = the runtime contract.**
- Components read `var(--mc-*)` at paint time. Host overrides at any scope (page, card, table row) with zero re-render, works with Tailwind/vanilla/CSS-in-JS.
- Defaults registered at low specificity via `:where()` so a single host class wins without specificity fights.
- Full token list is small and stable (~20 tokens): color set above + `--mc-stroke-width`, `--mc-dot-size`, `--mc-radius`, `--mc-gap`, `--mc-duration`, `--mc-easing`, `--mc-font`.

**Layer 2 — Presets = ergonomics on top.**
- Named presets are just bundled token-value sets: `presets.tufte` (grayscale, hairline, red accent endpoint — Beautiful Evidence look), `presets.modern` (default; the crispy SaaS look), `presets.mono`, `presets.vivid` (colorful-by-default option per vision), plus community presets later.
- **Context presets** (see `13-universal-rendering.md` §4): `newspaper`, `magazine`, `poster`, `eink`, `print` — charts as first-class citizens of editorial, print, and e-ink contexts. Pattern-instead-of-color machinery shared with forced-colors a11y work.
- Applied via `<MicroProvider theme={...}>` (sets CSS vars on a wrapper) or `data-mc-theme="tufte"` attribute (pure CSS, zero JS).
- Presets are **purely visual** (color/stroke/radius/motion). A preset may never change data semantics (what counts as positive, domains, scales) — avoids the Tremor trap of chart styling fighting host semantics.

**Prop-level escape hatch.** Every component accepts `color`, `strokeWidth`, etc. props that win over tokens for one-off cases; and `className`/`style` pass through to the root SVG. Priority: prop > nearest CSS var scope > preset > default.

**Non-goal:** wrapping a chart engine (the shadcn lesson) or requiring Tailwind (the Tremor lesson). Zero-dep hand-rolled SVG means we control every stroke — that's what makes deep theming possible.

## 4. Delight spec (the "maximum happiness" budget)

Delight = precision + a few earned moments, not confetti:

- **Draw-in entrance** (opt-in per chart, on by default for Sparkline): stroke-dashoffset line reveal, 300–400 ms ease-out, once, on first visibility (IntersectionObserver, lazy). Bars rise from baseline with 8–12 ms stagger.
- **Value morph:** on data update, path interpolates (same point count) or cross-fades (different); Delta number tick-counts with tabular-nums so nothing shifts.
- **Endpoint pulse:** single subtle scale pulse on the endpoint dot when a live series updates. One pulse. Never looping.
- **Hover reveal** (interactive mode only): nearest-point dot + value label fades in ≤ 100 ms; no heavy tooltip chrome at micro scale — a direct label *is* the tooltip.
- All motion honors `prefers-reduced-motion: reduce` → final state rendered immediately (see `08-accessibility.md`).

## 5. The Tufte defaults, concretely

Every component ships looking like a Beautiful Evidence figure wearing a modern SaaS suit:

- No axes/grids/legends; direct labels only (endpoint value, min/max dots).
- Range band behind line, ~7% ink.
- Areas anchored at zero; line baselines documented.
- One accent max per instance; color changes = meaning changes.
- Height defaults to `1em`-relative sizing; `bankTo45()` suggests width.
- Forbidden and not themeable: 3-D, gradients-as-decoration, shadows on data ink, moiré patterns, looping animation.
