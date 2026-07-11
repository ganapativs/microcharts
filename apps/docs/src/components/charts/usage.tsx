import { getChart } from "@/lib/catalog";
import { CopyButton } from "@/components/ui/copy";
import { CommandLine } from "@/components/ui/command-line";
import { CodeWithData } from "@/components/ui/code-with-data";

/**
 * Import + usage for a chart. The import is the payload a reader wants up top;
 * the install command rides underneath as a quiet footnote — they installed the
 * package on the quickstart, so it's kept reachable, not repeated at full volume.
 * Snippet vars resolve through the sample-data disclosure (docs-as-tests).
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
        <span className="mono-label">Import &amp; use</span>
        <span className="mono-label opacity-60">{c.staticImport.replace("@microcharts/", "")}</span>
      </div>

      <CodeWithData code={`${imports}\n\n${usage}`} sampleData={c.sampleData} />

      {/* Install — demoted to a hairline footer: small, muted, no shouting `$`. */}
      <div className="flex items-center gap-2 border-t border-hairline px-4 py-1.5">
        <span className="mono-label opacity-50">install</span>
        <CommandLine
          command={install}
          prompt={false}
          dim
          className="min-w-0 flex-1 truncate text-xs"
        />
        <CopyButton text={install} size={7} className="shrink-0 opacity-60" />
      </div>
    </div>
  );
}
