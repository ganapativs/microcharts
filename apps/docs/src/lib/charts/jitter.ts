/**
 * Shape-preserving perturbation of a chart's demo data — what the docs
 * playground's shuffle button hands a chart so its marks travel to a new reading
 * instead of cutting to it.
 *
 * The catalog has ~85 distinct data shapes (`number[]`, `{ open, high, low,
 * close }[]`, `{ labels, counts }`, ragged rows, scalars), so the playground
 * cannot hand-write a generator per chart. It walks whatever it is given instead:
 *
 *   - `seed === 0` is the IDENTITY. A playground's first paint is byte-identical
 *     to its demo data, so nothing about the resting state is invented.
 *   - Every number in one plain OBJECT scales by the SAME factor. That is what
 *     keeps a shape valid without knowing what it means: an OHLC bar stays
 *     ordered (`low ≤ open,close ≤ high`), a `{ from, to }` span keeps its
 *     direction, a `{ value, target }` pair keeps its relationship.
 *   - Every element of an ARRAY gets its own factor, so a series visibly changes
 *     shape rather than sliding up and down as a block. That is the motion the
 *     shuffle is there to show.
 *   - Integers stay integers, zero stays zero, and strings, booleans, `null` and
 *     `Date`s pass through untouched — labels, states and dates are identity in
 *     these charts, and perturbing them would remount nodes instead of moving
 *     them.
 *
 * Deterministic: the same `(value, seed)` always yields the same result, so a
 * reload does not silently change what is on screen.
 */

/** mulberry32 — 4 lines, no dependency, good enough for a demo shuffle. */
function rng(seed: number): () => number {
  let a = (seed >>> 0) + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** ±35% — big enough to read at word size, small enough to stay plausible. */
function factor(next: () => number): number {
  return 0.65 + next() * 0.7;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && Object.getPrototypeOf(v) === Object.prototype;
}

function scale(n: number, f: number): number {
  if (n === 0 || !Number.isFinite(n)) return n;
  const next = n * f;
  return Number.isInteger(n) ? Math.round(next) || (n > 0 ? 1 : -1) : Number(next.toFixed(4));
}

function walk(value: unknown, next: () => number, inherited: number | null): unknown {
  if (typeof value === "number") return scale(value, inherited ?? factor(next));
  if (Array.isArray(value)) {
    // Fresh factor per element: the SERIES changes, not just its level.
    return value.map((item) => walk(item, next, null));
  }
  if (isPlainObject(value)) {
    // One factor for the whole object keeps intra-object relationships intact.
    const own = inherited ?? factor(next);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v, next, own);
    return out;
  }
  return value;
}

export function jitter<T>(value: T, seed: number): T {
  if (!seed) return value;
  return walk(value, rng(seed), null) as T;
}

/**
 * A new reading for a plain numeric series, for the docs playground's shuffle.
 *
 * Same perturbation as `jitter`, plus one rule it cannot apply without knowing
 * what a number means: the result is clamped into the ORIGINAL series' own
 * min/max. A playground series may be a fraction of 1, a percentile of 100, or a
 * count with no ceiling at all, and the shape string does not say which. Holding
 * the envelope keeps every one of them inside whatever range its chart
 * documents, so a shuffle can never paint a retention curve above 1 or a
 * percentile past 100. Interior values still move, which is all the shuffle is
 * there to show.
 *
 * `null` is a gap in these series, not a small number — it passes through, so a
 * shuffle never fills one in or opens a new one.
 */
export function shuffleSeries(base: readonly (number | null)[], seed: number): (number | null)[] {
  if (!seed) return [...base];
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of base) {
    // Spread-free: these series are short today, but `Math.min(...xs)` is the
    // call that blows the stack on a long one.
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (lo > hi) return [...base];
  const next = rng(seed);
  return base.map((v) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return v;
    const moved = Math.min(hi, Math.max(lo, scale(v, factor(next))));
    return Number.isInteger(v) ? Math.round(moved) : Number(moved.toFixed(4));
  });
}
