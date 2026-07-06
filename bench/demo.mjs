// Checkpoint-2 demo generator (plan/10 ✋ Checkpoint 2). Renders every chart via
// the REAL built components → static SVG and assembles a self-contained showcase
// page (four contexts, all five charts + variants, a shared-scale density table,
// size/bench receipts, light/dark). Run after `pnpm build && node bench/run.mjs`:
//   node bench/demo.mjs out.html
import { readFileSync, writeFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup as R } from "react-dom/server";
import { Sparkline } from "../dist/charts/sparkline/index.js";
import { SparkBar } from "../dist/charts/sparkbar/index.js";
import { Delta } from "../dist/charts/delta/index.js";
import { Bullet } from "../dist/charts/bullet/index.js";
import { ActivityGrid } from "../dist/charts/activity-grid/index.js";
import { describeSeries } from "../dist/index.js";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const out = process.argv[2];

// deterministic pseudo-random (no Math.random — stable output)
let seed = 1337;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const series = (n, base = 40, vol = 8, drift = 0.4) => {
  let v = base;
  return Array.from({ length: n }, () => (v += (rnd() - 0.5) * vol * 2 + drift));
};

const REV = [4, 6, 5, 9, 7, 8, 11, 9, 13, 12, 15, 14, 16, 15, 18];
const spark = (p) => R(h(Sparkline, p));
const bar = (p) => R(h(SparkBar, p));
const delta = (p) => R(h(Delta, p));
const bullet = (p) => R(h(Bullet, p));
const grid = (p) => R(h(ActivityGrid, p));

// ---- hero ----
const hero = spark({
  data: REV,
  curve: "smooth",
  fill: true,
  width: 200,
  height: 52,
  dots: "auto",
  summary: false,
});

// ---- four contexts ----
const ctxSentence = spark({ data: REV, width: 88, height: 22, summary: false });
const ctxTab = spark({ data: REV, width: 52, height: 14, dots: "none", summary: false });
const ctxCardSpark = spark({
  data: REV,
  curve: "smooth",
  fill: true,
  width: 160,
  height: 40,
  summary: false,
});

// ---- chart showcase blocks ----
function showcase(name, footprint, blurb, big, variants, summaryText) {
  const chips = variants
    .map(
      (v) =>
        `<figure class="var"><div class="varart">${v.svg}</div><figcaption>${v.label}</figcaption></figure>`,
    )
    .join("");
  return `<article class="chart">
    <header class="chart-h">
      <div><span class="eyebrow">${footprint}</span><h3>${name}</h3></div>
      <p class="blurb">${blurb}</p>
    </header>
    <div class="chart-big">${big}</div>
    <div class="vars">${chips}</div>
    ${summaryText ? `<p class="summary"><span class="eyebrow">auto summary</span> ${summaryText}</p>` : ""}
  </article>`;
}

const sparkShow = showcase(
  "Sparkline",
  "60×16 · S1",
  "The load-bearing default. Line, smooth, step, area; normal-range band; endpoint and min/max dots; direct labels.",
  spark({
    data: REV,
    curve: "smooth",
    width: 260,
    height: 60,
    label: "last",
    dots: "minmax",
    summary: false,
  }),
  [
    { label: "linear", svg: spark({ data: REV, width: 96, height: 26, summary: false }) },
    {
      label: "smooth",
      svg: spark({ data: REV, curve: "smooth", width: 96, height: 26, summary: false }),
    },
    {
      label: "step",
      svg: spark({ data: REV, curve: "step", width: 96, height: 26, summary: false }),
    },
    { label: "area", svg: spark({ data: REV, fill: true, width: 96, height: 26, summary: false }) },
    {
      label: "band",
      svg: spark({ data: REV, band: [7, 15], width: 96, height: 26, summary: false }),
    },
    {
      label: "min/max",
      svg: spark({ data: REV, dots: "minmax", width: 96, height: 26, summary: false }),
    },
  ],
  describeSeries(REV),
);

