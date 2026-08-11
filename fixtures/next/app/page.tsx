// Server Component (no 'use client'). Every chart on this page is a REAL
// shipped static entry, imported from its own subpath the way a consumer
// imports it. The page renders to static HTML on the server; verify-rsc.mjs
// asserts the charts and their generated summaries are in the HTML and that no
// client JS chunk references chart code.
import { SparkGroup } from "@microcharts/react";
import { Marker, Threshold } from "@microcharts/react/annotations";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { Progress } from "@microcharts/react/progress";
import { ProgressRing } from "@microcharts/react/progress-ring";
import { MicroDonut } from "@microcharts/react/micro-donut";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { HeatStrip } from "@microcharts/react/heat-strip";
import { Dumbbell } from "@microcharts/react/dumbbell";
import { Waterfall } from "@microcharts/react/waterfall";
import { Funnel } from "@microcharts/react/funnel";
import { StackedArea } from "@microcharts/react/stacked-area";
import { Ohlc } from "@microcharts/react/ohlc";
import { EventTimeline } from "@microcharts/react/event-timeline";
import { Hypnogram } from "@microcharts/react/hypnogram";
import { MicroBox } from "@microcharts/react/micro-box";
import { MoonPhase } from "@microcharts/react/moon-phase";
import { FatDigits } from "@microcharts/react/fat-digits";
import { TokenConfidence } from "@microcharts/react/token-confidence";
import { WindBarb } from "@microcharts/react/wind-barb";
import { PolarClock } from "@microcharts/react/polar-clock";
import { WinProbWorm } from "@microcharts/react/win-prob-worm";

const revenue = [3, 5, 4, 8, 6, 9, 7, 10, 8, 12];
const wave = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const cats = [
  { label: "East", value: 47 },
  { label: "West", value: 41 },
  { label: "South", value: 33 },
  { label: "North", value: 44 },
];
const activity = Array.from({ length: 91 }, (_, i) => (i * 7) % 5);
const candles = Array.from({ length: 20 }, (_, i) => {
  const b = 140 + Math.sin(i / 3) * 8 + i * 0.6;
  return { open: b, high: b + 4, low: b - 4, close: b + (i % 2 ? 2 : -1.5) };
});
const day = Array.from({ length: 24 }, (_, h) => (h === 14 ? 312 : h === 4 ? 20 : 80 + h));

export default function Page() {
  return (
    <main style={{ font: "15px/1.6 system-ui, sans-serif", padding: 32, maxWidth: 720 }}>
      <h1>microcharts — RSC static</h1>
      <p>
        Weekly revenue <Sparkline data={revenue} title="Weekly revenue" /> trending up, latency{" "}
        <SparkBar data={wave} title="Latency" /> creeping, conversion{" "}
        <Delta value={0.124} title="Conversion" /> against target{" "}
        <Bullet value={68} target={80} bands={[50, 90]} title="Target" />.
      </p>
      <p>
        Annotated:{" "}
        <Sparkline data={wave} title="Annotated series">
          <Threshold y={18} label="SLO" />
          <Marker x={7} label="deploy" />
        </Sparkline>{" "}
        and a shared-scale group{" "}
        <SparkGroup height={16}>
          <Sparkline data={revenue} title="North" />
          <Sparkline data={wave} title="South" />
        </SparkGroup>
      </p>
      <p>
        Rollout <Progress value={0.44} title="Rollout" />, ring{" "}
        <ProgressRing value={0.68} title="Quarter" />, mix <MicroDonut data={cats} title="Mix" />{" "}
        <SegmentedBar data={cats} title="Share" />.
      </p>
      <p>
        A quarter of activity <ActivityGrid data={activity} title="Activity" />, heat{" "}
        <HeatStrip data={wave} title="Heat" />, before/after{" "}
        <Dumbbell
          data={cats.map((d) => ({ label: d.label, from: d.value, to: (d.value * 1.3) % 60 }))}
          title="Before and after"
        />
        .
      </p>
      <p>
        Bridge{" "}
        <Waterfall
          data={[
            { label: "Start", value: 42 },
            { label: "Q1", value: 8 },
            { label: "Q2", value: -5 },
            { label: "Q3", value: 12 },
          ]}
          title="Bridge"
        />
        , funnel{" "}
        <Funnel
          data={[
            { label: "Visit", value: 9800 },
            { label: "Sign up", value: 2300 },
            { label: "Activate", value: 940 },
          ]}
          title="Funnel"
        />
        , bands{" "}
        <StackedArea
          data={[
            { label: "A", values: [30, 40, 55, 60] },
            { label: "B", values: [20, 24, 22, 30] },
          ]}
          title="Bands"
        />
        , candles <Ohlc data={candles} title="Candles" />.
      </p>
      <p>
        Timeline{" "}
        <EventTimeline
          data={[
            { start: 0, end: 40, label: "Freeze", kind: "accent" },
            { start: 55, end: 80, label: "Launch" },
          ]}
          title="Timeline"
        />
        , sleep{" "}
        <Hypnogram
          data={[
            { t: 0, state: "Awake" },
            { t: 8, state: "Light" },
            { t: 22, state: "Deep" },
            { t: 50, state: "REM" },
            { t: 110, state: "Awake" },
          ]}
          states={["Awake", "REM", "Light", "Deep"]}
          domain={[0, 120]}
          title="Sleep"
        />
        , spread <MicroBox data={wave} title="Spread" />.
      </p>
      <p>
        Moon <MoonPhase value={0.62} title="Moon" />, count{" "}
        <FatDigits value={1204} domain={[0, 2100]} title="Count" />, wind{" "}
        <WindBarb direction={225} magnitude={32} title="Wind" />, day{" "}
        <PolarClock data={day} title="By hour" />, win odds{" "}
        <WinProbWorm
          data={[50, 48, 45, 52, 60, 58, 42, 38, 55, 68, 82, 90, 94, 98]}
          sides={["home", "away"]}
          title="Win probability"
        />
        .
      </p>
      <p>
        <TokenConfidence
          data={[
            { token: "The ", confidence: 0.98 },
            { token: "answer ", confidence: 0.71 },
            { token: "is ", confidence: 0.93 },
            { token: "42", confidence: 0.4 },
          ]}
        />
      </p>
    </main>
  );
}
