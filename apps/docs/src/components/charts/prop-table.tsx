import { getChart } from "@/lib/catalog";

/** Renders a chart's prop table from the catalog registry (single source). */
export function PropTable({ slug }: { slug: string }) {
  const chart = getChart(slug);
  if (!chart) return null;
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-lg border border-fd-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-fd-border bg-fd-muted/40 text-left">
            <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-fd-muted-foreground">
              Prop
            </th>
            <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-fd-muted-foreground">
              Type
            </th>
            <th className="px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-fd-muted-foreground">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {chart.props.map((p) => (
            <tr key={p.name} className="border-b border-fd-border/60 last:border-0 align-top">
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-fd-foreground">
                {p.name}
                {p.required && <span className="ml-1 text-fd-primary">*</span>}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-fd-muted-foreground">{p.type}</td>
              <td className="px-4 py-2.5 text-fd-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
