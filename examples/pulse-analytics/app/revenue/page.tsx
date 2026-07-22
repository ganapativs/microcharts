"use client";

// inline per-row mini-charts inside the table.
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { MiniBar } from "@microcharts/react/mini-bar/interactive";
import { BenchmarkStrip } from "@microcharts/react/benchmark-strip/interactive";
import { DualSparkline } from "@microcharts/react/dual-sparkline/interactive";
import { DotPlot } from "@microcharts/react/dot-plot/interactive";
import { Waterfall } from "@microcharts/react/waterfall/interactive";
import { Funnel } from "@microcharts/react/funnel/interactive";
import { Topbar, PageHead, Card, SectionHead } from "../components/ui";
import {
  accounts,
  mrrMovement,
  mrrStart,
  mrrActual,
  mrrPlan,
  signupFunnel,
  usd,
  usdCents,
  compact,
} from "../data";

const fill = { width: "100%", height: "auto" } as const;
const fmtUsd = (n: number) => n.toLocaleString("en-US", usd);

function planClass(plan: string) {
  return `plan-tag ${plan.toLowerCase()}`;
}

export default function RevenuePage() {
  const total = accounts.reduce((s, a) => s + a.mrr, 0);
  const peers = accounts.map((a) => a.mrr);
  const leaderboard = [...accounts]
    .sort((a, b) => b.mrr - a.mrr)
    .map((a) => ({ label: a.short, value: a.mrr }));

  return (
    <>
      <Topbar title="Revenue" crumb="Pulse" />
      <div className="content">
        <PageHead
          index="02"
          eyebrow="Recurring revenue"
          title="Revenue"
          sub="Where MRR sits against plan, how it moved this month, and which accounts carry it."
        />

        <div className="bento section">
          <Card
            title="MRR: actual vs. plan"
            sub="Trailing 12 months"
            className="c7 hover reveal reveal-1"
          >
            <DualSparkline
              animate
              data={mrrActual}
              compare={mrrPlan}
              label="last"
              format={compact}
              width={560}
              height={190}
              style={fill}
              title="Monthly recurring revenue, actual against plan"
            />
            <p className="chart-note">
              Actual has run <b>ahead of plan</b> since March — the gap is expansion revenue landing
              early.
            </p>
          </Card>

          <Card title="MRR leaderboard" sub="By account" className="c5 hover reveal reveal-2">
            <DotPlot
              animate
              data={leaderboard}
              stem
              highlight={leaderboard[0].label}
              label="value"
              format={compact}
              width={420}
              height={240}
              style={fill}
              title="Accounts ranked by monthly recurring revenue"
            />
          </Card>
        </div>

        <SectionHead
          index="§ 01"
          title="Top accounts"
          sub={`${fmtUsd(total)} MRR · ${accounts.length} accounts`}
        />
        <Card className="section hover reveal reveal-1">
          <div className="table-wrap">
            <table className="rev-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Plan</th>
                  <th className="num">MRR</th>
                  <th>Product mix</th>
                  <th>vs. cohort</th>
                  <th className="num">7-week trend</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.account}>
                    <td className="rev-account">{a.account}</td>
                    <td>
                      <span className={planClass(a.plan)}>{a.plan}</span>
                    </td>
                    <td className="num mono">{fmtUsd(a.mrr)}</td>
                    <td>
                      <span className="cell-chart">
                        <MiniBar
                          animate
                          data={a.mix}
                          orientation="horizontal"
                          highlight={0}
                          width={130}
                          height={30}
                          summary={false}
                          title={`${a.account} product usage mix`}
                          style={fill}
                        />
                      </span>
                    </td>
                    <td>
                      <span className="cell-chart">
                        <BenchmarkStrip
                          animate
                          data={peers}
                          value={a.mrr}
                          range="minmax"
                          label="none"
                          format={compact}
                          width={130}
                          height={30}
                          summary={false}
                          title={`${a.account} MRR against the account cohort`}
                          style={fill}
                        />
                      </span>
                    </td>
                    <td className="num">
                      <span className="cell-trend">
                        <span className="mc-inline">
                          <Sparkline
                            animate
                            data={a.trend}
                            width={96}
                            height={22}
                            dots="none"
                            summary={false}
                          />
                        </span>
                        <Delta value={a.mrr} from={a.from} positive="up" summary={false} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <SectionHead
          index="§ 02"
          title="Movement & conversion"
          sub="How the number changed, and how it's earned"
        />
        <div className="grid two-col">
          <Card title="MRR movement" sub="Month over month" className="hover reveal reveal-1">
            <Waterfall
              animate
              data={mrrMovement}
              open={mrrStart}
              totalBar
              label="delta"
              format={usdCents}
              width={480}
              height={200}
              style={fill}
              title="Monthly recurring revenue movement by category"
            />
          </Card>

          <Card title="Signup → paid funnel" sub="Last 30 days" className="hover reveal reveal-2">
            <Funnel
              animate
              data={signupFunnel}
              label="percent"
              highlight="Paid"
              width={480}
              height={200}
              style={fill}
              title="Conversion funnel from first visit to paid"
            />
          </Card>
        </div>
      </div>
    </>
  );
}
