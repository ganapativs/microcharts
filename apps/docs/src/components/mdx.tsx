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