const WL = [1, 1, -1, 1, -1, 1, 1, 1, -1, 1, -1, 1, 1, -1, 1, 1];
const BARS = [3, 5, 4, 7, 6, 9, 8, 11, 9, 12, 10, 13];
const barShow = showcase(
  "SparkBar",
  "60×12 · S1",
  "Discrete periods as bars, anchored at zero. Win-loss collapses magnitude to a binary streak; negatives take the down color.",
  bar({ data: BARS, width: 260, height: 56, label: "last", summary: false }),
  [
    { label: "bars", svg: bar({ data: BARS, width: 96, height: 26, summary: false }) },
    {
      label: "with negatives",
      svg: bar({ data: [4, 6, -3, 5, -2, 7, 8, -1, 6], width: 96, height: 26, summary: false }),
    },
    {
      label: "win / loss",
      svg: bar({ data: WL, mode: "winloss", width: 96, height: 26, summary: false }),
    },
  ],
  describeSeries(BARS),
);

const deltaShow = `<article class="chart">
  <header class="chart-h"><div><span class="eyebrow">50×14 · S4</span><h3>Delta</h3></div>
  <p class="blurb">The SaaS KPI atom: a direction glyph paired with a signed value. Direction is double-encoded — triangle shape and color — never color alone.</p></header>
  <div class="chart-big deltas">
    <span class="big-delta">${delta({ value: 0.124 })}</span>
    <span class="big-delta">${delta({ value: -0.031 })}</span>
    <span class="big-delta">${delta({ value: 0 })}</span>
    <span class="big-delta">${delta({ value: -0.08, positive: "down" })}<em>latency, down is good</em></span>
  </div>
  <div class="vars">
    <figure class="var"><div class="varart">${delta({ value: 120, from: 100 })}</div><figcaption>from → to</figcaption></figure>
    <figure class="var"><div class="varart">${delta({ value: 1500, format: { style: "currency", currency: "USD", maximumFractionDigits: 0 } })}</div><figcaption>currency</figcaption></figure>
  </div>
  <p class="summary"><span class="eyebrow">auto summary</span> Up 12.4%. · Down 3.1%. · No change.</p>
</article>`;

const bulletShow = showcase(
  "Bullet",
  "80×16 · S4",
  "Few's gauge replacement: a measure bar against qualitative bands with a target tick. Ships instead of a speedometer.",
  bullet({ value: 72, target: 80, bands: [50, 75], domain: [0, 100], width: 260, height: 34 }),
  [
    {
      label: "on target",
      svg: bullet({
        value: 88,
        target: 80,
        bands: [50, 75],
        domain: [0, 100],
        width: 120,
        height: 22,
      }),
    },
    {
      label: "below",
      svg: bullet({
        value: 41,
        target: 80,
        bands: [50, 75],
        domain: [0, 100],
        width: 120,
        height: 22,
      }),
    },
    {
      label: "no bands",
      svg: bullet({ value: 60, target: 90, domain: [0, 100], width: 120, height: 22 }),
    },
  ],
  "72 of 80 target.",
);

const ACT = Array.from({ length: 119 }, (_, i) =>
  Math.max(0, Math.round((Math.sin(i / 5) + 1) * 3 + (rnd() - 0.3) * 4)),
);
const gridShow = showcase(
  "ActivityGrid",
  "7×N · S1",
  "The contribution calendar — proof that color encodes a binned variable. Discrete levels, never a continuous illusion. Grid or single strip.",
  grid({ data: ACT, cell: 12, gap: 3, summary: false }),
  [
    {
      label: "strip",
      svg: grid({ data: ACT.slice(0, 40), layout: "strip", cell: 9, gap: 2, summary: false }),
    },
  ],
  `Total ${ACT.reduce((a, b) => a + b, 0)} over ${ACT.length} periods. Busiest ${Math.max(...ACT)}.`,
);

// ---- density table (shared scale) ----
const ROWS = 60;
const rowsData = Array.from({ length: ROWS }, (_, i) => {
  const s = series(16, 30 + rnd() * 40, 6 + rnd() * 6, (rnd() - 0.45) * 1.4);
  return { name: `svc-${String(i + 1).padStart(2, "0")}`, s };
});
const domainAll = [
  Math.min(...rowsData.flatMap((r) => r.s)),
  Math.max(...rowsData.flatMap((r) => r.s)),
];
const tableRows = rowsData
  .map((r) => {
    const first = r.s[0],
      last = r.s.at(-1);
    const d = (last - first) / Math.abs(first);
    const tgt = 70;
    return `<tr>
      <td class="mono">${r.name}</td>
      <td class="tspark">${spark({ data: r.s, domain: domainAll, width: 120, height: 22, summary: false })}</td>
      <td class="tnum">${last.toFixed(0)}</td>
      <td class="tdelta">${delta({ value: d, summary: false })}</td>
      <td class="tbullet">${bullet({ value: last, target: tgt, domain: domainAll, width: 90, height: 14, summary: false })}</td>
    </tr>`;
  })
  .join("");

