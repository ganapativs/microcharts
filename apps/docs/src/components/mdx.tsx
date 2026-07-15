import defaultMdxComponents from "fumadocs-ui/mdx";
import FdLink from "fumadocs-core/link";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { TrendArrow } from "@microcharts/react/trend-arrow";
import { StatusDot } from "@microcharts/react/status-dot";
import { HeatCell } from "@microcharts/react/heat-cell";
import { Progress } from "@microcharts/react/progress";
import { RugStrip } from "@microcharts/react/rug-strip";
import { MiniBar } from "@microcharts/react/mini-bar";
import { PictogramRow } from "@microcharts/react/pictogram-row";
import { Seismogram } from "@microcharts/react/seismogram";
import { HeatStrip } from "@microcharts/react/heat-strip";
import { DotPlot } from "@microcharts/react/dot-plot";
import { Dumbbell } from "@microcharts/react/dumbbell";
import { PairedBars } from "@microcharts/react/paired-bars";
import { Slope } from "@microcharts/react/slope";
import { MicroScatter } from "@microcharts/react/micro-scatter";
import {
  Threshold,
  TargetZone,
  Marker,
  Callout as ChartCallout,
} from "@microcharts/react/annotations";
import { Callout as DocCallout } from "fumadocs-ui/components/callout";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { TimeInRange } from "@microcharts/react/time-in-range";
import { Hypnogram } from "@microcharts/react/hypnogram";
import { EtaBar } from "@microcharts/react/eta-bar";
import { Waveform } from "@microcharts/react/waveform";
import { EventRaster } from "@microcharts/react/event-raster";
import { RubricStrip } from "@microcharts/react/rubric-strip";
import { TokenConfidence } from "@microcharts/react/token-confidence";
import { WindBarb } from "@microcharts/react/wind-barb";
import { StarSpoke } from "@microcharts/react/star-spoke";
import { MinimapStrip } from "@microcharts/react/minimap-strip";
import { DualWindowMeter } from "@microcharts/react/dual-window-meter";
import { DepthWedge } from "@microcharts/react/depth-wedge";
import { PartitionStrip } from "@microcharts/react/partition-strip";
import { CalibrationStrip } from "@microcharts/react/calibration-strip";
import { ConfusionGrid } from "@microcharts/react/confusion-grid";
import { FoldedDayBand } from "@microcharts/react/folded-day-band";
import { VolumeProfile } from "@microcharts/react/volume-profile";
import { PhaseTrace } from "@microcharts/react/phase-trace";
import { TraceFold } from "@microcharts/react/trace-fold";
import { TapeGauge } from "@microcharts/react/tape-gauge";
import { StationGlyph } from "@microcharts/react/station-glyph";
import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { MicroBox } from "@microcharts/react/micro-box";
import { ProgressRing } from "@microcharts/react/progress-ring";
import { MicroDonut } from "@microcharts/react/micro-donut";
import { Funnel } from "@microcharts/react/funnel";
import { LikertStrip } from "@microcharts/react/likert-strip";
import { Waterfall } from "@microcharts/react/waterfall";
import { BumpStrip } from "@microcharts/react/bump-strip";
import { DualSparkline } from "@microcharts/react/dual-sparkline";
import { StackedArea } from "@microcharts/react/stacked-area";
import { Ohlc } from "@microcharts/react/ohlc";
import { Horizon } from "@microcharts/react/horizon";
import { CalendarStrip } from "@microcharts/react/calendar-strip";
import { EventTimeline } from "@microcharts/react/event-timeline";
import { CoverageStrip } from "@microcharts/react/coverage-strip";
import { BenchmarkStrip } from "@microcharts/react/benchmark-strip";
import { PercentileLadder } from "@microcharts/react/percentile-ladder";
import { GradedBand } from "@microcharts/react/graded-band";
import { IconArray } from "@microcharts/react/icon-array";
import { RateVolume } from "@microcharts/react/rate-volume";
import { NetFlow } from "@microcharts/react/net-flow";
import { RetentionCurve } from "@microcharts/react/retention-curve";
import { BurnChart } from "@microcharts/react/burn-chart";
import { ErrorBudget } from "@microcharts/react/error-budget";
import { ControlStrip } from "@microcharts/react/control-strip";
import { ForecastCone } from "@microcharts/react/forecast-cone";
import { QuantileDots } from "@microcharts/react/quantile-dots";
import { ABStrips } from "@microcharts/react/ab-strips";
import { ShiftHistogram } from "@microcharts/react/shift-histogram";
import { ParetoStrip } from "@microcharts/react/pareto-strip";
import { DataDiff } from "@microcharts/react/data-diff";
import { QuadrantDot } from "@microcharts/react/quadrant-dot";
import { CyclePlot } from "@microcharts/react/cycle-plot";
import { ChangePoint } from "@microcharts/react/change-point";
import { EnsembleGhosts } from "@microcharts/react/ensemble-ghosts";
import { TallyMarks } from "@microcharts/react/tally-marks";
import { DicePips } from "@microcharts/react/dice-pips";
import { FillWord } from "@microcharts/react/fill-word";
import { FatDigits } from "@microcharts/react/fat-digits";
import { Thermometer } from "@microcharts/react/thermometer";
import { MoonPhase } from "@microcharts/react/moon-phase";
import { Hourglass } from "@microcharts/react/hourglass";
import { BalanceBeam } from "@microcharts/react/balance-beam";
import { SproutRow } from "@microcharts/react/sprout-row";
import { GardenGrid } from "@microcharts/react/garden-grid";
import { BubbleRow } from "@microcharts/react/bubble-row";
import { MusicStaff } from "@microcharts/react/music-staff";
import { TreeRings } from "@microcharts/react/tree-rings";
import { CitySkyline } from "@microcharts/react/city-skyline";
import { Honeycomb } from "@microcharts/react/honeycomb";
import { Constellation } from "@microcharts/react/constellation";
import { PolarClock } from "@microcharts/react/polar-clock";
import { SpiralYear } from "@microcharts/react/spiral-year";
import { BreathingDot } from "@microcharts/react/breathing-dot";
import { HeartbeatBlip } from "@microcharts/react/heartbeat-blip";
import { CometTrail } from "@microcharts/react/comet-trail";
import { OrbitStatus } from "@microcharts/react/orbit-status";
import { CohortTriangle } from "@microcharts/react/cohort-triangle";
import { StreakSpark } from "@microcharts/react/streak-spark";
import { GradeProfile } from "@microcharts/react/grade-profile";
import { WinProbWorm } from "@microcharts/react/win-prob-worm";
import { QueueDepth } from "@microcharts/react/queue-depth";
import { SpreadBand } from "@microcharts/react/spread-band";
import { BiasStrip } from "@microcharts/react/bias-strip";
import { PercentileTrace } from "@microcharts/react/percentile-trace";
import { SparkGroup } from "@microcharts/react";
import { Instrument } from "@/components/ui/instrument";
import { LiveDemo } from "@/components/ui/live-demo";
import { AnnotationHostGallery, AnnotationHostShowcase } from "@/components/annotation-hosts";
import { InstallCommand } from "@/components/ui/copy";
import { PackageTabs } from "@/components/ui/package-tabs";
import { GrammarExplorer, AgentCheatSheet } from "@/components/charts/ai-guide";
import { ProviderWall, SurfaceCards } from "@/components/charts/ai-static";
import { CatalogStrip } from "@/components/charts/catalog-strip";
import { TokenSwatches, PresetDeltas } from "@/components/charts/token-swatches";
import { Snippet } from "@/components/ui/snippet";
import { AgentPromptCopy } from "@/components/ui/agent-prompt-copy";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Accordions, Accordion } from "fumadocs-ui/components/accordion";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Step, Steps } from "fumadocs-ui/components/steps";
import {
  SizeDistribution,
  SizeTable,
  ScalingTable,
  ThroughputSummary,
  CatalogFacts,
} from "@/components/ui/perf";
import dynamic from "next/dynamic";
import type { FC } from "react";

