"use client";
import { useState, type ReactNode } from "react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { cn } from "@/lib/cn";

type Tab = "preview" | "code";

/**
 * Live demo surface: the real chart rendered above a Preview/Code toggle.
 * The code shown is the literal source for the rendered example.
 */
export function LiveDemo({
  children,
  code,
  lang = "tsx",
  label,
  meta,
  grid = false,
}: {
  children: ReactNode;
  code: string;
  lang?: string;
  label?: string;
  meta?: string;
  grid?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("preview");

  return (
    <div className="not-prose my-6 panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-fd-border px-3 py-2">
        {label ? <span className="mono-label pl-1">{label}</span> : <span />}
        <div className="flex items-center gap-2">
          {meta ? <span className="mono-label opacity-70 mr-1">{meta}</span> : null}
          <div
            role="tablist"
            aria-label="Demo view"
            className="relative flex rounded-md border border-fd-border bg-fd-muted/60 p-0.5 text-xs"
          >
            {(["preview", "code"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "relative z-10 rounded px-3 py-1 font-mono uppercase tracking-wider transition-colors",
                  tab === t
                    ? "text-fd-foreground"
                    : "text-fd-muted-foreground hover:text-fd-foreground",
                )}
              >
                {tab === t && (
                  <span className="absolute inset-0 -z-10 rounded bg-fd-card shadow-sm ring-1 ring-fd-border" />
                )}
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === "preview" ? (
        <div
          className={cn(
            "flex min-h-32 flex-wrap items-center justify-center gap-6 px-6 py-10",
            grid && "grid-paper",
          )}
        >
          {children}
        </div>
      ) : (
        <div className="[&_figure]:!my-0 [&_figure]:!rounded-none [&_figure]:!border-0">
          <DynamicCodeBlock lang={lang} code={code} />
        </div>
      )}
    </div>
  );
}
