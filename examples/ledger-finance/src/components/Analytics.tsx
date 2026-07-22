import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { PercentileLadder } from "@microcharts/react/percentile-ladder/interactive";
import { StackedArea } from "@microcharts/react/stacked-area/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { EnsembleGhosts } from "@microcharts/react/ensemble-ghosts/interactive";
import { WinProbWorm } from "@microcharts/react/win-prob-worm/interactive";
import { SpreadBand } from "@microcharts/react/spread-band/interactive";
import { BiasStrip } from "@microcharts/react/bias-strip/interactive";
import { ForecastCone } from "@microcharts/react/forecast-cone/interactive";
import {
  monthlyReturns,
  dailyReturns,
  allocationOverTime,
  goals,
  forecastPaths,
  millionOdds,
  benchmarkSpread,
  trackingPairs,
  portfolioSeries,
  portfolioForecast,
  millionTarget,
} from "../data";

const pct = { style: "percent", maximumFractionDigits: 1 } as const;
const pctPoints = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdOpts = {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
} as const;

const catColors = ["#6fb0e0", "#e2b45c", "#4fb08d"];
const meanMonthly = monthlyReturns.reduce((s, v) => s + v, 0) / monthlyReturns.length;

const finalOdds = millionOdds[millionOdds.length - 1];
const lastSpread = benchmarkSpread[benchmarkSpread.length - 1];
const spreadLead = Math.round((lastSpread.a - lastSpread.b) * 100) / 100;
const historyTail = portfolioSeries.slice(-36);

export function Analytics() {
  return (
    <section className="view" aria-label="Analytics">
      <div className="section-head">
        <h2>Analytics</h2>
        <span className="aside">Will this book clear $1M — and is the path honest?</span>
      </div>

      <div className="panel pad-lg">
        <p className="panel-title">Path to $1M</p>
        <p className="panel-note">
          36 months of NAV · 24-month median forecast with an 80% band · target at{" "}
          {usd.format(millionTarget)}
        </p>
        <ForecastCone
          data={historyTail}
          forecast={portfolioForecast}
          target={millionTarget}
          unit="month"
          label="landing"
          format={usdOpts}
          title="Portfolio value history and Monte-Carlo forecast against the one-million target"
          animate
          style={{ width: "100%", height: "auto" }}
          width={1040}
          height={200}
        />
        <p className="panel-note" style={{ marginTop: 10 }}>
          Median clears the mark; the lower band still does not — the worm below is the probability
          story behind that cone.
        </p>
      </div>

      <div className="grid cols-2">
        <div className="panel pad-lg">
          <p className="panel-title">Monthly returns</p>
          <p className="panel-note">36 months · marker at the mean ({pctPoints(meanMonthly)})</p>
          <HistogramStrip
            data={monthlyReturns}
            bins={13}
            markValue={meanMonthly}
            format={pctPoints}
            title="Distribution of monthly returns over three years"
            animate
            style={{ width: "100%", height: "auto" }}
            width={520}
            height={150}
          />
        </div>

        <div className="panel pad-lg">
          <p className="panel-title">Daily return percentiles</p>
          <p className="panel-note">252 trading days · p10 / p50 / p90 / p99</p>
          <PercentileLadder
            data={dailyReturns}
            ps={[10, 50, 90, 99]}
            label="both"
            marks="tick"
            format={pctPoints}
            title="Daily return percentiles over the trailing year"
            animate
            style={{ width: "100%", height: "auto" }}
            width={520}
            height={120}
          />
        </div>
      </div>

      <div className="section-head">
        <h2>Forecast detail</h2>
        <span className="aside">Monte-Carlo · {finalOdds!.toFixed(0)}% odds of clearing $1M</span>
      </div>

      <div className="grid split-7-5">
        <div className="panel pad-lg">
          <p className="panel-title">24-month projection</p>
          <p className="panel-note">14 simulated paths · median emphasized, endpoints marked</p>
          <EnsembleGhosts
            data={forecastPaths}
            ghosts={12}
            emphasis="nearest-median"
            endpoints
            color="#6fb0e0"
            title="Fourteen simulated portfolio paths over the next 24 months"
            format={usdOpts}
            animate
            style={{ width: "100%", height: "auto" }}
            width={620}
            height={220}
          />
        </div>

        <div className="panel pad-lg">
          <p className="panel-title">Odds of clearing $1M</p>
          <p className="panel-note">Model probability by year end · 50% line is the story</p>
          <WinProbWorm
            data={millionOdds}
            sides={["On track", "Falls short"]}
            label="last"
            markSwing
            title="Modelled probability of the portfolio clearing one million dollars"
            format={(n) => `${Math.round(n)}%`}
            animate
            style={{ width: "100%", height: "auto" }}
            width={410}
            height={228}
          />
        </div>
      </div>

      <div className="section-head">
        <h2>Benchmark</h2>
        <span className="aside">
          vs. 60/40 · {spreadLead >= 0 ? "leading" : "trailing"} by {pctPoints(spreadLead)}
        </span>
      </div>

      <div className="grid split-7-5">
        <div className="panel pad-lg">
          <p className="panel-title">Portfolio vs. benchmark</p>
          <p className="panel-note">Cumulative return · shaded where the lead flips</p>
          <SpreadBand
            data={benchmarkSpread}
            seriesLabels={["Portfolio", "Benchmark"]}
            positive="up"
            label="gap"
            title="Cumulative return of the portfolio against its 60/40 benchmark"
            format={pctPoints}
            animate
            style={{ width: "100%", height: "auto" }}
            width={620}
            height={200}
          />
        </div>

        <div className="panel pad-lg">
          <p className="panel-title">Tracking agreement</p>
          <p className="panel-note">Monthly return gaps · ±95% limits of agreement</p>
          <BiasStrip
            data={trackingPairs}
            limits={1.96}
            label="bias"
            title="Monthly tracking difference between the portfolio and its benchmark"
            format={pctPoints}
            animate
            style={{ width: "100%", height: "auto" }}
            width={410}
            height={228}
          />
        </div>
      </div>

      <div className="section-head">
        <h2>Composition &amp; goals</h2>
        <span className="aside">Allocation drift &amp; savings targets</span>
      </div>

      <div className="grid split-7-5">
        <div className="panel pad-lg">
          <p className="panel-title">Allocation over time</p>
          <p className="panel-note">Share of portfolio · trailing 12 months</p>
          <StackedArea
            data={allocationOverTime}
            colors={catColors}
            curve="smooth"
            label="last"
            title="Allocation share by asset class over the trailing year"
            format={pct}
            animate
            style={{ width: "100%", height: "auto" }}
            width={620}
            height={200}
          />
          <div className="legend">
            {allocationOverTime.map((s, i) => (
              <span key={s.label}>
                <i style={{ background: catColors[i] }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="panel pad-lg">
          <p className="panel-title">Savings goals</p>
          <p className="panel-note">Progress toward each target</p>
          {goals.map((g) => (
            <div className="goal" key={g.label}>
              <div className="goal-head">
                <span>{g.label}</span>
                <span className="g-val">
                  <b>{usd.format(g.value)}</b> / {usd.format(g.target)}
                </span>
              </div>
              <Bullet
                value={g.value}
                target={g.target}
                bands={g.bands}
                domain={[0, g.target]}
                format={(n) => usd.format(n)}
                title={`${g.label}: ${usd.format(g.value)} of ${usd.format(g.target)}`}
                animate
                style={{ width: "100%", height: "auto" }}
                width={410}
                height={41}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