// The stream demo is chart-heavy but registry-free (it imports a fixed handful
// of static charts directly), so it stays in the shared base for ai.mdx.
// `Playground` and `FourContexts` pull the full chart registry via `getModule`,
// so they live ONLY in the route-specific maps: `mdx-charts.tsx` gets the full
// versions; the guide map (`mdx-guide.tsx`) gets a narrow, registry-free
// `FourContexts`. Turbopack eager-bundles even `next/dynamic` targets referenced
// by the map, so a registry-dragging entry here would ship the 106-chart graph
// to every text guide — keep them out.
const StreamDemo = dynamic(() =>
  import("@/components/charts/stream-demo").then((m) => m.StreamDemo),
) as FC;

// `<Callout>` is overloaded: the microcharts chart annotation (`x`/`y`/`label`,
// nested inside a chart) and the Fumadocs doc callout (`type` + text). Dispatch
// on props so both work under one tag — the annotations page keeps the real API,
// and guide pages get proper doc callouts.
function Callout({
  x,
  y,
  ...props
}: ComponentProps<typeof DocCallout> & { x?: number; y?: number }) {
  // Chart annotation carries numeric x/y; the doc callout does not.
  if (typeof x === "number" || typeof y === "number") {
    return <ChartCallout {...({ x, y, ...props } as ComponentProps<typeof ChartCallout>)} />;
  }
  return <DocCallout {...props} />;
}
// A chart host resolves annotation children by a static brand on the child's
// *type*. This dispatcher is a different function than ChartCallout, so without
// forwarding the brand a `<Callout x y>` inside a chart isn't recognized as an
// annotation — it falls through and renders standalone (dev-warns). Copy the
// brand (ChartCallout's only own enumerable static) onto the wrapper.
Object.assign(Callout, ChartCallout);

