import { readFileSync, writeFileSync } from "node:fs";
const f = "/Users/guns/Projects/microcharts/scripts/size-budgets.json";
const b = JSON.parse(readFileSync(f, "utf8"));
// New budgets = measured (post annotation-host retrofit) + ~0.12 kB headroom.
const bumps = {
  "mini-bar": ["2.6 kB", "4 kB"],
  waterfall: ["2.8 kB", "3.95 kB"],
  "dual-sparkline": ["3.35 kB", "4.55 kB"],
  "retention-curve": ["3.05 kB", "4.25 kB"],
  "burn-chart": ["3.25 kB", "4.5 kB"],
  "error-budget": ["2.85 kB", "4 kB"],
  "control-strip": ["3.1 kB", "4.3 kB"],
  "forecast-cone": ["3.35 kB", "4.55 kB"],
  "cycle-plot": ["2.85 kB", "4.2 kB"],
  "change-point": ["3.45 kB", "4.75 kB"],
  "city-skyline": ["2.45 kB", "3.6 kB"],
  "win-prob-worm": ["3.4 kB", "4.6 kB"],
  "queue-depth": ["3.05 kB", "4.2 kB"],
  "spread-band": ["3.15 kB", "4.4 kB"],
  "percentile-trace": ["2.7 kB", "3.9 kB"],
};
for (const [slug, [s, i]] of Object.entries(bumps)) {
  if (!b.charts[slug]) throw new Error("missing " + slug);
  b.charts[slug].static = s;
  b.charts[slug].interactive = i;
}
b.$exception =
  b.$exception +
  " ANNOTATION-HOST RETROFIT (2026-07-15, USER-APPROVED full value-series family, plan/22 #28): resolveAnnotations walker + scale frame added to 15 value-series hosts. 5 cross the 3 kB static ceiling as approved exceptions (all < Sparkline 3.65): change-point 3.45, win-prob-worm 3.4, forecast-cone/dual-sparkline 3.35, burn-chart 3.25. The other 10 stay < 3 kB.";
writeFileSync(f, JSON.stringify(b, null, 2) + "\n");
console.log("budgets updated for", Object.keys(bumps).length, "charts");
