import { CHARTS, getModule } from "@/lib/charts/registry";
import { CHART_GZIP } from "@/lib/stats";
import { SpecimenLattice, type SpecimenItem } from "./specimen-lattice";

/**
 * The specimen sheet: every chart in the catalog, printed once, in catalog order.
 *
 * The glyphs are the registry's own `Mark` components at one box size, rendered
 * on the server — so this whole sheet ships as SVG with no chart JavaScript
 * behind it.
 *
 * Every figure a cell shows is measured: sizes come from `chart-sizes.json`
 * (gzip, produced by `pnpm build && node scripts/sync-sizes.mjs`). Each cell links
 * to that chart's own reference page, which is where its import line lives.
 */
/* The drawn box. Wider than it was: with the cell's ruling and its second line of
   mono gone, the mark is the only ink left in the cell, and at 84×24 it sat in
   the middle of a column it no longer filled. */
const BOX_W = 96;
const BOX_H = 26;

export function GlyphSpecimen() {
  const stable = CHARTS.filter((c) => c.status === "stable");

  const items: SpecimenItem[] = stable.map((c) => {
    const gzip = CHART_GZIP[c.slug];
    // Interactive where the chart has an interactive entry — that is the number
    // the reader is choosing to spend. `wind-barb` is static-only by design.
    const kb = gzip?.interactive ?? gzip?.static;
    return {
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      kb: kb === undefined ? "—" : `${kb.toFixed(2)} kB`,
      channel: c.encoding.channel,
      precision: c.encoding.precision,
    };
  });

  const marks = stable.map((c) => {
    const Mark = getModule(c.slug)?.Mark;
    return Mark ? <Mark key={c.slug} data={c.demo} width={BOX_W} height={BOX_H} /> : null;
  });

  return <SpecimenLattice items={items} marks={marks} />;
}
