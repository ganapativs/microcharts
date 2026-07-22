import { useState } from "react";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { ErrorBudget } from "@microcharts/react/error-budget/interactive";
import { GradedBand } from "@microcharts/react/graded-band/interactive";
import { BurnChart } from "@microcharts/react/burn-chart/interactive";
import { DualWindowMeter } from "@microcharts/react/dual-window-meter/interactive";
import { CoverageStrip } from "@microcharts/react/coverage-strip/interactive";
import {
  availabilitySlos,
  latencySlos,
  gatewayBudget,
  transcodeBudget,
  latencyDraws,
  latencyCurrent,
  incidentBurn,
  cpuHeadroom,
  cpuTarget,
  latencyMeter,
  latencyTarget,
  metricCoverage,
} from "../data";
import { ms, pct2, pct3, utilPct } from "../format";

const fill = { width: "100%", height: "auto" } as const;

export function SlosView() {
  const [cpuPin, setCpuPin] = useState<number | null>(null);

  return (
    <div className="grid-2">
      <section className="panel">
        <div className="panel-head">
          <h2>Availability SLOs</h2>
          <span className="panel-meta">attained vs target · 30d</span>
        </div>
        <div className="bullets">
          {availabilitySlos.map((s) => (
            <div className="bullet-row" key={s.name}>
              <span className="bullet-label">{s.name}</span>
              <Bullet
                value={s.value}
                target={s.target}
                bands={s.bands}
                domain={s.domain}
                format={pct3}
                width={500}
                height={34}
                summary={false}
                style={fill}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Latency SLOs</h2>
          <span className="panel-meta">p95 vs budget · lower is better</span>
        </div>
        <div className="bullets">
          {latencySlos.map((s) => (
            <div className="bullet-row" key={s.name}>
              <span className="bullet-label">{s.name}</span>
              <Bullet
                value={s.value}
                target={s.target}
                bands={s.bands}
                domain={s.domain}
                format={ms}
                width={500}
                height={34}
                summary={false}
                style={fill}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>CPU headroom · api-gateway</h2>
          <span className="panel-meta">fast/slow mean vs 80% ceiling</span>
        </div>
        <DualWindowMeter
          data={cpuHeadroom}
          target={cpuTarget}
          windows={[5, 20]}
          label="last"
          domain={[0, 100]}
          format={utilPct}
          width={500}
          height={108}
          summary={false}
          onSelect={(d) => setCpuPin(d?.value ?? null)}
          animate
          style={fill}
        />
        <p className="picker-readout">
          {cpuPin != null ? `pinned · ${utilPct(cpuPin)}` : "click the trace to pin a reading"}
        </p>
        <p className="note">
          Slow mean drifting toward the ceiling — provisioner will add a replica before breach.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Latency compliance · checkout</h2>
          <span className="panel-meta">p95 metering vs 100 ms line</span>
        </div>
        <DualWindowMeter
          data={latencyMeter}
          target={latencyTarget}
          windows={[4, 16]}
          band={[85, 100]}
          label="last"
          domain={[0, 160]}
          format={ms}
          width={500}
          height={108}
          summary={false}
          animate
          style={fill}
        />
        <p className="note">
          Fast window pierced the corridor twice; sustained read still inside budget.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Error budget · api-gateway</h2>
          <span className="panel-meta">30d window · remaining</span>
        </div>
        <ErrorBudget
          data={gatewayBudget}
          window={30}
          unit="day"
          label="remaining"
          format={pct2}
          width={500}
          height={96}
          summary={false}
          style={fill}
        />
        <p className="note">
          Burn accelerated after day 18; ~34% of budget left with 12 days to reset.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Error budget · media-transcode</h2>
          <span className="panel-meta">30d window · exhausted</span>
        </div>
        <ErrorBudget
          data={transcodeBudget}
          window={30}
          unit="day"
          label="remaining"
          format={pct2}
          width={500}
          height={96}
          summary={false}
          style={fill}
        />
        <p className="note bad-note">
          Budget burned by day 14 — SEV-1 freeze in effect on this service.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Latency budget</h2>
          <span className="panel-meta">p95 distribution vs current</span>
        </div>
        <GradedBand
          data={latencyDraws}
          value={latencyCurrent}
          levels={[50, 80, 95]}
          label="median"
          format={ms}
          width={500}
          height={82}
          summary={false}
          style={fill}
        />
        <p className="note">
          Median of the posterior is labeled; current p95 ({latencyCurrent} ms) is the hollow
          overlay — inside the 80% band, within budget.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Incident burn-down</h2>
          <span className="panel-meta">response backlog · story points</span>
        </div>
        <BurnChart
          data={incidentBurn}
          mode="down"
          work="points"
          unit="day"
          label="gap"
          projection
          width={500}
          height={128}
          summary={false}
          style={fill}
        />
        <p className="note">
          Actual trailing plan; projected to clear ~1 day past the review deadline.
        </p>
      </section>

      <section className="panel span-2">
        <div className="panel-head">
          <h2>Metric coverage</h2>
          <span className="panel-meta">
            scrape presence · 48 slots expected · gaps = missed pulls
          </span>
        </div>
        <div className="cov-list">
          {metricCoverage.map((c) => (
            <div className="cov-row" key={c.metric}>
              <span className="cov-metric">{c.metric}</span>
              <span className="cov-source">{c.source}</span>
              <CoverageStrip
                data={c.data}
                expected={c.expected}
                label="percent"
                height={24}
                width={780}
                summary={false}
                animate
                style={fill}
              />
            </div>
          ))}
        </div>
        <p className="note">
          jvm-agent dropped a 3-slot window during a GC pause; node-exporter has a trailing gap
          under investigation.
        </p>
      </section>
    </div>
  );
}
