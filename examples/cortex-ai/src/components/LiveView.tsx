import { useState } from "react";
import { HeartbeatBlip } from "@microcharts/react/heartbeat-blip/interactive";
import { CometTrail } from "@microcharts/react/comet-trail/interactive";
import { OrbitStatus } from "@microcharts/react/orbit-status/interactive";
import { StatusDot } from "@microcharts/react/status-dot/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { ActivityGrid } from "@microcharts/react/activity-grid/interactive";
import { EtaBar } from "@microcharts/react/eta-bar/interactive";
import { Card, CardHead, StatLine } from "./ui";
import * as d from "../data";

type Unit = { index: number; value: number | null; label?: string } | null;

const stateLabel: Record<d.ModelState, string> = {
  ok: "healthy",
  busy: "saturated",
  warn: "degraded",
  error: "failing",
  off: "offline",
};

export function LiveView() {
  const remainingMin = ((1 - d.batchEval.progress) / d.batchEval.rate).toFixed(0);
  const [tokenScrub, setTokenScrub] = useState<Unit>(null);

  return (
    <div className="view-enter">
      <div className="view-head">
        <div className="eyebrow">Platform · us-east-2</div>
        <h1>Everything the fleet is doing, right now</h1>
        <p>
          Live request rate, throughput momentum and per-endpoint health across four served models.
          Green means lower is better on cost, latency and errors.
        </p>
      </div>

      {/* Readout bar — one instrument cluster, hairline-divided */}
      <div
        className="readout"
        style={{ marginBottom: "var(--s5)" }}
        role="group"
        aria-label="Fleet vitals, last 24h"
      >
        <div className="readout-cell">
          <span className="readout-label">Cost</span>
          <span className="readout-value">
            $0.42<small>/1k</small>
          </span>
          <span className="readout-delta">
            <Delta value={d.kpis.cost.now} from={d.kpis.cost.from} positive="down" animate /> vs 24h
          </span>
        </div>
        <div className="readout-cell">
          <span className="readout-label">p95 latency</span>
          <span className="readout-value">
            1,180<small>ms</small>
          </span>
          <span className="readout-delta">
            <Delta value={d.kpis.p95.now} from={d.kpis.p95.from} positive="down" animate /> vs 24h
          </span>
        </div>
        <div className="readout-cell">
          <span className="readout-label">Error rate</span>
          <span className="readout-value">
            0.6<small>%</small>
          </span>
          <span className="readout-delta">
            <Delta value={d.kpis.error.now} from={d.kpis.error.from} positive="down" animate /> vs
            24h
          </span>
        </div>
        <div className="readout-cell">
          <span className="readout-label">Throughput</span>
          <span className="readout-value">
            10.9<small>rps</small>
          </span>
          <span className="readout-delta">
            <Delta
              value={d.kpis.throughput.now}
              from={d.kpis.throughput.from}
              positive="up"
              animate
            />{" "}
            vs 24h
          </span>
        </div>
      </div>

      <div className="grid stagger">
        {/* Hero: request pulse */}
        <Card span={4} className="pad-lg" accent>
          <CardHead
            title="Request pulse"
            sub="Inference calls across the fleet, last 60 seconds"
            tag={
              <>
                <span
                  className="swatch"
                  style={{ background: "var(--accent)", borderRadius: 999 }}
                />{" "}
                live
              </>
            }
          />
          <div className="chart-frame">
            <HeartbeatBlip
              events={d.requestPulse.events}
              now={d.requestPulse.now}
              window={d.requestPulse.window}
              label="count"
              width={640}
              height={88}
              className="chart-fill"
            />
          </div>
          <StatLine
            items={[
              ["events / min", <span className="num">{d.requestPulse.events.length}</span>],
              ["peak", <span className="num">142 rps</span>],
              ["window", <span className="num">60s</span>],
            ]}
          />
        </Card>

        {/* Tokens/sec momentum */}
        <Card span={2}>
          <CardHead title="Tokens / sec" sub="Decode throughput, with momentum" />
          <div className="chart-frame">
            <CometTrail
              data={d.tokensPerSec}
              trail={14}
              label="last"
              width={260}
              height={90}
              className="chart-fill"
              onActive={setTokenScrub}
            />
            {tokenScrub && tokenScrub.value !== null ? (
              <span className="scrub-chip">{Math.round(tokenScrub.value)} tok/s</span>
            ) : null}
          </div>
          <StatLine
            items={[
              ["now", <span className="num">{d.tokensPerSec[d.tokensPerSec.length - 1]}</span>],
              ["min", <span className="num">{Math.min(...d.tokensPerSec)}</span>],
              ["max", <span className="num">{Math.max(...d.tokensPerSec)}</span>],
            ]}
          />
        </Card>

        {/* Model roster */}
        <Card span={3}>
          <CardHead
            title="Served models"
            sub="Endpoint state · p50 latency · req/s"
            tag={<>4 online</>}
          />
          <div className="roster">
            {d.models.map((m) => (
              <div className="roster-row" key={m.id}>
                <StatusDot status={m.state} pulse={m.state === "ok" || m.state === "busy"} />
                <div style={{ minWidth: 0 }}>
                  <div className="roster-name">{m.name}</div>
                  <div className="roster-tier">
                    {m.tier} · {stateLabel[m.state]}
                  </div>
                </div>
                <div className="roster-metric">
                  {m.latency}
                  <small>ms</small>
                </div>
                <div className="roster-metric">
                  {m.rate.toFixed(1)}
                  <small>rps</small>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Orbit health small-multiples */}
        <Card span={3}>
          <CardHead
            title="Endpoint health"
            sub="Orbit radius = latency · dash speed = request rate"
            tag={<>±ms</>}
          />
          <div className="orbit-grid">
            {d.orbit.map((o) => (
              <div className="orbit-cell" key={o.id}>
                <OrbitStatus
                  latency={o.latency}
                  rate={o.rate}
                  latencyDomain={d.latencyDomain}
                  rateDomain={d.rateDomain}
                  threshold={d.latencyAlert}
                  size={64}
                  className="glyph"
                />
                <div className="orbit-name">{o.name.replace("cortex-", "")}</div>
              </div>
            ))}
          </div>
          <div className="legend">
            <span>
              <span className="swatch" style={{ background: "var(--mc-negative, #bd4b2d)" }} /> ≥{" "}
              {d.latencyAlert}ms flagged
            </span>
          </div>
        </Card>

        {/* Activity grid */}
        <Card span={4}>
          <CardHead
            title="Eval-run cadence"
            sub="Suites executed per day, last 18 weeks"
            tag={<>18w</>}
          />
          <div className="chart-frame">
            <ActivityGrid
              data={d.evalRuns}
              layout="grid"
              shape="round"
              anchor={d.evalRunsStart}
              weekStart={1}
              cell={11}
              className="chart-fill"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <StatLine
            items={[
              [
                "runs",
                <span className="num">{d.fmtInt(d.evalRuns.reduce((a, b) => a + b, 0))}</span>,
              ],
              ["busiest", <span className="num">{Math.max(...d.evalRuns)}</span>],
              [
                "quiet days",
                <span className="num">{d.evalRuns.filter((v) => v === 0).length}</span>,
              ],
            ]}
          />
        </Card>

        {/* Batch eval ETA */}
        <Card span={2}>
          <CardHead title="Batch eval" sub={d.batchEval.suite} tag={<>running</>} />
          <div className="chart-frame">
            <EtaBar
              progress={d.batchEval.progress}
              elapsed={d.batchEval.elapsed}
              rate={d.batchEval.rate}
              label="eta"
              etaFormat={(t) => `${Math.round(t)} min`}
              width={260}
              height={52}
              className="chart-fill"
              animate
            />
          </div>
          <StatLine
            items={[
              ["cases", <span className="num">{d.fmtInt(d.batchEval.cases)}</span>],
              ["done", <span className="num">{Math.round(d.batchEval.progress * 100)}%</span>],
              ["eta", <span className="num">~{remainingMin}m</span>],
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
