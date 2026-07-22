"use client";

import { useEffect, useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { Ohlc } from "@microcharts/react/ohlc/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { HeartbeatBlip } from "@microcharts/react/heartbeat-blip/interactive";
import { CometTrail } from "@microcharts/react/comet-trail/interactive";
import { DualWindowMeter } from "@microcharts/react/dual-window-meter/interactive";
import { QueueDepth } from "@microcharts/react/queue-depth/interactive";
import { Topbar, PageHead, Card } from "../components/ui";
import {
  liveStream,
  sessionOhlc,
  sloBudget,
  liveErrorRate,
  liveQueue,
  liveThroughput,
} from "../data";

const fill = { width: "100%", height: "auto" } as const;

type Picked = {
  index: number;
  value: number | null;
  formatted?: string;
} | null;

function eventsFromRate(rate: number, now: number): number[] {
  const count = Math.max(4, Math.min(40, Math.round(rate / 45)));
  return Array.from({ length: count }, (_, i) => now - ((i + 0.5) / count) * 55_000);
}

export default function LivePage() {
  const [stream, setStream] = useState<number[]>(liveStream);
  const [errors, setErrors] = useState(liveErrorRate);
  const [clock, setClock] = useState(() => Date.now());
  const [events, setEvents] = useState(() => eventsFromRate(liveStream.at(-1)!, Date.now()));
  const [active, setActive] = useState<Picked>(null);
  const [selected, setSelected] = useState<Picked>(null);
  const [candle, setCandle] = useState<Picked>(null);
  const [errPick, setErrPick] = useState<Picked>(null);
  const [queuePick, setQueuePick] = useState<Picked>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setStream((prev) => {
        const last = prev[prev.length - 1]!;
        const next = Math.max(400, Math.round(last + (Math.random() - 0.45) * 160));
        const now = Date.now();
        setClock(now);
        setEvents(eventsFromRate(next, now));
        return [...prev.slice(-23), next];
      });
      setErrors((prev) => {
        const last = prev[prev.length - 1]!;
        const next = Math.max(0.1, Math.min(3.2, last + (Math.random() - 0.5) * 0.35));
        return [...prev.slice(-19), Math.round(next * 100) / 100];
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const current = stream[stream.length - 1]!;
  const prev = stream[stream.length - 2]!;
  const errNow = errors[errors.length - 1]!;
  const shown = selected ?? active;
  const metric =
    shown?.formatted ??
    (shown?.value != null ? shown.value.toLocaleString("en-US") : current.toLocaleString("en-US"));
  const errMetric = errPick
    ? `${errPick.formatted ?? errPick.value ?? "—"}%`
    : `${errNow.toFixed(2)}%`;
  const queueMetric =
    queuePick?.formatted ??
    (queuePick?.value != null ? String(queuePick.value) : String(liveQueue.at(-1)));

  return (
    <>
      <Topbar
        title="Live"
        crumb="Pulse"
        badge={
          <span className="live-badge">
            <span className="live-dot" aria-hidden />
            Live
          </span>
        }
        window="Refresh · 2s"
      />
      <div className="content">
        <PageHead
          index="06"
          eyebrow="Ops floor · streaming"
          title="Live telemetry"
          sub="What the product is doing right now — request rate, error heat, queue pressure, and session quality. Scrub any chart; the KPI follows."
        />

        <div className="bento section">
          <Card
            title="Requests / sec"
            sub="Streaming · scrub to inspect"
            className="c8 hover reveal reveal-1"
          >
            <div className="big-metric" style={{ marginBottom: 14 }}>
              <span className="num">{metric}</span>
              {!shown && (
                <Delta value={current} from={prev} positive="up" animate summary={false} />
              )}
            </div>
            <Sparkline
              data={stream}
              fill
              animate
              width={720}
              height={120}
              label="minmax"
              style={fill}
              title="Requests per second over the last ~50 seconds"
              readout={false}
              onActive={setActive}
              onSelect={setSelected}
              selectedIndex={selected?.index ?? null}
            />
            <p className="picker-readout">
              {shown
                ? `${selected && !active ? "Pinned" : "Scrub"} · ${shown.formatted ?? shown.value ?? "—"}`
                : "Hover or click — value lives in the KPI"}
            </p>
          </Card>

          <Card
            title="Event pulse"
            sub="ECG of arrivals · 60s"
            className="c4 hover reveal reveal-2"
          >
            <div style={{ display: "grid", placeItems: "center", padding: "18px 0 10px" }}>
              <HeartbeatBlip
                events={events}
                now={clock}
                window={60_000}
                label="count"
                width={220}
                height={64}
                title={`Request arrivals in the last minute at ~${current.toLocaleString()} rps`}
              />
            </div>
            <p className="chart-note" style={{ textAlign: "center" }}>
              Spike density tracks the live rate. An empty baseline would mean the service is quiet.
            </p>
          </Card>
        </div>

        <div className="grid two-col section">
          <Card title="Error rate" sub="% · last ~40s" className="hover reveal reveal-1">
            <div className="big-metric" style={{ marginBottom: 10 }}>
              <span className="num">{errMetric}</span>
            </div>
            <CometTrail
              data={errors}
              width={480}
              height={72}
              format={{ maximumFractionDigits: 2 }}
              title="Error rate percentage, streaming"
              style={fill}
              onActive={setErrPick}
              onSelect={setErrPick}
              selectedIndex={errPick?.index ?? null}
            />
            <p className="picker-readout">
              {errPick
                ? `Scrub · ${errPick.formatted ?? errPick.value ?? "—"}%`
                : "Hover the trail — CometTrail has no chip; value lives in the KPI"}
            </p>
          </Card>

          <Card title="Ingest queue" sub="Depth over time" className="hover reveal reveal-2">
            <div className="big-metric" style={{ marginBottom: 10 }}>
              <span className="num">{queueMetric}</span>
            </div>
            <QueueDepth
              data={liveQueue}
              width={480}
              height={100}
              label="last"
              title="Ingest queue depth over the last hour"
              animate
              style={fill}
              readout={false}
              onActive={setQueuePick}
              onSelect={setQueuePick}
              selectedIndex={queuePick?.index ?? null}
            />
            <p className="picker-readout">
              {queuePick
                ? `Scrub · ${queuePick.formatted ?? queuePick.value}`
                : "Hover or click a depth"}
            </p>
          </Card>
        </div>

        <div className="grid two-col">
          <Card
            title="Median session duration"
            sub="Minutes · last 14 days"
            className="reveal reveal-1"
          >
            <Ohlc
              data={sessionOhlc}
              label="last"
              animate
              width={480}
              height={180}
              format={{ maximumFractionDigits: 1 }}
              style={fill}
              title="Daily session duration open-high-low-close, in minutes"
              readout={false}
              onActive={setCandle}
              onSelect={setCandle}
              selectedIndex={candle?.index ?? null}
            />
            <p className="picker-readout">
              {candle?.formatted ? `Session · ${candle.formatted}` : "Scrub a candle"}
            </p>
          </Card>

          <div className="stack-gap">
            <Card title="Error budget" sub="% consumed this period" className="reveal reveal-2">
              <Bullet
                value={sloBudget.value}
                target={sloBudget.target}
                bands={sloBudget.bands}
                domain={[0, 100]}
                animate
                format={{ maximumFractionDigits: 0 }}
                width={480}
                height={48}
                style={fill}
                title="Error budget consumed against the monthly SLO allowance"
              />
              <p className="chart-note">
                <b>62%</b> spent · 9 days left — room for one bad deploy, not two.
              </p>
            </Card>

            <Card
              title="Throughput vs. target"
              sub="Fast & slow windows · target 1,400"
              className="reveal reveal-3"
            >
              <DualWindowMeter
                data={liveThroughput}
                target={1400}
                windows={[5, 20]}
                label="last"
                width={480}
                height={72}
                title="Short and long window throughput against the 1,400 rps target"
                animate
                style={fill}
              />
              <p className="chart-note">
                Short window is hot; long window still calm — a spike, not a regime change. Scrub
                for fast · slow at each sample.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
