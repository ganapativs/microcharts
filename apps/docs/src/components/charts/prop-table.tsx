import Link from "next/link";
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
    description: p.interactive ? (
      <>
        <span className="mr-1.5 rounded bg-fd-primary/10 px-1 py-0.5 align-middle text-[0.65rem] font-medium text-fd-primary">
          interactive
        </span>
        {p.description}
      </>
    ) : (
      p.description
    ),
    copyNotes: p.interactive ? `Interactive entry only. ${p.description}` : p.description,
  }));

  if (chart.interactiveImport && chart.animates !== false) {
    rows.push({
      name: "animate",
      type: "boolean",
      description: (
        <>
          <span className="mr-1.5 rounded bg-fd-primary/10 px-1 py-0.5 align-middle text-[0.65rem] font-medium text-fd-primary">
            interactive
          </span>
          Opt-in entrance motion when the chart mounts client-side — add{" "}
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
        every chart accepts. Interactive entries also share <code className="text-xs">animate</code>{" "}
        and <code className="text-xs">live</code>, and — wherever a chart has more than one
        navigable unit — <code className="text-xs">onActive</code>,{" "}
        <code className="text-xs">onSelect</code>, <code className="text-xs">selectedIndex</code>{" "}
        and <code className="text-xs">defaultSelectedIndex</code>. See{" "}
        <Link prefetch={false} href="/docs/quickstart#the-shared-grammar" className="underline">
          the shared grammar
        </Link>
        .
      </p>
    </>
  );
}
