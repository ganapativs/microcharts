"use client";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/components/ui/copy";
import type { SampleData } from "@/lib/charts/types";

/**
 * A code snippet that stays clean (`data={accounts}`) while the definitions its
 * variables need sit one click away in a collapsible "sample data" disclosure —
 * so what's shown reads uncluttered but what's copied always runs.
 *
 * `copyAll` copies the sample data + snippet as one runnable block; the inline
 * snippet keeps its own Fumadocs copy for the common "I already have data" case.
 */
export function CodeWithData({
  code,
  sampleData,
  lang = "tsx",
  className,
}: {
  code: string;
  sampleData?: SampleData[];
  lang?: string;
  className?: string;
}) {
  // Standard: raw data literals live ONLY in the "Sample data" disclosure —
  // snippets reference the variable and carry a one-line pointer comment
  // (added here so all pages stay consistent and it can never drift). A demo
  // that declares the variable itself gets no disclosure (no duplication).
  const used = (sampleData ?? []).filter(
    (s) =>
      new RegExp(`\\b${s.name}\\b`).test(code) &&
      !new RegExp(`\\b(?:const|let|var)\\s+${s.name}\\b`).test(code),
  );
  const defs = used.length ? used.map((s) => s.code).join("\n\n") : "";
  const pointer = used.length
    ? `// ${used.map((s) => s.name).join(", ")} — real values under “Sample data” below\n`
    : "";
  const shown = pointer && !code.includes("Sample data") ? pointer + code : code;
  const runnable = defs ? `${defs}\n\n${code}` : code;

  return (
    <div className={cn("code-inset", className)}>
      <DynamicCodeBlock lang={lang} code={shown} />
      {defs ? (
        <details className="sample-data group/sd">
          <summary className="sample-data-summary">
            <ChevronRight className="size-3.5 shrink-0 transition-transform group-open/sd:rotate-90" />
            <span className="mono-label">Sample data</span>
            <span className="ml-auto pr-1">
              <CopyButton text={runnable} size={7} className="opacity-70" />
            </span>
          </summary>
          <div className="sample-data-body">
            <DynamicCodeBlock lang={lang} code={defs} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