// ---- interactive featured sparkline (vanilla JS crosshair) ----
const LIVE = series(40, 50, 9, 0.2).map((v) => Math.round(v));
const liveW = 640,
  liveH = 120,
  livePad = 6;
const lmin = Math.min(...LIVE),
  lmax = Math.max(...LIVE),
  lspan = lmax - lmin || 1;
const lpts = LIVE.map((v, i) => [
  +(livePad + (i * (liveW - livePad * 2)) / (LIVE.length - 1)).toFixed(2),
  +(liveH - livePad - ((v - lmin) / lspan) * (liveH - livePad * 2)).toFixed(2),
]);
const livePath = "M" + lpts.map((p) => p.join(" ")).join(" L");
const liveArea = `M${lpts[0][0]} ${liveH - livePad} L${lpts.map((p) => p.join(" ")).join(" L")} L${lpts.at(-1)[0]} ${liveH - livePad} Z`;

const receipts = JSON.parse(readFileSync(new URL("./results.json", import.meta.url), "utf8"));
const sizes = [
  ["sparkline", "2.67 kB", "line/smooth/step, area, band, dots, label, auto-summary"],
  ["sparkline/interactive", "3.03 kB", "hover + keyboard nav + live region"],
  ["sparkbar", "2.21 kB", "bars + win-loss"],
  ["delta", "0.78 kB", "glyph + signed value"],
  ["bullet", "1.44 kB", "measure + target + bands"],
  ["activity-grid", "1.56 kB", "intensity calendar"],
  ["styles.css", "0.9 kB", "one shared stylesheet, whole library"],
];

const body = `
<div id="app" data-mc-theme="light">
<header class="masthead">
  <div class="brand">
    <span class="wordmark">microcharts</span>
    <span class="tag">word-sized charts for react</span>
  </div>
  <button id="theme" type="button" aria-pressed="false">dark</button>
</header>

<section class="hero">
  <p class="kicker">the proving five · phase 2</p>
  <h1>Charts that live <em>inside a sentence.</em> Weekly revenue ${hero} is up 300% since spring.</h1>
  <ul class="receipts-inline">
    <li><b>0</b> runtime dependencies</li>
    <li><b>0.78–3&nbsp;kB</b> per chart, gzipped</li>
    <li><b>5.3&nbsp;ms</b> to render 500 rows server-side</li>
    <li><b>accessible</b> by default — every chart narrates itself</li>
  </ul>
</section>

<section class="contexts">
  <span class="eyebrow">one component, four contexts</span>
  <div class="ctx-grid">
    <div class="ctx"><p>Traffic held steady ${ctxSentence} through the migration, then climbed.</p><span class="ctx-l">in a sentence</span></div>
    <div class="ctx"><table class="mini"><tr><td class="mono">acme</td><td>${ctxSentence}</td><td class="tnum">$4.2k</td></tr><tr><td class="mono">globex</td><td>${spark({ data: [12, 10, 11, 8, 9, 7, 8, 6, 7, 5], width: 88, height: 22, color: "var(--mc-negative)", summary: false })}</td><td class="tnum">$1.1k</td></tr></table><span class="ctx-l">in a table</span></div>
    <div class="ctx"><div class="kpi"><span class="kpi-l">MRR</span><span class="kpi-v">$48,210</span><span class="kpi-d">${delta({ value: 0.124, summary: false })}</span>${ctxCardSpark}</div><span class="ctx-l">in a KPI card</span></div>
    <div class="ctx"><div class="tabs"><span class="tab on">Traffic ${ctxTab}</span><span class="tab">Revenue</span><span class="tab">Errors</span></div><span class="ctx-l">in a tab header</span></div>
  </div>
</section>

<section class="showcases">
  <span class="eyebrow">the catalog</span>
  ${sparkShow}
  ${barShow}
  ${deltaShow}
  ${bulletShow}
  ${gridShow}
</section>

<section class="live">
  <span class="eyebrow">interactive entry · hover or focus</span>
  <h2>The same chart, one <code>/interactive</code> import away.</h2>
  <p class="live-sub">Static by default — zero client JS. Opt in and it gains pointer + keyboard navigation with a live-announced readout. Move across the chart:</p>
  <div class="live-wrap" id="live" tabindex="0" role="img" aria-label="${describeSeries(LIVE)}">
    <svg class="mc-root" viewBox="0 0 ${liveW} ${liveH}" width="100%" height="${liveH}" preserveAspectRatio="none" data-points='${JSON.stringify(lpts)}' data-values='${JSON.stringify(LIVE)}'>
      <path d="${liveArea}" data-mc-ink="fill"></path>
      <path d="${livePath}" data-mc-ink="data" vector-effect="non-scaling-stroke"></path>
      <line id="live-x" x1="0" y1="${livePad}" x2="0" y2="${liveH - livePad}" data-mc-ink="muted" vector-effect="non-scaling-stroke" style="display:none"></line>
      <circle id="live-dot" r="4" data-mc-ink="accent" style="display:none"></circle>
    </svg>
    <span id="live-read" class="live-read"></span>
  </div>
</section>

<section class="density">
  <span class="eyebrow">${ROWS} rows · one shared scale</span>
  <h2>Dense by design. <em>Comparable</em> by default.</h2>
  <p class="live-sub">Every row shares one domain via <code>SparkGroup</code> — so a tall line means a big number, not a small range zoomed in. This kills the #1 sparkline bug.</p>
  <div class="table-scroll">
    <table class="dense">
      <thead><tr><th>service</th><th>trend (shared scale)</th><th class="tnum">now</th><th>Δ 30d</th><th>vs target</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
</section>

<section class="receipts">
  <div class="rcol">
    <span class="eyebrow">size · gzipped, tree-shaken</span>
    <table class="rtable"><tbody>${sizes.map(([n, s, d]) => `<tr><td class="mono">${n}</td><td class="tnum b">${s}</td><td class="rdesc">${d}</td></tr>`).join("")}</tbody></table>
  </div>
  <div class="rcol">
    <span class="eyebrow">performance · node ${receipts.node}, reproducible from bench/</span>
    <table class="rtable"><tbody>
      ${receipts.core.map((c) => `<tr><td class="mono">${c.label}</td><td class="tnum b">${c.opsPerSec.toLocaleString()}</td><td class="rdesc">ops / sec</td></tr>`).join("")}
      ${receipts.scenarios.map((s) => `<tr><td class="mono">${s.count} sparklines → SVG</td><td class="tnum b">${s.ms} ms</td><td class="rdesc">${s.msPer} ms/row · ~${s.avgBytes} B</td></tr>`).join("")}
    </tbody></table>
  </div>
</section>

<footer class="foot">
  <span>microcharts · @microcharts/react</span>
  <span class="mono">every chart above is the real built component, server-rendered to SVG</span>
</footer>
</div>
`;

