// DataDiff geometry — pure, React-free. What changed between two
// versions? One diverging bar per key: removed leftward (--mc-neg), added
// rightward (--mc-pos), both ALWAYS drawn on ONE symmetric shared scale
// (max(added,removed) across all rows) so a +500/−480 churn never looks like a
// +20/−0 trickle. Added/removed are MAGNITUDES — negatives are clamped to 0.
// Coords 2-dp, integer viewBox.
import { round2 } from "../../core/types.js";

interface DataDiffRow {
  key: string;
  y: number;
  height: number;
  added: { x: number; width: number };
  removed: { x: number; width: number };
  /** Clamped magnitudes (for the interactive readout — never re-derived). */
  addedValue: number;
  removedValue: number;
  net: number;
  /** x of the net mark (centerX + net/scale·halfW) — a summary tick, opt-in. */
  netX: number;
  /** 0/0 row — nothing changed, but the key still gets a hairline tick. */
  placeholder: boolean;
}

export interface DataDiffGeometry {
  centerX: number;
  rows: DataDiffRow[];
  totals: { added: number; removed: number };
  /** Largest single-key change by |net| — the summary's headline. */
  largest: { key: string; net: number } | null;
  labelX: number;
  totalWidth: number;
  degenerate: boolean;
}

const clamp0 = (v: number): number => (Number.isFinite(v) && v > 0 ? v : 0);

export function dataDiffGeometry(opts: {
  width: number;
  height: number;
  data: readonly { key: string; added: number; removed: number }[];
  sort?: "none" | "net" | "magnitude" | undefined;
  domain?: readonly [number, number] | undefined;
  max?: number | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
  /** Reserved bottom band (px) for a totals footer — rows never enter it. */
  footer?: number | undefined;
}): DataDiffGeometry | null {
  const rowsIn = opts.data.map((d) => ({
    key: d.key,
    added: clamp0(d.added),
    removed: clamp0(d.removed),
  }));
  if (rowsIn.length === 0) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  const cap = Math.max(1, Math.min(12, Math.round(opts.max ?? 12)));

  // sort is a VIEW concern — never mutate the caller's order semantics silently;
  // "none" preserves input (schema/alphabetical order is often meaningful)
  const sort = opts.sort ?? "none";
  const withIdx = rowsIn.map((r, i) => ({ ...r, i }));
  if (sort === "net")
    withIdx.sort((a, b) => b.added - b.removed - (a.added - a.removed) || a.i - b.i);
  else if (sort === "magnitude")
    withIdx.sort(
      (a, b) => Math.max(b.added, b.removed) - Math.max(a.added, a.removed) || a.i - b.i,
    );
  const rows = withIdx.slice(0, cap);

  const totals = rowsIn.reduce(
    (s, r) => ({ added: s.added + r.added, removed: s.removed + r.removed }),
    { added: 0, removed: 0 },
  );

  // one symmetric scale across ALL rows (churn must not shrink to fit)
  const scaleMax =
    opts.domain?.[1] ?? Math.max(...rowsIn.map((r) => Math.max(r.added, r.removed)), 0);
  const degenerate = scaleMax === 0;

  // label gutter sits on the LEFT (keys read before the diverging bars)
  const gutterL = gutter;
  const footer = Math.max(0, opts.footer ?? 0);
  const plotW = width - 2 * pad - gutterL;
  const plotH = height - 2 * pad - footer;
  const centerX = round2(pad + gutterL + plotW / 2);
  const halfW = plotW / 2;
  const n = rows.length;
  const rowH = plotH / n;
  const barH = Math.max(3, round2(rowH * 0.62));

  const outRows: DataDiffRow[] = rows.map((r, idx) => {
    const addW = degenerate ? 0 : round2((r.added / scaleMax) * halfW);
    const remW = degenerate ? 0 : round2((r.removed / scaleMax) * halfW);
    const yc = pad + rowH * (idx + 0.5);
    return {
      key: r.key,
      y: round2(yc - barH / 2),
      height: barH,
      added: { x: centerX, width: addW },
      removed: { x: round2(centerX - remW), width: remW },
      addedValue: r.added,
      removedValue: r.removed,
      net: r.added - r.removed,
      netX: degenerate ? centerX : round2(centerX + ((r.added - r.removed) / scaleMax) * halfW),
      placeholder: r.added === 0 && r.removed === 0,
    };
  });

  // largest change by |net| across the SHOWN rows (plain loop, not map-mutation)
  let largestIdx = -1;
  for (let i = 0; i < outRows.length; i++) {
    if (largestIdx < 0 || Math.abs(outRows[i]!.net) > Math.abs(outRows[largestIdx]!.net))
      largestIdx = i;
  }
  const largest =
    largestIdx >= 0 && outRows[largestIdx]!.net !== 0
      ? { key: outRows[largestIdx]!.key, net: outRows[largestIdx]!.net }
      : null;

  return {
    centerX,
    rows: outRows,
    totals,
    largest,
    labelX: round2(pad),
    totalWidth: width,
    degenerate,
  };
}
