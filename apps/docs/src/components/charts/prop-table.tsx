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
          {chart.interactiveImport && chart.animates !== false && (
            <tr>
              <td className="whitespace-nowrap font-mono text-fd-foreground">animate</td>
              <td className="font-mono text-xs text-fd-muted-foreground">boolean</td>
              <td className="text-fd-muted-foreground">
                Interactive entry only. Opt-in entrance motion when the chart mounts client-side —
                add <code className="text-xs">import &quot;@microcharts/react/motion&quot;</code>{" "}
                once. Inert on the server, on hydrated server HTML, and under{" "}
                <code className="text-xs">prefers-reduced-motion</code>.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
