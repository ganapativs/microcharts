// Showcase grid: every value-series chart hosting live annotation marks.
// Static/RSC-safe — all hosts are pure SVG, annotations are pure SVG. Used on
// the Annotations doc page inside a <LiveDemo> (Preview = this grid, Code = a
// representative snippet). Annotation coordinates are curated per chart so no
// label overlaps another or the chart's own endpoint labels.
import type { ReactNode } from "react";
import { LiveDemo } from "@/components/ui/live-demo";
import { Threshold, TargetZone, Marker, Callout } from "@microcharts/react/annotations";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { MiniBar } from "@microcharts/react/mini-bar";
import { CyclePlot } from "@microcharts/react/cycle-plot";
import { CitySkyline } from "@microcharts/react/city-skyline";
import { ChangePoint } from "@microcharts/react/change-point";
import { DualSparkline } from "@microcharts/react/dual-sparkline";
import { SpreadBand } from "@microcharts/react/spread-band";
import { ForecastCone } from "@microcharts/react/forecast-cone";
import { ControlStrip } from "@microcharts/react/control-strip";
import { QueueDepth } from "@microcharts/react/queue-depth";
import { BurnChart } from "@microcharts/react/burn-chart";
import { Waterfall } from "@microcharts/react/waterfall";
import { PercentileTrace } from "@microcharts/react/percentile-trace";
import { RetentionCurve } from "@microcharts/react/retention-curve";
import { WinProbWorm } from "@microcharts/react/win-prob-worm";
import { ErrorBudget } from "@microcharts/react/error-budget";

const W = 220;
const H = 84;

const WEEKS: number[] = [];
for (let w = 0; w < 6; w++) WEEKS.push(38, 40 + w * 2, 45, 48, 52, 61, 44);
const TEAMS = [
  { label: "Platform", value: 46, lit: 0.7 },
  { label: "Core", value: 32, lit: 0.5 },
  { label: "Web", value: 28, lit: 0.9 },
  { label: "API", value: 40, lit: 0.3 },
  { label: "Data", value: 18, lit: 0.6 },
];
const ERRORS = [
  ...Array(14)
    .fill(0)
    .map((_, i) => 30 + ((i * 7) % 5) - 2),
  ...Array(20)
    .fill(0)
    .map((_, i) => 48 + ((i * 5) % 5) - 2),
];
const US = [12, 13, 12.4, 14, 15.2, 14.8, 16, 17.5, 17, 18.4, 19, 21];
const BENCH = [12, 12.4, 12.8, 13.1, 13.6, 14, 14.2, 14.8, 15, 15.4, 15.8, 16];
const ORG = [8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24];
const PAID = [12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 16, 16];
const PAIRS = ORG.map((a, i) => ({ a, b: PAID[i]! }));
const HIST = [30, 32, 31, 34, 36, 35, 38];
const FORE = {
  mid: [39, 40, 41, 42],
  p80: [
    [36, 42],
    [35, 45],
    [34, 50],
    [33, 55],
  ] as [number, number][],
};
const CONTROL = [
  74, 73, 75, 74, 76, 73, 74, 75, 74, 73, 82, 74, 75, 73, 74, 76, 74, 73, 75, 74, 66, 74, 75, 74,
  73, 76, 74, 75, 74, 73,
];
const QUEUE = [42, 55, 70, 88, 96, 120, 150, 182, 214];
const PLAN = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
const ACTUAL = [40, 38, 36, 34, 32, 30];
const PL = [
  { label: "Product", value: 300 },
  { label: "Services", value: 120 },
  { label: "Refunds", value: -140 },
  { label: "Upsells", value: 60 },
  { label: "Churn", value: -80 },
];
const PCT = [40, 46, 52, 58, 63, 68, 72, 76, 79, 81];
const RET = [1, 0.72, 0.55, 0.47, 0.42, 0.4, 0.39, 0.385, 0.382, 0.38, 0.379, 0.378];
const GAME = [50, 48, 45, 52, 60, 58, 42, 38, 55, 68, 82, 90, 88, 94, 98];
const BUDGET = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];

function Cell({ name, mark, children }: { name: string; mark: string; children: ReactNode }) {
  return (
    <figure className="not-prose m-0 flex flex-col gap-3 rounded-xl border border-hairline p-4">
      <figcaption className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tracking-tight">{name}</span>
        <span className="mono-label rounded-full border border-hairline px-2 py-0.5">{mark}</span>
      </figcaption>
      {/* Charts render at their intrinsic viewBox width (some carry a right-hand
          label gutter wider than the base width); cap to the cell and center so
          nothing spills past the card, and let height follow the aspect ratio. */}
      <div className="flex h-24 items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full">
        {children}
      </div>
    </figure>
  );
}

