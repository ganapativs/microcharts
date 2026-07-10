import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
export function P(p: { title?: string }) {
  const fmt = makeFormatter(undefined, undefined);
  const f = labelFont(20, 0.4);
  return (
    <Chart width={96} height={20} title={p.title} summary="x">
      {fmt(f)}
    </Chart>
  );
}
