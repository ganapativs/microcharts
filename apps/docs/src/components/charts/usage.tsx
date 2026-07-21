import { getChart } from "@/lib/catalog";
import { CodeWithData } from "@/components/ui/code-with-data";
import { SetupWithAi } from "@/components/ui/setup-with-ai";

/** Import + usage for a chart; setup strip points at full install (pkg + CSS). */
export function Usage({ chart }: { chart: string }) {
  const c = getChart(chart);
  if (!c) return null;

  // catalog example.code is `import …\n\n<Usage … />`; split intro import + JSX.
  const [imports, ...rest] = c.example.code.split("\n\n");
  const usage = rest.join("\n\n");

  return (
    <div className="panel not-prose my-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <span className="mono-label">Import &amp; use</span>
        <span className="mono-label opacity-60">{c.staticImport.replace("@microcharts/", "")}</span>
      </div>

      <CodeWithData code={`${imports}\n\n${usage}`} sampleData={c.sampleData} />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-hairline px-4 py-2">
        <span className="mono-label opacity-50">Needs package + stylesheet</span>
        <SetupWithAi variant="link" />
      </div>
    </div>
  );
}
