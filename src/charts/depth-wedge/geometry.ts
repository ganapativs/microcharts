// DepthWedge: Two filled
// cumulative step-wedges meeting at the spread: demand accumulates leftward from
// the gap, supply rightward. The y-scale is LINEAR, full stop — no `scale` prop,
// no silent log (documented steer to full-size tools). The visible `levels`
// span is part of the claim. 2-dp.
import { round2 } from "../../core/types.js";
import { maxOf } from "../../core/scale.js";

export interface Level {
  level: number;
  amount: number;
}

interface DepthStep {
  level: number;
  cum: number;
  x: number;
  dist: number;
}

export interface DepthWedgeResult {
  demandPath: string;
  supplyPath: string;
  midX: number;
  /** Wedge baseline — the deterministic plot floor, flush with the box bottom. */
  yBase: number;
  spread: number;
  ratio: number;
  /** Lead side for the summary: 1 = demand, -1 = supply, 0 = balanced. */
  lead: -1 | 0 | 1;
  demandTotal: number;
  supplyTotal: number;
  /** Cumulative steps per side (for the interactive lookup). */
  demandSteps: DepthStep[];
  supplySteps: DepthStep[];
}

const clean = (rows: readonly Level[]): Level[] =>
  rows.filter((r) => Number.isFinite(r.level) && Number.isFinite(r.amount) && r.amount > 0);

export function depthWedgeGeometry(opts: {
  demand: readonly Level[];
  supply: readonly Level[];
  levels: number | null;
  normalize: boolean;
  width: number;
  height: number;
}): DepthWedgeResult {
  const { normalize, width, height } = opts;
  const demand = clean(opts.demand).sort((a, b) => b.level - a.level); // highest bid first
  const supply = clean(opts.supply).sort((a, b) => a.level - b.level); // lowest ask first

  const pad = 1;
  const midX = round2(width / 2);
  // Baseline seats flush with the box bottom (flat fill edge → no bleed) so the
  // wedge aligns on the text baseline inline; plotH keeps the top pad intact.
  const yBase = height;
  const plotH = height - pad * 2;

  const highestBid = demand.length > 0 ? demand[0]!.level : 0;
  const lowestAsk = supply.length > 0 ? supply[0]!.level : 0;
  const mid =
    demand.length > 0 && supply.length > 0
      ? (highestBid + lowestAsk) / 2
      : demand.length > 0
        ? highestBid
        : lowestAsk;
  const spread = demand.length > 0 && supply.length > 0 ? Math.max(0, lowestAsk - highestBid) : 0;

  // levels = ± level distance from mid to include. ABSOLUTE distance: a crossed
  // book (best bid above best ask) puts both sides' signed extents below zero,
  // and a negative span mirrored the two wedges onto each other's half — hiding
  // the crossing instead of showing it.
  const extents: number[] = [];
  for (const d of demand) extents.push(Math.abs(mid - d.level));
  for (const s of supply) extents.push(Math.abs(s.level - mid));
  const autoLevels = extents.length > 0 ? maxOf(extents) : 1;
  // A non-finite `levels` is not a window: `Infinity` collapsed every level onto
  // the mid, and a denormal (1e-320) overflowed the scale to ±Infinity coords in
  // the emitted path. Fall back to the data extent, same as an omitted prop.
  const levels =
    opts.levels != null && Number.isFinite(opts.levels) && opts.levels > 0
      ? opts.levels
      : autoLevels || 1;

  const halfW = width / 2 - pad;
  const xOf = (level: number): number => round2(midX + ((level - mid) / levels) * halfW);

  // The window FILTERS, it does not merely scale. Rows beyond ±levels used to
  // keep their step in the path — a level at 4× the range drew at x = -440 in a
  // 100-wide box, and `.mc-root` is `overflow: visible`, so that is a spill into
  // the page — while still counting toward the ratio the summary announces
  // "within the shown range". Dropping them makes both true at once. `mid` and
  // `spread` stay anchored on the full book: both best levels sit exactly
  // spread/2 from the mid, so a window either admits both or neither.
  const inWindow = (level: number): boolean => Math.abs(level - mid) <= levels;
  const shownDemand = demand.filter((d) => inWindow(d.level));
  const shownSupply = supply.filter((s) => inWindow(s.level));

  const demandTotal = shownDemand.reduce((s, d) => s + d.amount, 0);
  const supplyTotal = shownSupply.reduce((s, d) => s + d.amount, 0);
  const maxCum = normalize ? 1 : Math.max(demandTotal, supplyTotal, 1);
  const cumScale = (cum: number, total: number): number =>
    normalize ? (total > 0 ? cum / total : 0) : cum;
  const yOf = (scaled: number): number => round2(yBase - (scaled / maxCum) * plotH);

  // build a cumulative step wedge from the mid outward
  const wedge = (rows: readonly Level[], total: number): { path: string; steps: DepthStep[] } => {
    if (rows.length === 0) return { path: "", steps: [] };
    let cum = 0;
    let d = `M${xOf(rows[0]!.level)} ${round2(yBase)}`;
    let prevX = xOf(rows[0]!.level);
    const steps: DepthStep[] = [];
    for (const row of rows) {
      cum += row.amount;
      const y = yOf(cumScale(cum, total));
      const x = xOf(row.level);
      d += `L${prevX} ${y}L${x} ${y}`; // vertical then horizontal (step)
      prevX = x;
      steps.push({
        level: row.level,
        cum: round2(cum),
        x,
        dist: round2(Math.abs(row.level - mid)),
      });
    }
    d += `L${prevX} ${round2(yBase)}Z`;
    return { path: d, steps };
  };
  const demandWedge = wedge(shownDemand, demandTotal);
  const supplyWedge = wedge(shownSupply, supplyTotal);

  const ratio =
    supplyTotal > 0 && demandTotal > 0
      ? round2(Math.max(demandTotal, supplyTotal) / Math.min(demandTotal, supplyTotal))
      : 1;
  const lead: -1 | 0 | 1 = demandTotal === supplyTotal ? 0 : demandTotal > supplyTotal ? 1 : -1;

  return {
    demandPath: demandWedge.path,
    supplyPath: supplyWedge.path,
    midX,
    yBase,
    spread: round2(spread),
    ratio,
    lead,
    demandTotal: round2(demandTotal),
    supplyTotal: round2(supplyTotal),
    demandSteps: demandWedge.steps,
    supplySteps: supplyWedge.steps,
  };
}
