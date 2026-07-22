import { useState } from "react";
import { StatusDot } from "@microcharts/react/status-dot/interactive";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { Seismogram } from "@microcharts/react/seismogram/interactive";
import { HeatStrip } from "@microcharts/react/heat-strip/interactive";
import { MicroBox } from "@microcharts/react/micro-box/interactive";
import { OrbitStatus } from "@microcharts/react/orbit-status/interactive";
import {
  services,
  serviceBursts,
  tenantLoad,
  tenantLoadDomain,
  dependencies,
  dependencyLatencyDomain,
  dependencyRateDomain,
} from "../data";
import { ms, msTight, pct2, rps } from "../format";

const fill = { width: "100%", height: "auto" } as const;

export function ServicesView() {
  const [boxReadout, setBoxReadout] = useState<string | null>(null);

  return (
    <div className="stack">
      <section className="panel panel-lead">
        <div className="panel-head">
          <h2>Microservices</h2>
          <span className="panel-meta">p95 latency · error-rate Δ · 30d uptime</span>
        </div>
        <div className="svc-table" role="table">
          <div className="svc-row svc-head" role="row">
            <span role="columnheader" />
            <span role="columnheader">service</span>
            <span role="columnheader">zone</span>
            <span role="columnheader">p95 latency · 60m</span>
            <span role="columnheader" className="num">
              p95
            </span>
            <span role="columnheader" className="num">
              err-rate Δ
            </span>
            <span role="columnheader" className="num">
              rps
            </span>
            <span role="columnheader" className="num">
              uptime
            </span>
          </div>
          {services.map((s) => (
            <div className="svc-row" role="row" key={s.id}>
              <span role="cell">
                <StatusDot status={s.status} pulse={s.status === "error"} summary={s.status} />
              </span>
              <span role="cell" className="svc-name">
                {s.name}
              </span>
              <span role="cell" className="svc-zone">
                {s.zone}
              </span>
              <span role="cell">
                <span className="mc-inline">
                  <Sparkline
                    data={s.latency}
                    width={132}
                    height={26}
                    dots="auto"
                    color={s.status === "error" ? "var(--mc-negative)" : undefined}
                    summary={false}
                  />
                </span>
              </span>
              <span role="cell" className="num">
                {s.p95} ms
              </span>
              <span role="cell" className="num">
                <span className="mc-inline">
                  <Delta
                    value={s.errRate - s.errRatePrev}
                    positive="down"
                    format={pct2}
                    summary={false}
                  />
                </span>
              </span>
              <span role="cell" className="num dim">
                {s.rps.toLocaleString()}
              </span>
              <span role="cell" className={"num " + (s.uptime < 99.9 ? "bad" : "good")}>
                {s.uptime.toFixed(3)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Error bursts</h2>
            <span className="panel-meta">alert density · 48× 60s · flares ≥ 6</span>
          </div>
          <div className="row-list">
            {serviceBursts.map((b) => (
              <div className="mini-row" key={b.id}>
                <span className="mini-row-label">
                  <StatusDot status={b.status} summary={false} /> {b.name}
                </span>
                <Seismogram
                  data={b.data}
                  anomaly={b.anomaly}
                  positive="down"
                  height={24}
                  width={340}
                  summary={false}
                  style={fill}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Latency spread</h2>
            <span className="panel-meta">p95 IQR · 60m samples · median tick</span>
          </div>
          <div className="row-list">
            {services.slice(0, 6).map((s) => (
              <div className="mini-row" key={s.id}>
                <span className="mini-row-label">
                  <StatusDot status={s.status} summary={false} /> {s.name}
                </span>
                <MicroBox
                  data={s.latency}
                  whiskers="tukey"
                  outliers
                  format={msTight}
                  height={22}
                  width={340}
                  color={s.status === "error" ? "var(--mc-negative)" : undefined}
                  summary={false}
                  onActive={(d) =>
                    setBoxReadout(d ? `${s.name} · ${d.label}: ${msTight(d.value ?? 0)}` : null)
                  }
                  animate
                  style={fill}
                />
              </div>
            ))}
          </div>
          <p className="picker-readout">
            {boxReadout ?? "hover or focus a row for its five-number summary"}
          </p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Tenant load</h2>
            <span className="panel-meta">shared cluster · 40× 90s · step-scaled</span>
          </div>
          <div className="row-list">
            {tenantLoad.map((t) => (
              <div className="mini-row" key={t.tenant}>
                <span className="mini-row-label">
                  {t.tenant}
                  <span className="mini-row-tag">{t.plan}</span>
                </span>
                <HeatStrip
                  data={t.data}
                  domain={tenantLoadDomain}
                  steps={6}
                  height={22}
                  width={340}
                  format={(n) => `${Math.round(n)}%`}
                  summary={false}
                  animate
                  style={fill}
                />
              </div>
            ))}
          </div>
          <p className="note">
            acme-corp ramping toward cluster saturation — right edge running hot.
          </p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Dependencies</h2>
            <span className="panel-meta">latency = orbit · rate = spin · alert flags</span>
          </div>
          <div className="dep-grid">
            {dependencies.map((d) => (
              <div className="dep-cell" key={d.name}>
                <OrbitStatus
                  latency={d.latency}
                  rate={d.rate}
                  latencyDomain={dependencyLatencyDomain}
                  rateDomain={dependencyRateDomain}
                  threshold={d.alert}
                  size={44}
                  summary={`${d.name}: ${d.latency} ms, ${Math.round(d.rate).toLocaleString()} ops/s`}
                  style={{ width: "100%", height: "auto" }}
                />
                <span className="dep-name">{d.name}</span>
                <span className="dep-kind">{d.kind}</span>
                <span className={"dep-lat num " + (d.latency >= d.alert ? "bad" : "dim")}>
                  {ms(d.latency)}
                </span>
                <span className="dep-rate num dim">{rps(d.rate)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
