// Craft gate (pnpm craft): renders every chart × every label combination ×
// several sizes against dist/ and fails on text escapes, text-text overlap,
// or text-on-mark collisions. Run after `pnpm build`. Adding a chart type?
// Add its variants to cases.mjs IN THE SAME PR.
import { audit, render } from "./audit.mjs";
import { geometryAudit } from "./geometry-audit.mjs";
import { CASES, WAVE } from "./cases.mjs";
const D = (s) => import(`../../dist/charts/${s}/index.js`);
import { ALLOWED } from "./allowed.mjs";

let total = 0,
  bad = 0;
const problems = [];
for (const c of CASES) {
  const M = await D(c.slug);
  const Comp = M[c.comp];
  for (const v of c.variants) {
    for (const [w, hgt] of c.sizes) {
      const props = { ...v };
      if (w !== 999) {
        props.width = w;
        props.height = hgt;
      }
      total++;
      try {
        const label = `${c.slug} ${JSON.stringify(v).slice(0, 50)} @${w === 999 ? "default" : w + "x" + hgt}`;
        const svg = render(Comp, props);
        const issues = [...audit(label, svg), ...geometryAudit(label, svg)];
        const real = issues.filter((i) => !ALLOWED(i));
        if (real.length) {
          bad++;
          problems.push(...real);
        }
      } catch (e) {
        bad++;
        problems.push(`${c.slug}: RENDER ERROR ${e.message}`);
      }
    }
  }
}

// annotations text (Threshold/Marker/Callout labels on a Sparkline host)
{
  const { Sparkline } = await import("../../dist/charts/sparkline/index.js");
  const A = await import("../../dist/annotations.js");
  const { createElement: hh } = await import("react");
  for (const [w, hgt] of [
    [60, 16],
    [120, 24],
    [220, 32],
  ]) {
    total++;
    const html = render(Sparkline, {
      data: WAVE,
      width: w,
      height: hgt,
      children: [
        hh(A.Threshold, { key: "t", y: 16, label: "SLA" }),
        hh(A.Marker, { key: "m", x: 3, label: "launch" }),
        hh(A.Callout, { key: "c", x: 9, label: "peak" }),
        hh(A.TargetZone, { key: "z", y: [13, 15], label: "goal" }),
      ],
    });
    const issues = audit(`sparkline+annotations @${w}x${hgt}`, html).filter((i) => !ALLOWED(i));
    if (issues.length) {
      bad++;
      problems.push(...issues);
    }
  }
}
{
  const { HeatCell } = await import("../../dist/charts/heat-cell/index.js");
  total++;
  const issues = audit(
    "heat-cell value label",
    render(HeatCell, { value: 72, domain: [0, 100], label: "value" }),
  );
  // in-cell value label is by-design ON the cell — only escapes/text-text count
  const real = issues.filter((i) => !i.includes("TEXT-ON-MARK"));
  if (real.length) {
    bad++;
    problems.push(...real);
  }
}
console.log(`${total} configs, ${bad} with issues`);

console.log(problems.join("\n"));
// Exit non-zero so this is a gate, not a report: run in CI it would otherwise
// print collisions and pass.
if (bad) process.exit(1);