const demoCss = `
:root{ color-scheme: light dark; }
#app{
  --paper:#FBFBFA; --ink:#16161A; --dim:#6B6B6E; --line:#E4E3DE; --panel:#fff; --code:#F3F2EE;
  /* pin the library light tokens so OS dark-mode never bleeds into the frame */
  --mc-stroke:#171717; --mc-positive:#009E73; --mc-negative:#D55E00; --mc-accent:#0072B2; --mc-neutral:#8A8A8A;
  --mc-band:color-mix(in oklab, var(--mc-stroke) 8%, transparent);
  --mc-stroke-width:1.5; --mc-label-size:11px; --mc-font:inherit;
  background:var(--paper); color:var(--ink);
  font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;
  max-width:1100px; margin:0 auto; padding:clamp(20px,4vw,56px);
  -webkit-font-smoothing:antialiased;
}
#app[data-mc-theme="dark"]{
  --paper:#0E0E10; --ink:#EDEDED; --dim:#9A9A9E; --line:#26262A; --panel:#161619; --code:#1B1B1F;
  --mc-stroke:#EDEDED; --mc-positive:#2DD4A7; --mc-negative:#FF8A4C; --mc-accent:#4CC2FF; --mc-neutral:#9A9A9A;
}
#app *{ box-sizing:border-box; }
.mono,.eyebrow,.tnum,.kicker,.tag,.ctx-l,.rdesc,.kpi-l{ font-family:ui-monospace,"SF Mono",Menlo,monospace; }
.tnum,.tspark,.dense td,.mini td{ font-variant-numeric:tabular-nums; }
.eyebrow{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--dim); }

.masthead{ display:flex; justify-content:space-between; align-items:baseline; padding-bottom:20px; border-bottom:1px solid var(--line); }
.wordmark{ font-weight:640; letter-spacing:-.02em; font-size:19px; }
.tag{ margin-left:12px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--dim); }
#theme{ font-family:ui-monospace,monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--ink); background:transparent; border:1px solid var(--line); border-radius:6px; padding:6px 14px; cursor:pointer; }
#theme:hover{ border-color:var(--mc-accent); color:var(--mc-accent); }
#theme:focus-visible{ outline:2px solid var(--mc-accent); outline-offset:2px; }

.hero{ padding:52px 0 40px; border-bottom:1px solid var(--line); }
.kicker{ font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--mc-accent); margin:0 0 20px; }
.hero h1{ font-size:clamp(26px,3.6vw,42px); line-height:1.24; font-weight:600; letter-spacing:-.02em; text-wrap:balance; margin:0; max-width:20ch; }
.hero h1 em{ font-style:normal; color:var(--dim); }
.hero h1 svg{ vertical-align:-6px; margin:0 4px; }
.receipts-inline{ list-style:none; display:flex; flex-wrap:wrap; gap:10px 28px; padding:0; margin:34px 0 0; font-size:13.5px; color:var(--dim); }
.receipts-inline b{ color:var(--ink); font-weight:600; }

section{ padding:44px 0; border-bottom:1px solid var(--line); }
h2{ font-size:clamp(20px,2.4vw,27px); font-weight:600; letter-spacing:-.015em; margin:14px 0 8px; text-wrap:balance; }
h2 em{ font-style:normal; color:var(--mc-accent); }
code{ font-family:ui-monospace,monospace; font-size:.86em; background:var(--code); padding:1px 6px; border-radius:4px; }

.ctx-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:18px; margin-top:22px; }
.ctx{ background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:20px; display:flex; flex-direction:column; justify-content:space-between; gap:18px; min-height:140px; }
.ctx>p{ margin:0; font-size:15px; }
.ctx svg{ vertical-align:-4px; }
.ctx-l{ font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--dim); }
.mini{ border-collapse:collapse; width:100%; } .mini td{ padding:5px 8px; border-bottom:1px solid var(--line); font-size:13px; }
.mini td:last-child,.tnum{ text-align:right; }
.kpi{ display:grid; grid-template-columns:1fr auto; align-items:baseline; gap:2px 8px; }
.kpi-l{ font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--dim); }
.kpi-v{ font-size:27px; font-weight:640; letter-spacing:-.02em; }
.kpi-d{ font-size:13px; }
.kpi>svg{ grid-column:1/-1; margin-top:6px; }
.tabs{ display:flex; gap:6px; } .tab{ font-size:12px; padding:6px 10px; border-radius:6px; color:var(--dim); } .tab.on{ background:var(--code); color:var(--ink); } .tab svg{ vertical-align:-3px; margin-left:2px; }

.chart{ padding:30px 0; border-top:1px solid var(--line); display:grid; grid-template-columns:1fr; gap:20px; }
.chart:first-of-type{ border-top:none; }
.chart-h{ display:flex; flex-wrap:wrap; gap:6px 28px; align-items:baseline; }
.chart-h h3{ font-size:21px; font-weight:600; letter-spacing:-.01em; margin:4px 0 0; }
.blurb{ margin:0; color:var(--dim); font-size:14px; max-width:56ch; flex:1 1 320px; }
.chart-big{ background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:28px 30px; display:flex; align-items:center; min-height:96px; }
.chart-big svg{ overflow:visible; }
.deltas{ gap:34px; flex-wrap:wrap; } .big-delta{ font-size:23px; display:inline-flex; align-items:center; gap:12px; } .big-delta em{ font-style:normal; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--dim); font-family:ui-monospace,monospace; }
.vars{ display:flex; flex-wrap:wrap; gap:14px; }
.var{ margin:0; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:12px 14px 8px; display:flex; flex-direction:column; gap:8px; align-items:flex-start; }
.varart{ display:flex; align-items:center; } .varart svg{ overflow:visible; }
.var figcaption{ font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:var(--dim); font-family:ui-monospace,monospace; }
.summary{ margin:0; font-size:13.5px; color:var(--ink); background:var(--code); border-radius:8px; padding:12px 16px; max-width:70ch; }
.summary .eyebrow{ margin-right:10px; }

.live h2{ margin-top:14px; } .live-sub{ color:var(--dim); font-size:14px; max-width:64ch; margin:0 0 22px; }
.live-wrap{ position:relative; background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px 8px; cursor:crosshair; }
.live-wrap:focus-visible{ outline:2px solid var(--mc-accent); outline-offset:3px; }
.live-read{ position:absolute; top:10px; left:12px; font-family:ui-monospace,monospace; font-size:12px; letter-spacing:.05em; color:var(--dim); }
.live-read b{ color:var(--mc-accent); }

.density h2{ margin-top:14px; }
.table-scroll{ margin-top:22px; max-height:420px; overflow:auto; border:1px solid var(--line); border-radius:10px; }
.dense{ border-collapse:collapse; width:100%; font-size:13px; }
.dense thead th{ position:sticky; top:0; background:var(--panel); text-align:left; font-family:ui-monospace,monospace; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--dim); padding:12px 16px; border-bottom:1px solid var(--line); z-index:1; }
.dense th.tnum{ text-align:right; }
.dense td{ padding:8px 16px; border-bottom:1px solid var(--line); }
.dense tr:last-child td{ border-bottom:none; }
.dense tbody tr:hover{ background:var(--code); }
.tspark svg,.tbullet svg{ display:block; } .tdelta svg{ vertical-align:-3px; }
.tdelta .mc-delta{ font-size:12.5px; }

.receipts{ display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:34px; }
.rcol{ display:flex; flex-direction:column; gap:14px; }
.rtable{ border-collapse:collapse; width:100%; font-size:13px; }
.rtable td{ padding:9px 4px; border-bottom:1px solid var(--line); vertical-align:baseline; }
.rtable .b{ font-weight:640; } .rtable .tnum{ text-align:right; white-space:nowrap; padding-right:16px; }
.rdesc{ color:var(--dim); font-size:11.5px; }

.foot{ display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:26px 0 0; border-bottom:none; font-size:11.5px; color:var(--dim); }

@media (prefers-reduced-motion:no-preference){ .ctx,.chart-big,.var{ transition:border-color .2s; } }
@media (max-width:640px){ .hero h1{ font-size:24px; } .receipts{ gap:22px; } }
`;

