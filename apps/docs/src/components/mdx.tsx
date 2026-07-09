import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
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
import { Threshold, TargetZone, Marker, Callout } from "@microcharts/react/annotations";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
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
import { SparkGroup } from "@microcharts/react";
import { Instrument } from "@/components/ui/instrument";
import { LiveDemo } from "@/components/ui/live-demo";
import { InstallCommand } from "@/components/ui/copy";
import { FourContexts } from "@/components/charts/contexts";
import { Sizing } from "@/components/charts/sizing";
import { Playground } from "@/components/charts/playground";
import { Usage } from "@/components/charts/usage";
import { InteractiveDemo } from "@/components/charts/interactive";
import { PropTable } from "@/components/charts/prop-table";
import { PackageTabs } from "@/components/ui/package-tabs";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
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
    SparkGroup,
    // docs building blocks
    Instrument,
    LiveDemo,
    InstallCommand,
    FourContexts,
    Sizing,
    Playground,
    Usage,
    InteractiveDemo,
    PropTable,
    PackageTabs,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
