"use client";

import { ABStrips } from "@microcharts/react/ab-strips/interactive";
import { ShiftHistogram } from "@microcharts/react/shift-histogram/interactive";
import { QuantileDots } from "@microcharts/react/quantile-dots/interactive";
import { ForecastCone } from "@microcharts/react/forecast-cone/interactive";
import { Topbar, PageHead, Card, SectionHead } from "../components/ui";
import {
  experiments,
  perfShift,
  upliftDraws,
  upliftThreshold,
  q4History,
  q4Forecast,
  q4Target,
  compact,
  ms,
} from "../data";

const fill = { width: "100%", height: "auto" } as const;
const rate1 = { maximumFractionDigits: 1 } as const;

export default function ExperimentsPage() {
  return (
    <>
      <Topbar title="Experiments" crumb="Pulse" />
      <div className="content">
        <PageHead
          index="04"
          eyebrow="Growth · testing"
          title="Experiments"
          sub="Every bet we're running, read honestly — the overlap is the answer, and the uncertainty is on the chart."
        />

        <Card
          title="Will we hit the Q4 target?"
          sub={`Target $${q4Target}k MRR`}
          className="section hover reveal reveal-1"
        >
          <ForecastCone
            animate
            data={q4History}
            forecast={q4Forecast}
            target={q4Target}
            unit="week"
            label="landing"
            format={compact}
            width={1040}
            height={250}
            style={fill}
            title="Q4 MRR forecast with an 80% prediction band against the target"
          />
          <p className="chart-note">
            The median projection lands just above target, but the{" "}
            <b>80% band still straddles it</b> — we clear Q4 only if expansion holds. Not a lock.
          </p>
        </Card>

        <SectionHead
          index="§ 01"
          title="Running experiments"
          sub="Control vs. variant · distribution, not a single number"
        />
        <div className="grid three-col section">
          {experiments.map((e, i) => (
            <Card key={e.name} className={`exp-card hover reveal reveal-${i + 1}`}>
              <div className="exp-top">
                <div>
                  <p className="exp-name">{e.name}</p>
                  <p className="exp-hyp">{e.hypothesis}</p>
                </div>
                <span className={`exp-status ${e.status}`}>{e.status}</span>
              </div>
              <ABStrips
                animate
                data={{ a: e.a, b: e.b }}
                seriesLabels={["Control", "Variant"]}
                positive={e.positive}
                label="delta"
                format={rate1}
                width={360}
                height={110}
                style={fill}
                title={`${e.name}: control versus variant, ${e.unit}`}
              />
            </Card>
          ))}
        </div>

        <SectionHead
          index="§ 02"
          title="Ship decision"
          sub="The perf fix, and the odds it's real"
        />
        <div className="grid two-col">
          <Card
            title="Page load time"
            sub="Before vs. after the fix · ms"
            className="hover reveal reveal-1"
          >
            <ShiftHistogram
              animate
              data={perfShift}
              seriesLabels={["before", "after"]}
              label="shift"
              format={ms}
              width={480}
              height={200}
              style={fill}
              title="Page-load time distribution, before and after the perf fix"
            />
            <p className="chart-note">
              The whole distribution moved left — a <b>~820ms median shift</b>, not a mean nudged by
              outliers. That&apos;s a real win.
            </p>
          </Card>

          <Card
            title="Activation uplift"
            sub="Posterior · will it beat zero?"
            className="hover reveal reveal-2"
          >
            <QuantileDots
              animate
              data={upliftDraws}
              threshold={upliftThreshold}
              side="above"
              count={20}
              label="count"
              format={rate1}
              width={480}
              height={200}
              style={fill}
              title="Posterior draws of the activation uplift versus the break-even line"
            />
            <p className="chart-note">
              Count the dots past zero: roughly <b>19 in 20</b> draws show a positive uplift. Strong
              evidence to ship.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