const page = `<style>${css}\n${demoCss}</style>\n${body}\n<script>${clientJs()}</script>`;
writeFileSync(out, page);
console.log("wrote", out, (page.length / 1024).toFixed(0) + "kb");

function clientJs() {
  return `
(function(){
  var app=document.getElementById('app'), btn=document.getElementById('theme');
  btn.addEventListener('click',function(){
    var dark=app.getAttribute('data-mc-theme')==='dark';
    app.setAttribute('data-mc-theme',dark?'light':'dark');
    btn.textContent=dark?'dark':'light'; btn.setAttribute('aria-pressed',String(!dark));
  });
  var wrap=document.getElementById('live'), svg=wrap.querySelector('svg');
  var pts=JSON.parse(svg.getAttribute('data-points')), vals=JSON.parse(svg.getAttribute('data-values'));
  var vb=svg.viewBox.baseVal, xline=document.getElementById('live-x'), dot=document.getElementById('live-dot'), read=document.getElementById('live-read');
  var active=-1;
  function show(i){ if(i<0||i>=pts.length){hide();return;} active=i; var p=pts[i];
    xline.setAttribute('x1',p[0]); xline.setAttribute('x2',p[0]); xline.style.display='';
    dot.setAttribute('cx',p[0]); dot.setAttribute('cy',p[1]); dot.style.display='';
    read.innerHTML='point '+(i+1)+' / '+pts.length+' &nbsp; <b>'+vals[i]+'</b>';
  }
  function hide(){ active=-1; xline.style.display='none'; dot.style.display='none'; read.textContent=''; }
  function fromEvent(e){ var r=svg.getBoundingClientRect(); var x=(e.clientX-r.left)/r.width*vb.width;
    var best=0,bd=1e9; for(var i=0;i<pts.length;i++){var d=Math.abs(pts[i][0]-x); if(d<bd){bd=d;best=i;}} show(best); }
  svg.addEventListener('pointermove',fromEvent);
  wrap.addEventListener('pointerleave',hide);
  wrap.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){show(Math.min(pts.length-1,(active<0?-1:active)+1));e.preventDefault();}
    else if(e.key==='ArrowLeft'){show(Math.max(0,(active<0?1:active)-1));e.preventDefault();}
    else if(e.key==='Home'){show(0);e.preventDefault();}
    else if(e.key==='End'){show(pts.length-1);e.preventDefault();}
    else if(e.key==='Escape'){hide();}
  });
  wrap.addEventListener('blur',hide);
})();
`;
}
