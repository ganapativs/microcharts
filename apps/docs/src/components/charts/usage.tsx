import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { getChart } from "@/lib/catalog";
import { CopyButton } from "@/components/ui/copy";

/**
 * Always-visible import + usage for a chart — the fast path a reader wants up
 * top, never buried behind a Code tab. Sourced from the catalog so it matches
 * the shipped export paths exactly (docs-as-tests).
 */
export function Usage({ chart }: { chart: string }) {
  const c = getChart(chart);
  if (!c) return null;

  // catalog example.code is `import …\n\n<Usage … />`; split intro import + JSX.
  const [imports, ...rest] = c.example.code.split("\n\n");
  const usage = rest.join("\n\n");
  const install = "pnpm add @microcharts/react";

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div className="flex items-center justify-between gap-3 border-b border-fd-border px-4 py-2.5">
        <span className="mono-label">Install &amp; use</span>
        <span className="mono-label opacity-60">{c.staticImport.replace("@microcharts/", "")}</span>
      </div>

      <div className="flex items-center gap-3 border-b border-fd-border px-4 py-2.5">
        <span aria-hidden className="mono-label text-fd-primary">
          $
        </span>
        <code className="font-mono text-sm text-fd-foreground">{install}</code>
        <CopyButton text={install} className="ml-auto -mr-1.5" />
      </div>

      <div className="[&_figure]:!my-0 [&_figure]:!rounded-none [&_figure]:!border-0">
        <DynamicCodeBlock lang="tsx" code={`${imports}\n\n${usage}`} />
      </div>
    </div>
  );
}
