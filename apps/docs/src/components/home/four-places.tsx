import { Sparkline as PrintSparkline } from "@microcharts/react/sparkline";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { KpiCard } from "./kpi-card";
import { CHECKOUT_P95, SEARCH_P95 } from "./home-data";

/**
 * Act I's second beat — the same component in four places, unchanged.
 *
 * All four frames plot `CHECKOUT_P95` with the same `<Sparkline curve="smooth">`
 * and nothing changed but `width`/`height`. The first three use the INTERACTIVE
 * entry, so the mark scrubs the same way in a sentence, a table cell and a card.
 * The fourth uses the STATIC entry because it is a printed sheet and paper has no
 * hover — the only difference in the set, and one of surface, not of component.
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
          {/* Explicit spaces: JSX collapses newline-only whitespace between
              elements, and `.mc-inline`'s margin makes the gap LOOK right — so
              "all weekand finished" only shows up in a copy-paste or a screen
              reader. */}
          Latency held under budget all week{" "}
          <span className="mc-inline">
            <Sparkline
              curve="smooth"
              data={[...CHECKOUT_P95]}
              width={104}
              height={26}
              title="Checkout p95 latency, weekly, milliseconds"
            />
          </span>{" "}
          and finished at <span className="font-mono text-[0.74em]">141 ms</span>.
        </p>
      </figure>

      {/* 2 — in a table cell */}
      {/* `min-w-0` on both, load-bearing below 400px: a grid item's default
          `min-width: auto` is its min-content width, so the table's `min-w-[22rem]`
          propagated out through its own scroller and made the whole document
          scroll sideways on a 360px phone. */}
      <figure className="min-w-0">
        <figcaption className="kicker mb-3">in a table cell</figcaption>
        {/* Scrolls sideways below ~400px, so it has to be reachable by keyboard. */}
        <div tabIndex={0} className="min-w-0 max-w-[34rem] overflow-x-auto">
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
        <div data-invert className="max-w-[32rem] rounded-[2px] px-7 pb-5 pt-7 sm:px-9">
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
