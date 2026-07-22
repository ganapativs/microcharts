import { useMemo, useState } from "react";
import { HeatCell } from "@microcharts/react/heat-cell/interactive";
import { Honeycomb } from "@microcharts/react/honeycomb/interactive";
import { MinimapStrip } from "@microcharts/react/minimap-strip/interactive";
import { QueueDepth } from "@microcharts/react/queue-depth/interactive";
import {
  fleetMetrics,
  fleetNodes,
  fleetDomain,
  capacity,
  deployLog,
  deployLogLength,
  fleetBacklog,
} from "../data";

const fill = { width: "100%", height: "auto" } as const;

const LEVELS = ["DEBUG", "INFO", "INFO", "WARN", "INFO"] as const;

function logLine(i: number): { n: number; level: string; msg: string } {
  const dens = deployLog.content[i] ?? 1;
  const isDeploy = deployLog.marks.some((m) => Math.abs(m - i) < 4);
  if (isDeploy) {
    return {
      n: i,
      level: "WARN",
      msg: `deploy boundary · release tagged · scanner checkpoint`,
    };
  }
  const kind = i % 5;
  const msg =
    kind === 0
      ? `worker scanned chunk ${i} · density ${dens}`
      : kind === 1
        ? `heartbeat ok · lag ${Math.round(dens * 12)}ms`
        : kind === 2
          ? `index write · ${Math.round(dens * 40)} docs`
          : kind === 3
            ? `retry backlog · ${Math.round(dens * 3)} pending`
            : `gc pause · ${Math.round(dens * 8)}ms`;
  return { n: i, level: LEVELS[i % LEVELS.length]!, msg };
}

export function FleetView() {
  const [win, setWin] = useState<[number, number]>(deployLog.window);

  const lines = useMemo(() => {
    const a = Math.max(0, Math.floor(win[0]));
    const b = Math.min(deployLogLength - 1, Math.ceil(win[1]));
    const span = Math.max(1, b - a);
    const count = 14;
    const step = Math.max(1, Math.floor(span / count));
    const out: ReturnType<typeof logLine>[] = [];
    for (let i = a; i <= b && out.length < count; i += step) out.push(logLine(i));
    return out;
  }, [win]);

  return (
    <div className="stack">
      <section className="panel span-2">
        <div className="panel-head">
          <h2>Node × metric heat matrix</h2>
          <span className="panel-meta">7 nodes · utilization % · one shared 0–100 scale</span>
        </div>
        <div className="heat-matrix" role="table">
          <div className="heat-mrow heat-mhead" role="row">
            <span className="heat-node" role="columnheader">
              node
            </span>
            <span className="heat-zone" role="columnheader">
              zone
            </span>
            {fleetMetrics.map((m) => (
              <span className="heat-col" role="columnheader" key={m}>
                {m}
              </span>
            ))}
          </div>
          {fleetNodes.map((n) => (
            <div className={"heat-mrow" + (n.hot ? " is-hot" : "")} role="row" key={n.node}>
              <span className="heat-node" role="cell">
                {n.node}
              </span>
              <span className="heat-zone" role="cell">
                {n.zone}
              </span>
              {n.metrics.map((v, i) => (
                <span className="heat-col" role="cell" key={fleetMetrics[i]}>
                  <HeatCell
                    value={v}
                    domain={fleetDomain}
                    steps={5}
                    label="value"
                    format={(x) => `${Math.round(x)}`}
                    summary={`${n.node} ${fleetMetrics[i]}: ${v}%`}
                    style={{ width: 30, height: 30 }}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="note">
          node-b1 and node-c2 are running hot across every metric — candidates for cordon &amp;
          drain.
        </p>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Capacity</h2>
            <span className="panel-meta">taken of total · unit counting</span>
          </div>
          <div className="cap-grid">
            {capacity.map((c) => {
              const pct = Math.round((c.value / c.total) * 100);
              return (
                <div className="cap-cell" key={c.label}>
                  <Honeycomb
                    value={c.value}
                    total={c.total}
                    unit={c.unit}
                    rows="auto"
                    cell={5}
                    summary={`${c.label}: ${c.value} of ${c.total} ${c.unit}`}
                    animate
                    style={{ width: "100%", height: "auto", maxWidth: 168 }}
                  />
                  <div className="cap-meta">
                    <span className="cap-label">{c.label}</span>
                    <span className="cap-hint">{c.hint}</span>
                    <span className="cap-count num">
                      <strong>{c.value}</strong>
                      <span className="dim">/{c.total}</span>
                      <span
                        className={"cap-pct " + (pct >= 90 ? "bad" : pct >= 75 ? "warn-t" : "good")}
                      >
                        {pct}%
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Retry backlog</h2>
            <span className="panel-meta">jobs waiting · last hour</span>
          </div>
          <QueueDepth
            data={fleetBacklog}
            capacity={200}
            label="last"
            width={480}
            height={110}
            title="Retry queue depth over the last hour against a 200-job capacity"
            animate
            style={fill}
          />
          <p className="note">
            Backlog peaked with the hot nodes, then drained as workers came back online.
          </p>
        </section>
      </div>

      <section className="panel span-2">
        <div className="panel-head">
          <h2>Deploy-log position</h2>
          <span className="panel-meta">
            {deployLogLength.toLocaleString()} lines · drag the window · marks = deploys
          </span>
        </div>
        <MinimapStrip
          data={deployLog}
          mode="heat"
          markLane
          height={40}
          width={1040}
          summary={false}
          onWindowChange={setWin}
          animate
          style={fill}
        />
        <p className="picker-readout">
          viewing lines {Math.round(win[0]).toLocaleString()}–{Math.round(win[1]).toLocaleString()}{" "}
          of {deployLogLength.toLocaleString()}
        </p>
        <div className="log-panel" aria-label="Log lines in the selected window">
          {lines.map((l) => (
            <div className="log-line" key={l.n}>
              <span className="log-n num">{l.n.toLocaleString()}</span>
              <span className={"log-lvl " + l.level.toLowerCase()}>{l.level}</span>
              <span className="log-msg">{l.msg}</span>
            </div>
          ))}
        </div>
        <p className="note">
          The minimap drives this pane — scrub the window and the lines follow. Trailing lines past
          the last deploy are not yet indexed by the scanner.
        </p>
      </section>
    </div>
  );
}
