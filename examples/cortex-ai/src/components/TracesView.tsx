import { useState } from "react";
import { TraceFold } from "@microcharts/react/trace-fold/interactive";
import { EventRaster } from "@microcharts/react/event-raster/interactive";
import { Waveform } from "@microcharts/react/waveform/interactive";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Card, CardHead, StatLine } from "./ui";
import * as d from "../data";

type Unit = { index: number; value: number | null; label?: string } | null;

function voicePhase(i: number): { name: string; note: string } {
  if (i < 55) {
    return {
      name: "greeting",
      note: "Opens the request — auth and route light first on the flame chart",
    };
  }
  if (i < 130) {
    return {
      name: "intent",
      note: "Caller states the task — plan, embed, and search spans fire next",
    };
  }
  return {
    name: "confirm",
    note: "Caller confirms — generate is already the critical-path bottleneck",
  };
}

export function TracesView() {
  const slowest = d.stepLatency.indexOf(Math.max(...d.stepLatency));
  const [waveActive, setWaveActive] = useState<Unit>(null);
  const [pinnedStep, setPinnedStep] = useState<Unit>(null);
  const phase = waveActive ? voicePhase(waveActive.index) : null;

  return (
    <div className="view-enter">
      <div className="view-head">
        <div className="eyebrow">Trace · req 9f2c…a1 · agent.run</div>
        <h1>Follow one agent request end to end</h1>
        <p>
          A single tool-using request, unfolded: the voice turn that started it, where the wall time
          went, and which tools fired at each step. Scrub the waveform — it points into the flame
          chart.
        </p>
      </div>

      <div className="grid stagger">
        <Card span={6}>
          <CardHead
            title="Voice turn · what kicked this off"
            sub="Per-bucket amplitude · three speech bursts"
            tag={<>{Math.round(d.waveformProgress * 100)}% played</>}
          />
          <div className="chart-frame">
            <Waveform
              data={d.waveform}
              progress={d.waveformProgress}
              mode="bars"
              mirror
              width={1000}
              height={126}
              className="chart-fill"
              animate
              onActive={setWaveActive}
            />
          </div>
          <div className="picker-readout">
            {waveActive ? (
              <>
                <span className="num">{phase!.name}</span> · bucket {waveActive.index} · amp{" "}
                {(waveActive.value ?? 0).toFixed(2)} — {phase!.note}
              </>
            ) : (
              "Scrub a burst — greeting, intent, or confirm maps onto the spans below"
            )}
          </div>
        </Card>

        <Card span={6} className="pad-lg">
          <CardHead
            title="Request trace"
            sub={`Flame chart · ${d.traceTotalMs.toLocaleString("en-US")}ms wall time · critical path accented`}
            tag={<>10 spans</>}
          />
          <div className="chart-frame">
            <TraceFold
              data={d.traceSpans}
              emphasis="critical"
              labels
              width={1000}
              height={264}
              className="chart-fill"
              animate
            />
          </div>
          <div className="trace-legend">
            <span className="trace-legend__item">
              <i className="trace-sw trace-sw--crit" /> on the critical path
            </span>
            <span className="trace-legend__item">
              <i className="trace-sw trace-sw--off" /> off it — parallel or non-blocking
            </span>
          </div>
          <StatLine
            items={[
              ["wall", <span className="num">4,200ms</span>],
              ["on critical path", <span className="num">llm.generate</span>],
              ["longest span", <span className="num">2,470ms</span>],
            ]}
          />
        </Card>

        <Card span={4}>
          <CardHead
            title="Tool calls by step"
            sub="One lane per tool · x = time within the request"
            tag={<>raster</>}
          />
          <div className="chart-frame">
            <EventRaster
              data={d.rasterLanes}
              labels
              domain={d.rasterDomain}
              width={640}
              height={222}
              className="chart-fill"
            />
          </div>
          <div className="legend">
            <span>
              <span className="swatch" style={{ background: "var(--accent)" }} /> generate steps
              drive every other tool
            </span>
          </div>
        </Card>

        <Card span={2}>
          <CardHead title="Step latency" sub="ms per pipeline stage" />
          <div className="chart-frame">
            <Sparkline
              data={d.stepLatency}
              curve="smooth"
              dots="minmax"
              format={(n) => `${Math.round(n)}ms`}
              width={260}
              height={90}
              className="chart-fill"
              animate
              onSelect={setPinnedStep}
              selectedIndex={pinnedStep?.index ?? null}
            />
          </div>
          <StatLine
            items={[
              ["slowest", <span className="num">{d.stepNames[slowest]}</span>],
              ["max", <span className="num">{Math.max(...d.stepLatency)}ms</span>],
              [
                "pinned",
                <span className="num">
                  {pinnedStep
                    ? `${d.stepNames[pinnedStep.index]} ${Math.round(pinnedStep.value ?? 0)}ms`
                    : "—"}
                </span>,
              ],
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
