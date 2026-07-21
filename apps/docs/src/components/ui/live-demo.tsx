import type { ReactNode } from "react";
import { CHART_GZIP } from "@/lib/stats";
import { getChart } from "@/lib/catalog";
import { ExpectWarn } from "@/components/ui/expect-warn";
import { LiveDemoView } from "@/components/ui/live-demo-view";
import { EntryDemoDual } from "@/components/ui/entry-demo-dual";
import type { SampleData } from "@/lib/charts/types";

/**
 * Live chart with optional Preview/Code toggle. Omit `code` for preview-only.
 *
 * Server component: it resolves the measured size meta and a chart's sample-data
 * from the catalog here, then hands plain, serializable props to the client
 * {@link LiveDemoView}. That keeps the 106-chart catalog out of every page's
 * client bundle — a text page that renders a `<LiveDemo>` ships only the tiny
 * view island, not the registry.
 *
 * When `sizeOf` is set (chart-page entry demo before Install), the preview is
 * the interactive twin from the chart module. Variant demos render `children` —
 * on chart-doc pages those tags are already the `/interactive` entries (see
 * `mdx-chart-tags-live`). Size meta still lists interactive · static gzip.
 */
export function LiveDemo({
  children,
  code,
  lang = "tsx",
  label,
  meta,
  sizeOf,
  dataOf,
  sampleData,
  grid = false,
  expectWarn = false,
}: {
  children?: ReactNode;
  code?: string;
  lang?: string;
  label?: string;
  meta?: string;
  /** Chart slug — measured gzip size as meta + sample-data for snippets. */
  sizeOf?: string;
  /** Override the slug used to resolve sample-data, when it differs from sizeOf. */
  dataOf?: string;
  /** Explicit sample-data for pages not in the chart registry (e.g. annotations). */
  sampleData?: SampleData[];
  grid?: boolean;
  /** Quiet intentional edge-case `devWarn` mounts (docs only). */
  expectWarn?: boolean;
}) {
  const sizes = sizeOf ? CHART_GZIP[sizeOf] : undefined;
  const metaText =
    meta ??
    (sizes
      ? sizes.interactive !== undefined
        ? `interactive · ${sizes.interactive} kB · static · ${sizes.static} kB`
        : `static · ${sizes.static} kB`
      : undefined);
  const data = sampleData ?? getChart(dataOf ?? sizeOf ?? "")?.sampleData;

  const preview = sizeOf ? (
    <EntryDemoDual slug={sizeOf} />
  ) : expectWarn ? (
    <ExpectWarn>{children}</ExpectWarn>
  ) : (
    children
  );

  return (
    <LiveDemoView
      code={code}
      lang={lang}
      label={label}
      metaText={metaText}
      sampleData={data}
      grid={grid}
    >
      {preview}
    </LiveDemoView>
  );
}