export function AnnotationHostGallery() {
  return (
    <div
      className="grid w-full gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
    >
      <Cell name="Sparkline" mark="TargetZone · Threshold">
        <Sparkline data={[48, 52, 45, 58, 51, 47, 55, 49, 71, 64, 57, 52]} width={W} height={H}>
          <TargetZone y={[40, 60]} />
          <Threshold y={68} label="SLA" />
        </Sparkline>
      </Cell>

      <Cell name="SparkBar" mark="TargetZone · Threshold">
        <SparkBar data={[4, 7, 3, 9, 6, 8, 5, 11, 7, 9]} width={W} height={H}>
          <TargetZone y={[3, 8]} />
          <Threshold y={10} label="cap" />
        </SparkBar>
      </Cell>

      <Cell name="MiniBar" mark="Threshold">
        <MiniBar data={TEAMS.map((t) => ({ label: t.label, value: t.value }))} width={W} height={H}>
          <Threshold y={38} label="target" />
        </MiniBar>
      </Cell>

      <Cell name="CyclePlot" mark="TargetZone · Marker">
        <CyclePlot data={WEEKS} period={7} width={W} height={H}>
          <TargetZone y={[42, 52]} />
          <Marker x={0} label="Sun" />
        </CyclePlot>
      </Cell>

      <Cell name="CitySkyline" mark="Threshold">
        <CitySkyline data={TEAMS} height={H}>
          <Threshold y={40} label="cap" />
        </CitySkyline>
      </Cell>

      <Cell name="ChangePoint" mark="Threshold">
        <ChangePoint data={ERRORS} width={W} height={H}>
          <Threshold y={38} label="baseline" />
        </ChangePoint>
      </Cell>

      <Cell name="DualSparkline" mark="TargetZone">
        <DualSparkline data={US} compare={BENCH} width={W} height={H}>
          <TargetZone y={[13, 16]} />
        </DualSparkline>
      </Cell>

      <Cell name="SpreadBand" mark="Marker">
        <SpreadBand data={PAIRS} labels={["Organic", "Paid"]} width={W} height={H}>
          <Marker x={4} label="launch" />
        </SpreadBand>
      </Cell>

      <Cell name="ForecastCone" mark="Marker">
        <ForecastCone data={HIST} forecast={FORE} width={W} height={H}>
          <Marker x={6} label="today" />
        </ForecastCone>
      </Cell>

      <Cell name="ControlStrip" mark="Marker">
        <ControlStrip data={CONTROL} width={W} height={H}>
          <Marker x={20} label="excursion" />
        </ControlStrip>
      </Cell>

      <Cell name="QueueDepth" mark="Marker">
        <QueueDepth data={QUEUE} capacity={100} width={W} height={H}>
          <Marker x={5} label="breach" />
        </QueueDepth>
      </Cell>

      <Cell name="BurnChart" mark="Marker">
        <BurnChart data={{ plan: PLAN, actual: ACTUAL }} label="none" width={W} height={H}>
          <Marker x={9} label="deadline" />
        </BurnChart>
      </Cell>

      <Cell name="Waterfall" mark="Threshold">
        <Waterfall data={PL} width={W} height={H}>
          <Threshold y={320} label="target" />
        </Waterfall>
      </Cell>

      <Cell name="PercentileTrace" mark="Threshold">
        <PercentileTrace data={PCT} width={W} height={H}>
          <Threshold y={50} label="median" />
        </PercentileTrace>
      </Cell>

      <Cell name="RetentionCurve" mark="Threshold">
        <RetentionCurve data={RET} width={W} height={H}>
          <Threshold y={0.6} label="target" />
        </RetentionCurve>
      </Cell>

      <Cell name="WinProbWorm" mark="Marker · celebrate">
        <WinProbWorm data={GAME} width={W} height={H}>
          <Marker x={9} celebrate label="swing" />
        </WinProbWorm>
      </Cell>

      <Cell name="ErrorBudget" mark="Callout">
        <ErrorBudget data={BUDGET} window={30} width={W} height={H}>
          <Callout x={5} y={0.82} label="deploy dip" />
        </ErrorBudget>
      </Cell>
    </div>
  );
}

// Snippet lives here (a TS template literal), NOT in the MDX `code={...}` prop:
// MDX strips leading indentation from template-literal attributes, so authoring
// it in TS is the only way the nesting survives to the rendered code block.
const HOSTS_SNIPPET = `import { Sparkline } from "@microcharts/react/sparkline";
import { MiniBar } from "@microcharts/react/mini-bar";
import { CyclePlot } from "@microcharts/react/cycle-plot";
import { ForecastCone } from "@microcharts/react/forecast-cone";
import { WinProbWorm } from "@microcharts/react/win-prob-worm";
import { ErrorBudget } from "@microcharts/react/error-budget";
import {
  Threshold,
  TargetZone,
  Marker,
  Callout,
} from "@microcharts/react/annotations";

// TargetZone — a normal-range band, drawn beneath the data ink —
// paired with a Threshold hairline at the SLA line.
<Sparkline data={latency} width={220} height={84}>
  <TargetZone y={[40, 60]} />
  <Threshold y={68} label="SLA" />
</Sparkline>;

// The same <Threshold> child, resolved on a different host's scale —
// here on category bars, addressing a data value on the y-axis.
<MiniBar data={regions} width={220} height={84}>
  <Threshold y={38} label="target" />
</MiniBar>;

// TargetZone + Marker — Marker x addresses the slot index.
<CyclePlot data={weeks} period={7} width={220} height={84}>
  <TargetZone y={[42, 52]} />
  <Marker x={0} label="Sun" />
</CyclePlot>;

// Marker — a vertical moment mark; x is the period index on the frame.
<ForecastCone data={history} forecast={cone} width={220} height={84}>
  <Marker x={6} label="today" />
</ForecastCone>;

// Marker with a one-shot celebrate burst for a milestone crossing;
// the particles are seeded from the data, so SSR and client agree.
<WinProbWorm data={game} width={220} height={84}>
  <Marker x={9} celebrate label="swing" />
</WinProbWorm>;

// Callout — one narrated point on an elbow hairline.
<ErrorBudget data={remaining} window={30} width={220} height={84}>
  <Callout x={5} y={0.82} label="deploy dip" />
</ErrorBudget>;
`;

/** The gallery wrapped in a LiveDemo (Preview + Code toggle), with the code
 *  sourced from {@link HOSTS_SNIPPET} so its indentation survives. */
export function AnnotationHostShowcase(): ReactNode {
  return (
    <LiveDemo label="All 17 hosts" code={HOSTS_SNIPPET}>
      <AnnotationHostGallery />
    </LiveDemo>
  );
}
