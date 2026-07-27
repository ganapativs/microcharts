import { Sparkline as PrintSparkline } from "@microcharts/react/sparkline";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { KpiCard } from "./kpi-card";
import { CHECKOUT_P95, SEARCH_P95 } from "./v3-data";

/**
 * Act I's second beat — the same component in four places, unchanged.
 *
 * All four frames plot `CHECKOUT_P95`, the same `<Sparkline curve="smooth">`, with
 * nothing changed but `width`/`height`. The brief asked for a scroll-scrubbed
 * sequence; it was built and cut, because it hijacked ~1,800px of scroll to swap
 * four small frames. All four now sit stacked and visible in one normal pass, so
 * the comparison is something you can look at rather than something you have to
 * scroll through.
 *
 * The first three frames are the INTERACTIVE entry — a screen has a pointer, and
 * "unchanged" is a stronger claim when the mark in a sentence, in a table cell and
 * on a card all scrub the same way. The fourth is the STATIC entry: it is a
 * printed sheet, and paper has no hover. That is the only difference between the
 * four, and it is a difference of surface, not of component.
 *
 * The fourth frame also inverts the surface — the act always ends on the opposite
 * stock — and the charts inside it re-derive their ink for that ground.
 */

// `.mc-inline-table` (global.css) is the site's chart-table reset: compact rows,
// `vertical-align: middle` on every cell so a mark centres against its digits, and
// flush first/last columns so the table's left edge lands on the page's own axis.
// A chart in a table CELL is not prose, so it takes no `.mc-inline` seat — that is
// the same split the current home page's placement quad makes.
const th = "pb-2.5 pt-2.5 text-left font-normal kicker border-b" as const;

export function FourPlaces() {
  return (
    <div className="u-block grid gap-9">
      {/* 1 — in a line of prose */}
      <figure>
        <figcaption className="kicker mb-3">in a line of prose</figcaption>
        <p className="lead" style={{ maxWidth: "var(--m-lead)", fontFamily: "var(--fr)" }}>
          Latency held under budget all week
          <span className="mc-inline">
            <Sparkline
              curve="smooth"
              data={[...CHECKOUT_P95]}
              width={104}
              height={26}
              title="Checkout p95 latency, weekly, milliseconds"
            />
          </span>
          and finished at <span className="font-mono text-[0.74em]">141 ms</span>.
        </p>
      </figure>

      {/* 2 — in a table cell */}
      <figure>
        <figcaption className="kicker mb-3">in a table cell</figcaption>
        <div className="max-w-[34rem] overflow-x-auto">
          <table className="mc-inline-table mono w-full min-w-[22rem] border-collapse">
            <thead>
              <tr>
                <th scope="col" className={th} style={{ borderColor: "var(--rule-2)" }}>
                  route
                </th>
                <th
                  scope="col"
                  className={`${th} !text-right`}
                  style={{ borderColor: "var(--rule-2)" }}
                >
                  p95
                </th>
                <th scope="col" className={th} style={{ borderColor: "var(--rule-2)" }}>
                  7d
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { route: "/checkout", p95: 141, data: CHECKOUT_P95 },
                { route: "/search", p95: 318, data: SEARCH_P95 },
              ].map((r) => (
                <tr key={r.route}>
                  <td
                    className="border-b"
                    style={{ borderColor: "var(--rule)", color: "var(--ink-2)" }}
                  >
                    {r.route}
                  </td>
                  <td className="border-b text-right" style={{ borderColor: "var(--rule)" }}>
                    {r.p95}
                  </td>
                  <td className="border-b" style={{ borderColor: "var(--rule)" }}>
                    <Sparkline
                      curve="smooth"
                      data={[...r.data]}
                      width={62}
                      height={16}
                      title={`${r.route} p95 latency, weekly, milliseconds`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>

      {/* 3 — on a KPI card. The only frame whose chart drives something outside
          itself: `onActive` streams the scrubbed point into the card's own big
          number, so the reading is painted where a KPI card already reads. */}
      <figure>
        <figcaption className="kicker mb-3">on a KPI card</figcaption>
        <KpiCard />
      </figure>

      {/* 4 — in a printed report */}
      <figure>
        <figcaption className="kicker mb-3">in a printed report</figcaption>
        <div data-v3-invert className="max-w-[32rem] rounded-[2px] px-7 pb-5 pt-7 sm:px-9">
          <p className="text-[17px] leading-[1.6]" style={{ fontFamily: "var(--fr)" }}>
            Checkout latency held at <span className="font-mono text-[0.78em]">141 ms</span>
            <span className="mc-inline">
              <PrintSparkline
                curve="smooth"
                data={[...CHECKOUT_P95]}
                width={82}
                height={22}
                title="Checkout p95 latency, weekly, milliseconds"
              />
            </span>
            through the release window.
          </p>
          {/* No figure number: an earlier pass labelled this "table 2" and the sheet
              below "fig. 3", which numbered nothing on a page with no figure 1.
              What is actually worth saying is what changed — the stock inverted and
              the mark re-derived its ink for it, which is the only thing the chart
              did differently. */}
          <div
            className="mt-5 pt-2.5 font-mono text-[10px] tracking-[0.02em]"
            style={{ color: "var(--paper-faint)" }}
          >
            static entry · no hover on paper · ink re-derived for the stock
          </div>
        </div>
      </figure>
    </div>
  );
}
