import { useState } from "react";
import { CalibrationStrip } from "@microcharts/react/calibration-strip/interactive";
import { ConfusionGrid } from "@microcharts/react/confusion-grid/interactive";
import { PercentileTrace } from "@microcharts/react/percentile-trace/interactive";
import { QuantileDots } from "@microcharts/react/quantile-dots/interactive";
import { ControlStrip } from "@microcharts/react/control-strip/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { BiasStrip } from "@microcharts/react/bias-strip/interactive";
import { Card, CardHead, StatLine } from "./ui";
import * as d from "../data";

// Shared picker payload — includes 0.7 `formatted` (chart's own display string).
type Unit = { index: number; value: number | null; label?: string; formatted?: string } | null;

const mixColors = [
  "var(--mc-positive, #0e7a5f)",
  "var(--mc-negative, #bd4b2d)",
  "var(--mc-cat-1, #d2982f)",
  "var(--mc-cat-6, #a55a89)",
  "var(--mc-neutral, #8a8986)",
];

export function EvalsView() {
  const total = d.confusion.counts.flat().reduce((a, b) => a + b, 0);
  const correct = d.confusion.counts.reduce((a, row, i) => a + row[i], 0);
  const acc = ((correct / total) * 100).toFixed(1);
  const slaOdds = d.slaPastDots();
  const slaP50 = (() => {
    const s = d.slaSample.slice().sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)]!;
  })();

  const [calibActive, setCalibActive] = useState<Unit>(null);
  const [calibSelected, setCalibSelected] = useState<Unit>(null);
  const shownBin = calibActive ?? calibSelected;

  const [pinnedCell, setPinnedCell] = useState<Unit>(null);
  const [pinnedOutcome, setPinnedOutcome] = useState<Unit>(null);

  return (
    <div className="view-enter">
      <div className="view-head">
        <div className="eyebrow">Evaluation · release r24.7 · 12,842 cases</div>
        <h1>Is the model actually good, and is it staying good?</h1>
        <p>
          Reliability, error structure and standing across releases — the checks a launch decision
          rests on. Nothing here reduces to a single accuracy number, and that's the point.
        </p>
      </div>

      <div className="grid stagger">
        {/* Calibration */}
        <Card span={4}>
          <CardHead
            title="Calibration"
            sub="Observed frequency vs. the identity diagonal, per confidence bin"
            tag={<>reliability</>}
          />
          <div className="chart-frame">
            <CalibrationStrip
              data={d.calibration}
              mode="dots"
              width={640}
              height={246}
              className="chart-fill"
              animate
              readout={false}
              onActive={setCalibActive}
              onSelect={setCalibSelected}
              selectedIndex={calibSelected?.index ?? null}
            />
          </div>
          <div className="picker-readout">
            {shownBin ? (
              <>
                {shownBin.formatted ?? (
                  <>
                    predicted <span className="num">{shownBin.label}</span> → observed{" "}
                    <span className="num">{(shownBin.value ?? 0).toFixed(2)}</span>
                  </>
                )}
                {calibSelected && !calibActive ? " · pinned" : ""}
              </>
            ) : (
              "Hover or focus a bin — value lives here, not in a floating chip"
            )}
          </div>
          <div className="legend">
            <span>
              <span className="swatch" style={{ background: "var(--mc-neutral, #8a8986)" }} /> Bins
              above 0.6 drift below the line — mild over-confidence
            </span>
          </div>
        </Card>

        {/* Confusion */}
        <Card span={2}>
          <CardHead
            title="Intent classifier"
            sub="Row-normalized recall · 4 classes"
            tag={<>{acc}%</>}
          />
          <div style={{ display: "grid", placeItems: "center", padding: "var(--s2)" }}>
            <ConfusionGrid
              data={d.confusion}
              normalize="row"
              accent="diagonal"
              shape="round"
              label="accuracy"
              size={220}
              animate
              onSelect={setPinnedCell}
            />
          </div>
          <div className="picker-readout">
            {pinnedCell ? (
              <>
                pinned <span className="num">{pinnedCell.label}</span> ·{" "}
                <span className="num">{Math.round((pinnedCell.value ?? 0) * 100)}%</span> of row
              </>
            ) : (
              <>
                <span className="num">Other → Tech</span> is the busiest confusion
              </>
            )}
          </div>
        </Card>

        {/* Percentile trace */}
        <Card span={3}>
          <CardHead
            title="Standing across releases"
            sub="Percentile rank vs. the model population, locked 0–100 scale"
            tag={<>rank</>}
          />
          <div className="chart-frame">
            <PercentileTrace
              data={d.percentileTrace}
              showBands
              positive="up"
              unit="release"
              label="last"
              width={480}
              height={150}
              className="chart-fill"
              animate
            />
          </div>
          <StatLine
            items={[
              [
                "now",
                <span className="num">p{d.percentileTrace[d.percentileTrace.length - 1]}</span>,
              ],
              ["low", <span className="num">p{Math.min(...d.percentileTrace)}</span>],
              ["releases", <span className="num">{d.percentileTrace.length}</span>],
            ]}
          />
        </Card>

        {/* SLA odds */}
        <Card span={3}>
          <CardHead
            title="Will we miss the SLA?"
            sub={`Posterior latency draws vs. the ${d.slaThreshold}ms budget`}
            tag={<>odds</>}
          />
          <div className="chart-frame">
            <QuantileDots
              data={d.slaSample}
              count={d.slaDotCount}
              threshold={d.slaThreshold}
              side="above"
              label="count"
              width={480}
              height={150}
              className="chart-fill"
              style={{ width: "100%", height: "auto" }}
              animate
              title={`Posterior latency draws vs the ${d.slaThreshold}ms SLA`}
            />
          </div>
          <StatLine
            items={[
              [
                "miss",
                <span className="num">
                  {slaOdds} in {d.slaDotCount}
                </span>,
              ],
              ["SLA line", <span className="num">{d.slaThreshold}ms</span>],
              ["p50", <span className="num">{slaP50}ms</span>],
            ]}
          />
          <p className="legend">
            Vertical line is the {d.slaThreshold}ms budget. Accent-ringed dots are quantile draws
            above it — {slaOdds} of {d.slaDotCount} (~{Math.round((slaOdds / d.slaDotCount) * 100)}%
            chance of missing).
          </p>
        </Card>

        {/* Drift control */}
        <Card span={3}>
          <CardHead
            title="Quality drift monitor"
            sub="Daily pass-rate vs. the ±3σ̂ control band · Western Electric rules"
            tag={<>SPC</>}
          />
          <div className="chart-frame">
            <ControlStrip
              data={d.driftSeries}
              baseline={d.driftBaseline}
              rules="we"
              dots="out"
              width={480}
              height={184}
              className="chart-fill"
              animate
            />
          </div>
          <div className="legend">
            <span>
              <span className="swatch" style={{ background: "var(--mc-negative, #bd4b2d)" }} /> An
              excursion around day 31 tripped a run rule
            </span>
          </div>
        </Card>

        <Card span={3}>
          <CardHead
            title="Model vs. human judge"
            sub="Bland–Altman · score pairs on the same cases"
            tag={<>bias</>}
          />
          <div className="chart-frame">
            <BiasStrip
              data={d.judgePairs}
              limits={1.96}
              label="bias"
              format={{ maximumFractionDigits: 2 }}
              width={480}
              height={184}
              className="chart-fill"
              style={{ width: "100%", height: "auto" }}
              animate
              title="Agreement between model scores and human judges"
            />
          </div>
          <p className="legend">
            Dashed line = perfect agreement (diff 0). Solid accent = measured bias (
            {d.judgeBias >= 0 ? "+" : ""}
            {d.judgeBias}). Dots are case pairs at (mean score, model−human).
          </p>
        </Card>

        {/* Pass rate bullet + label mix */}
        <Card span={6}>
          <CardHead title="Suite pass-rate" sub="Against the 90% launch gate" />
          <div className="chart-frame">
            <Bullet
              value={d.passRate.value}
              target={d.passRate.target}
              bands={d.passRate.bands}
              domain={[0, 100]}
              format={(n) => `${n}%`}
              width={280}
              height={44}
              className="chart-fill"
              animate
            />
          </div>
          <StatLine
            items={[
              ["pass", <span className="num">{d.passRate.value}%</span>],
              ["gate", <span className="num">{d.passRate.target}%</span>],
              [
                "gap",
                <span className="num">−{(d.passRate.target - d.passRate.value).toFixed(1)}</span>,
              ],
            ]}
          />

          <div style={{ marginTop: "var(--s2)" }}>
            <div className="card-sub" style={{ marginBottom: "var(--s2)" }}>
              Outcome mix · {d.fmtInt(d.labelMix.reduce((a, m) => a + m.value, 0))} cases
            </div>
            <SegmentedBar
              data={d.labelMix}
              order="data"
              label="percent"
              colors={mixColors}
              width={280}
              height={26}
              className="chart-fill"
              animate
              onSelect={setPinnedOutcome}
            />
            <div className="legend" style={{ marginTop: "var(--s3)" }}>
              {d.labelMix.map((m, i) => (
                <span key={m.label}>
                  <span className="swatch" style={{ background: mixColors[i] }} /> {m.label}
                </span>
              ))}
            </div>
            {pinnedOutcome ? (
              <div className="picker-readout">
                pinned <span className="num">{pinnedOutcome.label}</span> ·{" "}
                <span className="num">{d.fmtInt(pinnedOutcome.value ?? 0)}</span> cases
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
