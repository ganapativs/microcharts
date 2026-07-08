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
    <div className="panel not-prose my-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <span className="mono-label">Install &amp; use</span>
        <span className="mono-label opacity-60">{c.staticImport.replace("@microcharts/", "")}</span>
      </div>

      <div className="flex items-center gap-2.5 border-b border-hairline py-2 pl-4 pr-2">
        <code className="min-w-0 flex-1 truncate font-mono text-sm leading-6 text-fd-foreground">
          <span aria-hidden className="mr-2 select-none text-fd-primary">
            $
          </span>
          {install}
        </code>
        <CopyButton text={install} className="shrink-0" />
      </div>

      <div className="code-inset">
        <DynamicCodeBlock lang="tsx" code={`${imports}\n\n${usage}`} />
      </div>
    </div>
  );
}
