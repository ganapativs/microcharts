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
      {/* flex-wrap + nowrap labels: at phone widths the seg drops to its own
          line instead of the meta text breaking mid-token. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-hairline px-3 py-2">
        {label ? <span className="mono-label whitespace-nowrap pl-1">{label}</span> : <span />}
        <div className="flex items-center gap-2">
          {meta ? (
            <span className="mono-label mr-1 whitespace-nowrap opacity-70">{meta}</span>
          ) : null}
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
        <div className="code-inset">
          <DynamicCodeBlock lang={lang} code={code} />
        </div>
      )}
    </div>
  );
}
