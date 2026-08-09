// DataDiff: What changed between two
// versions? One diverging bar per key: removed leftward (--mc-neg). added
// rightward (--mc-pos). both ALWAYS drawn on ONE symmetric shared scale
// (max(added,removed) across all rows) so a +500/−480 churn never looks like a
// +20/−0 trickle. Added/removed are MAGNITUDES — negatives are clamped to 0.
// Coords 2-dp, integer viewBox.
import { round2 } from "../../core/types.js";
import { maxOf } from "../../core/scale.js";
import { labelFont, textGutterProse } from "../../core/labels.js";

/** Frame padding — the one copy, shared by the geometry and the chrome layout. */
const PAD = 2;
/** Smallest key tag this chart will draw before it drops the tags instead. */
const TAG_FONT_MIN = 5;

/**
 * Left gutter for the key tags — the ONE place it is computed, because it is the
 * plot's x origin and a second-guessed copy walks every bar (and the interactive
 * focus ring) sideways by its width. Both entries reach it through
 * `dataDiffLayout`, never on their own.
 *
 * A key is caller text — a column name, a schema field, often upper-case — never
 * a figure this chart formatted, so it reserves at the PROSE per-char rate
 * (`textGutterProse`); the digits rate would leave an all-caps key painting into
 * the bars, and `.mc-root` is `overflow: visible`, so it spills rather than clips.
 * Unknown text also means the reserve can outgrow the sensible share of the box:
 * past 45% the diverging pair has no room left to encode anything, so the tags
 * DROP and hand the whole width back to the bars — the data never degrades for
 * the sake of a scaffold. Returns 0 in that case, so the caller drops the tags
 * and the gutter in the same branch.
 */
function dataDiffGutter(chars: number, fontSize: number, width: number): number {
  if (chars <= 0) return 0;
  const gutter = textGutterProse(chars, fontSize, 4);
  return gutter <= width * 0.45 ? gutter : 0;
}

/**
 * Displayed-row cap. `maxItems` is a host-computed prop — `Number(field.value)`
 * on an empty input is NaN — and NaN slipped through `Math.round`/`Math.min`
 * into `slice(0, NaN)`, which emptied the plot while the accessible name still
 * announced every key. Non-finite falls back to the documented 12.
 */
export function dataDiffCap(maxItems: number | undefined): number {
  const n = Math.round(maxItems ?? 12);
  return Number.isFinite(n) ? Math.max(1, Math.min(12, n)) : 12;
}

/**
 * Largest key-tag font that fits BOTH the row pitch and the gutter budget, or 0
 * when none does (the caller drops the tags and their gutter together).
 *
 * Sizing on the pitch alone inverted the degradation: three rows in a 64-unit
 * box got a 10-unit pitch font whose gutter blew the 45% budget, so the tags
 * dropped — while the SAME box holding six rows kept them, because the tighter
 * pitch happened to pick a font narrow enough to fit. Vertical room should not
 * cost a label, so step down to the floor before giving up. Bounded by
 * `labelFont`'s cap of 11, so the loop runs at most seven times.
 */
export function dataDiffTagFont(
  pitchFont: number,
  chars: number,
  width: number,
  min = TAG_FONT_MIN,
): number {
  for (let f = Math.floor(pitchFont); f >= min; f--)
    if (dataDiffGutter(chars, f, width) > 0) return f;
  return 0;
}

/**
 * Chrome layout — label font, totals-footer band, and the key-tag font — resolved
 * ONCE for both entries. The interactive entry used to recompute all three from
 * its own copy of the constants; they move the row band and `centerX`, so any
 * drift slides the focus ring off the rows it frames.
 */
export function dataDiffLayout(opts: {
  data: readonly { key: string }[];
  labels?: boolean | undefined;
  label?: "totals" | "none" | undefined;
  maxItems?: number | undefined;
  width: number;
  height: number;
  /** Minimum label size in viewBox units (the chart's `labelSize` prop). */
  labelSize?: number | undefined;
}): { font: number; footer: number; tagFont: number; keyChars: number } {
  const { width, height } = opts;
  const font = labelFont(height, 0.4, opts.labelSize);
  // rows split the plot height — the totals band only earns its own band when
  // there is vertical room to spend on it.
  const footer = opts.label === "totals" && height >= 34 ? font + 3 : 0;
  const n = Math.min(opts.data.length, dataDiffCap(opts.maxItems));
  const rowH = n > 0 ? (height - 2 * PAD - footer) / n : 0;
  // a text glyph box measures ~1.6× its fontSize tall, so a tag must be ≤ half
  // the row pitch to never touch its neighbour
  const keyChars = maxOf(
    opts.data.map((d) => d.key.length),
    0,
  );
  // A raised floor lifts the bottom of the tag's shrink range too: the tags
  // drop rather than setting under the size an app asked for.
  const tagFont = opts.labels
    ? dataDiffTagFont(
        Math.min(font, Math.floor(rowH * 0.5)),
        keyChars,
        width,
        opts.labelSize ?? TAG_FONT_MIN,
      )
    : 0;
  return { font, footer, tagFont, keyChars };
}

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
  order?: "data" | "net" | "magnitude" | undefined;
  domain?: readonly [number, number] | undefined;
  maxItems?: number | undefined;
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
  const pad = opts.pad ?? PAD;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = dataDiffGutter(gutterCh, fontSize, width);
  const cap = dataDiffCap(opts.maxItems);

  // order is a VIEW concern — never mutate the caller's order semantics silently;
  // "data" preserves input (schema/alphabetical order is often meaningful)
  const order = opts.order ?? "data";
  const withIdx = rowsIn.map((r, i) => ({ ...r, i }));
  if (order === "net")
    withIdx.sort((a, b) => b.added - b.removed - (a.added - a.removed) || a.i - b.i);
  else if (order === "magnitude")
    withIdx.sort(
      (a, b) => Math.max(b.added, b.removed) - Math.max(a.added, a.removed) || a.i - b.i,
    );
  const rows = withIdx.slice(0, cap);

  const totals = rowsIn.reduce(
    (s, r) => ({ added: s.added + r.added, removed: s.removed + r.removed }),
    { added: 0, removed: 0 },
  );

  // one symmetric scale across ALL rows (churn must not shrink to fit).
  // `domain` is host-computed — `Math.max(...)` over a series with a hole is
  // NaN, a ratio over an empty window is Infinity — and this max is the scale's
  // DIVISOR: a non-finite or non-positive one made every bar width NaN, failed
  // every `width > 0` test, and left a bare axis under an accessible name that
  // still announced the totals. Fall back to the data's own max.
  const domainMax = opts.domain?.[1];
  const scaleMax =
    domainMax !== undefined && Number.isFinite(domainMax) && domainMax > 0
      ? domainMax
      : maxOf(
          rowsIn.map((r) => Math.max(r.added, r.removed)),
          0,
        );
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
