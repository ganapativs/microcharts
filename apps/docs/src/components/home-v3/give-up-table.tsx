import { SIZE, CATALOG } from "@/lib/docs-facts";
import { RECHARTS } from "@/lib/competitor-facts";

/**
 * What you give up. Real qualifiers in both columns — no checkmarks, no dashes,
 * nothing scored. A comparison where one column is all ticks is an advert; a
 * comparison a reader can lose an argument with is information.
 *
 * The closing line names Recharts warmly and on purpose. If you need axes and a
 * legend, a toolkit is the right answer and that one is good.
 */
export function GiveUpTable() {
  const rows: [string, string, string][] = [
    ["axes and gridlines", "none", "full, configurable"],
    ["tooltips", "value readout on focus", "rich HTML, positioned"],
    ["legends", "none — the sentence carries it", "built in"],
    ["chart types", `${CATALOG.total}, one shared API`, "~15 composable primitives"],
    ["works up to", "roughly 200 px", "300 px and up"],
    [
      "cost per chart",
      `${SIZE.interactiveMin.toFixed(2)}–${SIZE.interactiveMax.toFixed(2)} kB gzip`,
      `${RECHARTS.oneChartGzipKb} kB shared kernel`,
    ],
    ["static render", "0 kB of client JS", "client-only"],
  ];

  const th = "kicker border-b pb-2.5 text-left font-normal";
  const td = "border-b py-2.5";

  return (
    <div className="shell mt-16 lg:mt-24">
      <div className="kicker">what you give up</div>
      <div className="mt-5">
        <table
          className="cmp w-full border-collapse font-mono text-[12.5px] leading-[1.5] tracking-[-0.03em]"
          style={{ maxWidth: "var(--m-note)" }}
        >
          <thead>
            <tr>
              <th scope="col" className={`${th} pr-5`} style={{ borderColor: "var(--rule-2)" }}>
                <span className="sr-only">measure</span>
              </th>
              <th
                scope="col"
                className={`${th} pr-5`}
                style={{ borderColor: "var(--rule-2)", color: "var(--ink)" }}
              >
                microcharts
              </th>
              <th scope="col" className={th} style={{ borderColor: "var(--rule-2)" }}>
                a general-purpose toolkit
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([measure, ours, theirs]) => (
              <tr key={measure}>
                <th
                  scope="row"
                  className={`${td} pr-5 text-left font-normal`}
                  style={{ borderColor: "var(--rule)", color: "var(--ink-3)" }}
                >
                  {measure}
                </th>
                {/* data-col is the mobile row label: below 700px the table
                    restacks (see v3.css) and the head row is gone, so each cell
                    has to say which column it belongs to. A horizontally
                    scrolled table showed only the microcharts column, which
                    turns an honest comparison into a one-sided claim. */}
                <td
                  data-col="microcharts"
                  className={`${td} pr-5`}
                  style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
                >
                  {ours}
                </td>
                <td
                  data-col="a toolkit"
                  className={td}
                  style={{ borderColor: "var(--rule)", color: "var(--ink-2)" }}
                >
                  {theirs}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="prose mt-6" style={{ maxWidth: "var(--m-prose)" }}>
        Both columns are honest. If you need axes and a legend, the right answer is a toolkit, and{" "}
        {RECHARTS.name} is a good one.
      </p>
    </div>
  );
}
