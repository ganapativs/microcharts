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
 *   - A factor scales an element's DISTANCE FROM ITS SERIES' MIDLINE, never its
 *     absolute value, and the result is held inside the series' own original
 *     min/max. This is the rule that keeps a shuffle looking like the same chart.
 *     Scaling absolute values instead let a ±35% factor move each element's
 *     LEVEL, which does not perturb a series so much as scatter it: 20 OHLC
 *     sessions drawn around 140–156 (span 20) landed across 89–207 (span 118),
 *     every candle still internally valid and every BODY now 1.5% of a plot it
 *     used to fill 9% of. The chart fitted its domain to the scatter and drew
 *     twenty dots. Anything whose reading is a proportion of its own series —
 *     candle bodies, box hinges, band widths, dumbbell spans — failed the same
 *     way, silently, because each individual datum still looked reasonable.
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

/**
 * Fisher–Yates on the same generator, guaranteed to move at least one element
 * when the array holds two distinct values. A shuffle that returns its input is
 * indistinguishable from a dead button.
 */
function permute<T>(items: readonly T[], next: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  const distinct = items.some((v) => !Object.is(v, items[0]));
  if (distinct && out.every((v, i) => Object.is(v, items[i]))) {
    const at = out.findIndex((v) => !Object.is(v, out[0]));
    if (at > 0) [out[0], out[at]] = [out[at] as T, out[0] as T];
  }
  return out;
}

/** The min/max of every finite number under a node — a series' own envelope. */
interface Envelope {
  lo: number;
  hi: number;
  mid: number;
}

function envelopeOf(value: unknown): Envelope | null {
  let lo = Infinity;
  let hi = -Infinity;
  // Spread-free and iterative: a ragged row set can be deep, and both
  // `Math.min(...xs)` and a recursive walk are the calls that blow the stack.
  const stack: unknown[] = [value];
  while (stack.length > 0) {
    const v = stack.pop();
    if (typeof v === "number") {
      if (!Number.isFinite(v)) continue;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    } else if (Array.isArray(v)) {
      for (const item of v) stack.push(item);
    } else if (isPlainObject(v)) {
      for (const item of Object.values(v)) stack.push(item);
    }
  }
  if (lo > hi) return null;
  return { lo, hi, mid: (lo + hi) / 2 };
}

/**
 * Move `n` away from (or toward) its series' midline, then hold it inside the
 * series' original range.
 *
 * Clamping is what makes this safe to apply blindly. It is monotonic, so it
 * cannot reorder an object's fields: a candle whose `high` is pinned to the
 * series maximum still has its `open` pinned no higher, and `low ≤ open,close ≤
 * high` survives as a weak ordering. A per-FIELD envelope would not have that
 * property — clamping `open` up while clamping `high` down inverts the bar.
 */
function scale(n: number, f: number, env: Envelope | null): number {
  if (n === 0 || !Number.isFinite(n)) return n;
  const next = env ? env.mid + (n - env.mid) * f : n * f;
  const held = env ? Math.min(env.hi, Math.max(env.lo, next)) : next;
  return Number.isInteger(n) ? Math.round(held) || (n > 0 ? 1 : -1) : Number(held.toFixed(4));
}

function walk(
  value: unknown,
  next: () => number,
  inherited: number | null,
  env: Envelope | null,
): unknown {
  if (typeof value === "number") return scale(value, inherited ?? factor(next), env);
  if (Array.isArray(value)) {
    // Fresh factor per element: the SERIES changes, not just its level. The
    // envelope is measured HERE, on the series being perturbed, so an inner
    // array (a ragged row, a nested band) is held to its own range rather than
    // to some outer object's — which may be in a different unit entirely.
    const own = envelopeOf(value);
    const scaled = value.map((item) => walk(item, next, null, own));
    // A DISCRETE series cannot be scaled. Ranks, pitches, growth stages and a
    // binary streak are small integers, so every factor rounds straight back to
    // the value it started from and the shuffle button does nothing — which is
    // the same bug as the scatter, seen from the other side: the playground
    // stops demonstrating that the chart moves at all.
    //
    // Reorder instead. A permutation is a genuinely new reading of the same
    // series and it preserves the multiset exactly, so the envelope, the
    // integers and whatever domain the chart documents all survive by
    // construction. Whole ELEMENTS move, never fields within one, so an
    // object's internal ordering is untouched.
    //
    // Compared by VALUE, not identity: `walk` rebuilds every object it visits,
    // so an array of `{ label, stage }` rows always came back as fresh
    // instances holding the very same numbers, and an identity check declared
    // it changed when nothing had. These series are short enough for the
    // stringify to cost nothing on a button press.
    if (JSON.stringify(scaled) === JSON.stringify(value)) return permute(value, next);
    return scaled;
  }
  if (isPlainObject(value)) {
    // One factor for the whole object keeps intra-object relationships intact.
    const own = inherited ?? factor(next);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      // A nested ARRAY is its own series: it re-measures and re-rolls per
      // element. Passing the object's single factor down instead rescaled every
      // member of `{ before: [...], after: [...] }` by the same amount, which is
      // a chart that does not change shape at all — the shuffle looked broken
      // from the other direction.
      out[k] = Array.isArray(v) ? walk(v, next, null, null) : walk(v, next, own, env);
    }
    return out;
  }
  return value;
}

export function jitter<T>(value: T, seed: number): T {
  if (!seed) return value;
  // A top-level scalar or object has no series to be measured against, so the
  // envelope starts null and is established by the first array encountered.
  return walk(value, rng(seed), null, Array.isArray(value) ? envelopeOf(value) : null) as T;
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
    // No envelope passed: this function already holds the result inside the
    // series' own min/max on the next line, which is the same guarantee by a
    // different route — it is where the rule was first written.
    const moved = Math.min(hi, Math.max(lo, scale(v, factor(next), null)));
    return Number.isInteger(v) ? Math.round(moved) : Number(moved.toFixed(4));
  });
}
