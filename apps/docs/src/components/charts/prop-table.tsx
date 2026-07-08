import { getChart } from "@/lib/catalog";

/** Renders a chart's prop table from the catalog registry (single source). */
export function PropTable({ slug }: { slug: string }) {
  const chart = getChart(slug);
  if (!chart) return null;
  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="mc-table text-sm">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {chart.props.map((p) => (
            <tr key={p.name}>
              <td className="whitespace-nowrap font-mono text-fd-foreground">
                {p.name}
                {p.required && <span className="ml-1 text-fd-primary">*</span>}
              </td>
              <td className="font-mono text-xs text-fd-muted-foreground">{p.type}</td>
              <td className="text-fd-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
