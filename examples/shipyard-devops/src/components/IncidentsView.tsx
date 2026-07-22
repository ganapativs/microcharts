import { StatusDot } from "@microcharts/react/status-dot/interactive";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { ActivityGrid } from "@microcharts/react/activity-grid/interactive";
import { EventTimeline } from "@microcharts/react/event-timeline/interactive";
import { EventRaster } from "@microcharts/react/event-raster/interactive";
import { Constellation } from "@microcharts/react/constellation/interactive";
import {
  incidentGrid,
  incidentGridStart,
  mttrTrend,
  responseTimes,
  responseP95,
  severityLegend,
  incidentLog,
  opsWindows,
  opsWindowNow,
  opsWindowDomain,
  eventSources,
  eventSourcesDomain,
  majorOutages,
  outageDomainX,
  outageWeek,
} from "../data";
import { ms, mins, hhmm, kmin } from "../format";

const fill = { width: "100%", height: "auto" } as const;
const dayTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function IncidentsView() {
  return (
    <div className="grid-2">
      <section className="panel span-2">
        <div className="panel-head">
          <h2>Incident calendar</h2>
          <span className="panel-meta">20 weeks · severity as intensity</span>
        </div>
        <div className="cal-layout">
          <ActivityGrid
            data={incidentGrid}
            anchor={incidentGridStart}
            weekStart={1}
            domain={[0, 4]}
            cell={14}
            gap={3}
            title="Incidents per day, last 20 weeks"
            summary={false}
            style={{ width: "100%", maxWidth: 460, height: "auto" }}
          />
          <div className="cal-side">
            <div className="legend">
              {severityLegend.map((l) => (
                <span className="legend-item" key={l.label}>
                  <StatusDot status={l.status} summary={false} />
                  <span className="legend-label">{l.label}</span>
                  <span className="legend-count">{l.count}</span>
                </span>
              ))}
            </div>
            <p className="note">
              28 incidents across 20 weeks — two SEV-1s, both traced to the media-transcode encoder
              pool. Cell intensity tracks the day&apos;s worst severity.
            </p>
          </div>
        </div>
      </section>

      <section className="panel span-2">
        <div className="panel-head">
          <h2>On-call &amp; release windows</h2>
          <span className="panel-meta">24h · shifts · deploys · now 14:08 UTC</span>
        </div>
        <EventTimeline
          data={opsWindows}
          domain={opsWindowDomain}
          now={opsWindowNow}
          label="spans"
          format={(n: number) => dayTime.format(n)}
          width={1040}
          height={96}
          summary={false}
          animate
          style={fill}
        />
        <p className="note">
          Release 2026.7.3 landed inside the day shift; the SEV-1 point event fired ~2h later.
        </p>
      </section>

      <section className="panel span-2">
        <div className="panel-head">
          <h2>Event sources</h2>
          <span className="panel-meta">
            deploys · alerts · autoscale · cron · pages — one lane each
          </span>
        </div>
        <EventRaster
          data={eventSources}
          domain={eventSourcesDomain}
          labels
          format={hhmm}
          width={1040}
          height={150}
          summary={false}
          animate
          style={fill}
        />
        <p className="note">
          Alerts and autoscale fire together around 13:38 — hover a tick to pin the lane and time.
          The SEV-1 signature sits in that cluster.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>MTTR trend</h2>
          <span className="panel-meta">mean time to resolve · last 24</span>
        </div>
        <Sparkline
          data={mttrTrend}
          fill
          dots="minmax"
          label="minmax"
          format={mins}
          color="var(--mc-positive)"
          width={500}
          height={104}
          summary={false}
          style={fill}
        />
        <p className="note">
          MTTR down from 84m to 24m over the window — automation + runbook coverage.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Response-time distribution</h2>
          <span className="panel-meta">600 samples · p95 marked</span>
        </div>
        <HistogramStrip
          data={responseTimes}
          markValue={responseP95}
          format={ms}
          width={500}
          height={104}
          summary={false}
          style={fill}
        />
        <p className="note">Right-skewed; the marked bin holds the p95 ({responseP95} ms) tail.</p>
      </section>

      <section className="panel span-2">
        <div className="panel-head">
          <h2>Major outages</h2>
          <span className="panel-meta">this quarter · dot area = customer-minutes lost</span>
        </div>
        <Constellation
          data={majorOutages}
          xDomain={outageDomainX}
          xFormat={outageWeek}
          label="max"
          format={kmin}
          width={1040}
          height={120}
          summary={false}
          animate
          style={fill}
        />
        <p className="note">
          Seven customer-visible outages in 13 weeks; the week-8 transcode failure dominates the
          quarter (120k min).
        </p>
      </section>

      <section className="panel span-2">
        <div className="panel-head">
          <h2>Recent incidents</h2>
          <span className="panel-meta">last 3 days</span>
        </div>
        <div className="inc-table" role="table">
          <div className="inc-row inc-head" role="row">
            <span />
            <span>id</span>
            <span>service</span>
            <span>summary</span>
            <span className="num">mttr</span>
            <span className="num">when</span>
          </div>
          {incidentLog.map((i) => (
            <div className="inc-row" role="row" key={i.id}>
              <span>
                <StatusDot status={i.sev} pulse={i.sev === "error"} summary={i.sev} />
              </span>
              <span className="inc-id">{i.id}</span>
              <span className="inc-svc">{i.service}</span>
              <span className="inc-title">{i.title}</span>
              <span className="num">{i.mttr}m</span>
              <span className="num dim">{i.when}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
