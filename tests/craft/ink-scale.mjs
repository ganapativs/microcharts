// Scale-invariant ink gate (pnpm ink-scale, in CI).
//
// The contract: a stroke sized from `--mc-sw` is INK and must hold its visual
// weight at any render scale; a stroke sized from viewBox geometry is a MARK
// and must scale with the box. Charts used to spell `vector-effect` per mark,
// and 39 of them missed at least one — 14 pinned some marks and not others, so
// one chart could hold a hairline on its data line while its own baseline
// thickened. At 240px wide that ran from 1.5px to 22.5px across the catalog,
// which is the "some lines thin, some thick" reading on the gallery grid.
//
// styles.css now pins ink by width SOURCE, so this walks the rendered SVG of
// every chart and fails if a token-width stroke would not be matched by that
// rule. Run after `pnpm build`.
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { CASES } from "./cases.mjs";

const D = (s) => import(`../../dist/charts/${s}/index.js`);

/** Ink roles styles.css gives a token stroke-width, on any shape. */
const TOKEN_INK = ["data", "muted", "unit-off", "gap"];
/** Ink roles that stroke only on an open shape (on a closed one they fill). */
const OPEN_INK = ["accent", "positive", "negative", "ghost", "flag"];
const OPEN = ["path", "line", "polyline"];

/** The three marks whose stroke-width IS the encoding, exempt by design.
 *  Adding to this list is a design decision: it means the mark grows with the
 *  box on purpose. See the matching `vector-effect: none` rule in styles.css. */
const GEOMETRY_MARKS = ["mc-donut-wedge", "mc-ring-halo"];
const GEOMETRY_SLUGS = { "progress-ring": 'path[data-mc-ink="accent"]' };

const attr = (t, n) => (t.match(new RegExp(`${n}="([^"]*)"`)) || [])[1];

const problems = [];
let marks = 0;
for (const c of CASES) {
  let M;
  try {
    M = await D(c.slug);
  } catch (e) {
    problems.push(`${c.slug}: IMPORT FAILED ${e.message}`);
    continue;
  }
  const Comp = M[c.comp];
  if (!Comp) continue;
  for (const v of c.variants) {
    let html;
    try {
      html = renderToStaticMarkup(h(Comp, { ...v, summary: false }));
    } catch {
      continue; // render failures are the robust gate's business, not ours
    }
    for (const m of html.matchAll(
      /<(line|polyline|path|circle|ellipse|rect|polygon)\b[^>]*?\/?>/g,
    )) {
      const tag = m[0];
      const shape = m[1];
      const cls = attr(tag, "class") ?? "";
      const ink = attr(tag, "data-mc-ink");
      const hasW = /data-mc-w="/.test(tag);
      const sw = (tag.match(/stroke-width:\s*([^;"]+)/) ||
        tag.match(/stroke-width="([^"]+)"/) ||
        [])[1];
      const width = sw?.trim();
      if (width === "0") continue; // paints no stroke

      // A width the browser resolves from the token, via attribute or inline.
      const tokenWidth = hasW || (width ? /var\(--mc-sw\)/.test(width) : false);
      // A width that is a bare viewBox number — geometry, exempt by contract.
      const geometryWidth = width ? /^[\d.]+$/.test(width) : false;

      const roleStrokes =
        (ink && TOKEN_INK.includes(ink)) || (ink && OPEN_INK.includes(ink) && OPEN.includes(shape));
      if (!tokenWidth && !roleStrokes) continue; // fill-only mark, or geometry
      if (geometryWidth && !tokenWidth) continue; // stroke-width IS the mark

      marks++;
      const exemptClass = GEOMETRY_MARKS.some((k) => cls.split(/\s+/).includes(k));
      if (exemptClass) continue;
      if (GEOMETRY_SLUGS[c.slug] && geometryWidth) continue;

      // Matched by the styles.css pin rule?
      const pinned =
        hasW ||
        (ink && TOKEN_INK.includes(ink)) ||
        (ink && OPEN_INK.includes(ink) && OPEN.includes(shape)) ||
        /vector-effect="non-scaling-stroke"/.test(tag);
      if (!pinned) {
        problems.push(
          `${c.slug}: token-width stroke on <${shape}> is not pinned — ink="${ink ?? "-"}" width="${width ?? "-"}" — give it a data-mc-w step or an ink role, or exempt it deliberately.`,
        );
      }
    }
  }
}

console.log(`${marks} token-width strokes checked, ${problems.length} unpinned`);
for (const p of new Set(problems)) console.log("  " + p);
if (problems.length) process.exit(1);
