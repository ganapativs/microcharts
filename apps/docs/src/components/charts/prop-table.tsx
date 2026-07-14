import { getChart } from "@/lib/catalog";
import { PropTableView, type PropRow } from "./prop-table-view";

const ANIMATE_NOTES =
  'Interactive entry only. Opt-in entrance motion when the chart mounts client-side — add import "@microcharts/react/motion" once. Inert on the server, on hydrated server HTML, and under prefers-reduced-motion.';

/** Renders a chart's prop table from the catalog registry (single source). */
export function PropTable({ slug }: { slug: string }) {
  const chart = getChart(slug);
  if (!chart) return null;

  const rows: PropRow[] = chart.props.map((p) => ({
    name: p.name,
    type: p.type,
    required: p.required,
    description: p.description,
    copyNotes: p.description,
  }));

  if (chart.interactiveImport && chart.animates !== false) {
    rows.push({
      name: "animate",
      type: "boolean",
      description: (
        <>
          Interactive entry only. Opt-in entrance motion when the chart mounts client-side — add{" "}
          <code className="text-xs">import &quot;@microcharts/react/motion&quot;</code> once. Inert
          on the server, on hydrated server HTML, and under{" "}
          <code className="text-xs">prefers-reduced-motion</code>.
        </>
      ),
      copyNotes: ANIMATE_NOTES,
    });
  }

  return (
    <>
      <PropTableView rows={rows} />
      <p className="-mt-3 text-sm text-fd-muted-foreground">
        Plus the shared grammar — <code className="text-xs">data</code>,{" "}
        <code className="text-xs">domain</code>, <code className="text-xs">color</code>,{" "}
        <code className="text-xs">title</code>, <code className="text-xs">summary</code>,{" "}
        <code className="text-xs">format</code> — and the layout props (
        <code className="text-xs">width</code>, <code className="text-xs">height</code>,{" "}
        <code className="text-xs">className</code>, <code className="text-xs">style</code>) that
        every chart accepts. See{" "}
        <a href="/docs/quickstart#the-shared-grammar" className="underline">
          the shared grammar
        </a>
        .
      </p>
    </>
  );
}
