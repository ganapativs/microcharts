"use client";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CHART_GZIP } from "@/lib/stats";
import { CodeWithData } from "@/components/ui/code-with-data";
import { getChart } from "@/lib/catalog";
import type { SampleData } from "@/lib/charts/types";

type Tab = "preview" | "code";

/**
 * Live demo surface: the real chart rendered above a Preview/Code toggle.
 * The code shown is the literal source for the rendered example.
 *
 * `code` is optional — when omitted, the surface renders the preview only
 * (no Preview/Code seg, no code tab). Use this for hero demos whose snippet
 * would just repeat the Install card's canonical usage right below it; the
 * hero's job is to show the chart doing its job, not duplicate the snippet.
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
}: {
  children: ReactNode;
  code?: string;
  lang?: string;
  label?: string;
  meta?: string;
  /** Chart slug — renders the MEASURED static gzip size as the meta text, so
      doc pages never hand-key a number that can go stale. Also resolves the
      chart's sample-data so any `data={var}` in the snippet stays runnable. */
  sizeOf?: string;
  /** Override the slug used to resolve sample-data, when it differs from sizeOf. */
  dataOf?: string;
  /** Explicit sample-data for pages not in the chart registry (e.g. annotations). */
  sampleData?: SampleData[];
  grid?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("preview");
  const size = sizeOf ? CHART_GZIP[sizeOf]?.static : undefined;
  const metaText = meta ?? (size !== undefined ? `static · ${size} kB` : undefined);
  const data = sampleData ?? getChart(dataOf ?? sizeOf ?? "")?.sampleData;
  const hasCode = code !== undefined;

  return (
    <div className="not-prose my-6 panel overflow-hidden">
      {/* flex-wrap + nowrap labels: at phone widths the seg drops to its own
          line instead of the meta text breaking mid-token. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-hairline px-3 py-2">
        {label ? <span className="mono-label whitespace-nowrap pl-1">{label}</span> : <span />}
        <div className="flex items-center gap-2">
          {metaText ? (
            <span className="mono-label mr-1 whitespace-nowrap opacity-70">{metaText}</span>
          ) : null}
          {hasCode ? (
            <div role="tablist" aria-label="Demo view" className="seg">
              {(["preview", "code"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  data-active={tab === t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="seg-opt uppercase"
                >
                  {t}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {!hasCode || tab === "preview" ? (
        <div
          className={cn(
            "flex min-h-32 flex-wrap items-center justify-center gap-6 px-6 py-10",
            grid && "grid-paper",
          )}
        >
          {children}
        </div>
      ) : (
        <CodeWithData code={code} sampleData={data} lang={lang} />
      )}
    </div>
  );
}
