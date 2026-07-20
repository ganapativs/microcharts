// Readable floor per chart: the smallest box at which a chart still renders
// without text overlapping text, text colliding with marks, or ink escaping the
// viewBox.
//
// The craft gate (matrix.mjs) runs each chart only at its OWN authored sizes,
// so a chart that turns to mush below them passes. That is how a Dumbbell ends
// up stacking "Paris/Berlin/Rome" on top of each other in a tab header, and a
// Thermometer renders as a squashed blob. A word-sized chart library has to
// degrade — drop the labels, simplify the mark — not overlap.
//
// This walks a descending ladder and reports, per chart, the smallest CLEAN
// size. Two things it makes visible:
//   - a chart whose floor is ABOVE its own default size is broken out of the box
//   - a docs example rendered below a chart's floor is a bad example
import { audit, render } from "./audit.mjs";
import { geometryAudit } from "./geometry-audit.mjs";
import { CASES } from "./cases.mjs";
import { ALLOWED } from "./allowed.mjs";

const D = (s) => import(`../../dist/charts/${s}/index.js`);

/** Descending ladder, widest→narrowest, keeping each chart's own aspect. */
const SCALES = [1, 0.85, 0.7, 0.6, 0.5, 0.42, 0.35, 0.3, 0.25, 0.2];

const rows = [];
for (const c of CASES) {
  const M = await D(c.slug);
  const Comp = M[c.comp];
  if (!Comp) continue;
  // Largest authored size is the reference box; scale down from there.
  const sizes = c.sizes.filter(([w]) => w !== 999);
  if (!sizes.length) continue;
  const [bw, bh] = sizes[sizes.length - 1];

  let floor = null;
  let firstBad = null;
  for (const s of SCALES) {
    const w = Math.round(bw * s);
    const h = Math.round(bh * s);
    if (w < 8 || h < 5) break;
    let clean = true;
    let why = "";
    for (const v of c.variants) {
      let issues;
      try {
        const svg = render(Comp, { ...v, width: w, height: h });
        const label = `${c.slug} @${w}x${h}`;
        issues = [...audit(label, svg), ...geometryAudit(label, svg)].filter((i) => !ALLOWED(i));
      } catch (e) {
        issues = [`${c.slug}: THREW ${e.message}`];
      }
      if (issues.length) {
        clean = false;
        why = issues[0];
        break;
      }
    }
    if (clean) floor = [w, h, s];
    else {
      firstBad ??= [w, h, why];
      break; // ladder is monotone enough: once it breaks it stays broken
    }
  }
  rows.push({ slug: c.slug, base: [bw, bh], floor, firstBad });
}

const broken = rows.filter((r) => r.firstBad);
console.log(`=== READABLE FLOOR (${rows.length} charts, ${broken.length} degrade badly) ===`);
for (const r of broken.sort((a, b) => (b.floor?.[2] ?? 1) - (a.floor?.[2] ?? 1))) {
  const f = r.floor
    ? `${r.floor[0]}x${r.floor[1]} (${Math.round(r.floor[2] * 100)}% of base)`
    : "NEVER CLEAN";
  console.log(
    `${r.slug}: base ${r.base[0]}x${r.base[1]} · floor ${f} · breaks at ${r.firstBad[0]}x${r.firstBad[1]}`,
  );
  console.log(`    ${r.firstBad[2].slice(0, 150)}`);
}

// The contract this GATES (pnpm floor, in CI): every chart stays clean down to
// at least half its default size — a chart that overlaps or spills a label in
// ordinary use (a tab header, a table cell) is a bug. Extreme sub-half rungs are
// still reported above but not gated: they probe how far degradation reaches,
// not a promise. Today every chart is clean well past this line.
const FLOOR_FRACTION = 0.5;
const failing = broken.filter((r) => !r.floor || r.floor[2] > FLOOR_FRACTION);
if (failing.length) {
  console.log(
    `\n${failing.length} chart(s) break above ${FLOOR_FRACTION * 100}% of base — not usable at ordinary sizes:`,
  );
  for (const r of failing) console.log(`  ${r.slug} breaks at ${r.firstBad[0]}x${r.firstBad[1]}`);
  process.exit(1);
}
