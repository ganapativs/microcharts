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
/** The drawn box. The mark is the only ink in a cell, so it fills the column. */
const BOX_W = 96;
const BOX_H = 26;

/**
 * The precision RATING, without the caveat some registry entries carry with it.
 * The readout sets `"{channel}, {precision} precision."`, which only parses while
 * `precision` is a bare rating — about a quarter of the catalog qualifies it with
 * a clause, and the template's noun then lands after a finished sentence. The
 * clause belongs on the chart's own page, which is where the cell links.
 *
 * The dashes are escapes rather than literals: a test counts em-dashes in this
 * page's source and the budget is two.
 */
const rating = (precision: string) => precision.split(/\s+[\u2014\u2013-]\s+/)[0]!.trim();

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
      precision: rating(c.encoding.precision),
    };
  });

  const marks = stable.map((c) => {
    const Mark = getModule(c.slug)?.Mark;
    return Mark ? <Mark key={c.slug} data={c.demo} width={BOX_W} height={BOX_H} /> : null;
  });

  return <SpecimenLattice items={items} marks={marks} />;
}