/**
 * Shared, guide-safe MDX base map. Contains every component a text guide page
 * can render — the static (RSC-safe) chart primitives, annotations, doc building
 * blocks, the registry-free `CatalogStrip` teaser, and the registry-free
 * `StreamDemo` (it imports a fixed handful of static charts directly).
 *
 * It deliberately OMITS every component that pulls the 106-chart component
 * `registry` into a route's bundle: `Sizing`, `ChartChooser`, `Usage`,
 * `PropTable`, `Playground`, and the full `FourContexts`. The chart route re-adds
 * all of those via `mdx-charts.tsx#getChartMDXComponents`; the guide route
 * (`mdx-guide.tsx`) adds only a narrow, registry-free `FourContexts`. Keeping the
 * registry out here is what lets a pure-text guide (e.g. /docs/quickstart) ship
 * without the chart graph — Turbopack eager-bundles even `next/dynamic` targets
 * referenced by the map, so a registry-dragging entry could not hide behind lazy
 * loading.
 */
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // No eager prefetch on in-content links: a guide that mentions a few chart
    // pages would otherwise pull each target route's whole chunk graph on load.
    // Next still prefetches on hover/press, so navigation stays fast. Machine
    // surfaces (/catalog.json, /llms.txt, …) are files, not app routes — the
    // client router would 404 fetching route metadata for them, so they get a
    // plain anchor.
    a: (props: ComponentProps<"a">) =>
      /\.(json|txt|xml|md)$/.test(props.href ?? "") ? (
        <a {...props} />
      ) : (
        <FdLink prefetch={false} {...props} />
      ),
    // microcharts primitives — usable directly in any .mdx page
    Sparkline,
    SparkBar,
    Delta,
    Bullet,
    ActivityGrid,
    TrendArrow,
    StatusDot,
    HeatCell,
    Progress,
    RugStrip,
    MiniBar,
    PictogramRow,
    Seismogram,
    HeatStrip,
    DotPlot,
    Dumbbell,
    PairedBars,
    Slope,
    MicroScatter,
    Threshold,
    TargetZone,
    Marker,
    Callout,
    SegmentedBar,
    TimeInRange,
    Hypnogram,
    EtaBar,
    Waveform,
    EventRaster,
    RubricStrip,
    TokenConfidence,
    WindBarb,
    StarSpoke,
    MinimapStrip,
    DualWindowMeter,
    DepthWedge,
    PartitionStrip,
    CalibrationStrip,
    ConfusionGrid,
    FoldedDayBand,
    VolumeProfile,
    PhaseTrace,
    TraceFold,
    TapeGauge,
    StationGlyph,
    CohortTriangle,
    StreakSpark,
    GradeProfile,
    WinProbWorm,
    QueueDepth,
    SpreadBand,
    BiasStrip,
    PercentileTrace,
    HistogramStrip,
    MicroBox,
    ProgressRing,
    MicroDonut,
    Funnel,
    LikertStrip,
    Waterfall,
    BumpStrip,
    DualSparkline,
    StackedArea,
    Ohlc,
    Horizon,
    CalendarStrip,
    EventTimeline,
    CoverageStrip,
    BenchmarkStrip,
    PercentileLadder,
    GradedBand,
    IconArray,
    RateVolume,
    NetFlow,
    RetentionCurve,
    BurnChart,
    ErrorBudget,
    ControlStrip,
    ForecastCone,
    QuantileDots,
    ABStrips,
    ShiftHistogram,
    ParetoStrip,
    DataDiff,
    QuadrantDot,
    CyclePlot,
    ChangePoint,
    EnsembleGhosts,
    TallyMarks,
    DicePips,
    FillWord,
    FatDigits,
    Thermometer,
    MoonPhase,
    Hourglass,
    BalanceBeam,
    SproutRow,
    GardenGrid,
    BubbleRow,
    MusicStaff,
    TreeRings,
    CitySkyline,
    Honeycomb,
    Constellation,
    PolarClock,
    SpiralYear,
    BreathingDot,
    HeartbeatBlip,
    CometTrail,
    OrbitStatus,
    SparkGroup,
    // docs building blocks
    Instrument,
    LiveDemo,
    AnnotationHostGallery,
    AnnotationHostShowcase,
    InstallCommand,
    PackageTabs,
    StreamDemo,
    GrammarExplorer,
    AgentCheatSheet,
    CatalogStrip,
    TokenSwatches,
    PresetDeltas,
    ProviderWall,
    SurfaceCards,
    Snippet,
    AgentPromptCopy,
    DynamicCodeBlock,
    Accordions,
    Accordion,
    Tab,
    Tabs,
    Step,
    Steps,
    SizeDistribution,
    SizeTable,
    ScalingTable,
    ThroughputSummary,
    CatalogFacts,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
