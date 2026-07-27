/**
 * The page's demo numbers, in one place.
 *
 * Act I's beat is "the same component in four places, unchanged", so all four
 * frames must plot the SAME series — different data in each would prove nothing.
 * The same rule applies to the pie comparison: both marks read one `SHARES`
 * list, or the comparison is about the data rather than the encoding.
 */

/**
 * The shape in the hero sentence.
 *
 * A demo series, and labelled as one: it starts at zero, climbs, and wobbles on the
 * way, which is what a sparkline is for and what makes it legible at 132×30. It
 * replaced the catalog's real per-release ceiling, which was seven near-identical
 * values in the top third of the box — true, and a nearly flat line that read as an
 * underscore. The same call the current home page makes with its own `TREND`.
 *
 * The numbers in the sentence around it are all still measured. This is the only
 * series on the page that is a shape rather than a fact, so nothing near it claims
 * otherwise.
 */
export const HERO_TREND = [0, 4, 2, 7, 5, 11, 8, 14, 12, 18] as const;

/* ── the hero's rotating specimen ────────────────────────────────────────────
 *
 * Five frames, five chart types, five DIFFERENT measured facts about this
 * library. The mark in the sentence used to be a shape that meant nothing; each
 * of these means something, and the fan's size callout carries the type's own
 * measured weight so the rotation also demonstrates the 4.77–6.75 kB spread.
 *
 * Every array below is a LITERAL, and every one of them is checked against its
 * real source by `home-v3.test.ts`. They are not derived at runtime on purpose:
 * `entries.generated.json` is the only place the collection and status of each
 * chart lives, it is ~1 MB, and `hero-sentence.tsx` is a client component. A
 * literal plus a guard test costs ~700 B in the bundle instead of the registry.
 * If a number here ever drifts from the file it came from, the test fails.
 */

/**
 * Interactive gzip kB for all 105 interactive entries in the stable catalog,
 * sorted ascending. Source: `chart-sizes.json` × the stable list.
 *
 * Sorted, so the mark is an ogive rather than noise: the steep start is the
 * glyph-class charts, the long plateau at 4.7–5.5 is where most of the catalog
 * actually lives, and the tail is the handful that carry a picker. That plateau
 * is the shape of the claim the sentence beside it makes.
 * (105 of 106 — `wind-barb` ships static only.)
 */
export const HERO_SIZES = [
  2.17, 2.32, 2.72, 2.95, 2.97, 3.08, 3.12, 3.22, 3.27, 3.36, 3.44, 3.49, 3.62, 3.68, 3.72, 3.78,
  3.92, 3.97, 4.18, 4.22, 4.49, 4.53, 4.58, 4.58, 4.59, 4.61, 4.72, 4.73, 4.75, 4.77, 4.77, 4.78,
  4.81, 4.82, 4.83, 4.84, 4.85, 4.85, 4.85, 4.86, 4.86, 4.88, 4.94, 4.94, 4.95, 4.98, 5, 5.03, 5.05,
  5.05, 5.06, 5.06, 5.07, 5.1, 5.15, 5.19, 5.21, 5.21, 5.22, 5.23, 5.23, 5.29, 5.29, 5.31, 5.31,
  5.32, 5.33, 5.33, 5.33, 5.34, 5.35, 5.36, 5.38, 5.38, 5.4, 5.4, 5.41, 5.43, 5.43, 5.57, 5.58,
  5.59, 5.67, 5.67, 5.69, 5.7, 5.7, 5.72, 5.75, 5.75, 5.78, 5.78, 5.79, 5.83, 5.86, 5.91, 5.95,
  5.95, 5.97, 6, 6, 6.36, 6.41, 6.55, 6.75,
] as const;

/** The four collections, in catalog order. Sums to the 106 stable types. */
export const HERO_COLLECTIONS = [
  { label: "core", value: 34 },
  { label: "decision", value: 26 },
  { label: "expressive", value: 23 },
  { label: "frontier", value: 23 },
] as const;

/** Chart types imported by each of the seven example apps, in showcase order:
 *  Cortex, Pulse, Ledger, Dispatch, Shipyard, Vitals, Atlas. Source: the real
 *  `charts` list on each `SHOWCASE` entry, which is derived from app source. */
export const HERO_APPS = [22, 35, 25, 20, 22, 25, 25] as const;

/** Bytes of SVG each chart renders for the bench's 24-point series, all 106,
 *  sorted ascending. Source: `bench-summary.json`. A different axis from gzip
 *  size entirely: this is what lands in the DOM, not what you install. */
export const HERO_SVG_BYTES = [
  238, 302, 312, 323, 344, 377, 399, 403, 409, 465, 484, 493, 497, 500, 504, 511, 548, 571, 572,
  637, 683, 708, 731, 746, 762, 783, 879, 892, 897, 908, 914, 921, 928, 941, 972, 982, 1001, 1027,
  1038, 1068, 1075, 1106, 1114, 1137, 1154, 1169, 1180, 1188, 1196, 1294, 1312, 1350, 1391, 1394,
  1397, 1433, 1456, 1478, 1510, 1653, 1654, 1727, 1753, 1798, 1809, 1876, 1877, 1981, 1982, 2022,
  2032, 2051, 2076, 2107, 2116, 2127, 2160, 2169, 2230, 2252, 2285, 2391, 2496, 2549, 2580, 2592,
  2606, 2719, 2722, 2740, 2842, 3190, 3248, 3427, 3453, 3557, 3708, 3745, 3824, 3937, 4552, 4938,
  4957, 5579, 6636, 7505,
] as const;

/** Weekly p95 latency for /checkout, ms. Ends at the figure the copy quotes. */
export const CHECKOUT_P95 = [168, 161, 157, 149, 152, 144, 141] as const;

/** The same measure for /search — a second row, trending the other way. */
export const SEARCH_P95 = [274, 281, 289, 296, 302, 311, 318] as const;

/**
 * Bookings by week through a recovering quarter — the paper inversion's three
 * inline marks.
 *
 * Thirteen weeks, and all three marks on that sheet read this ONE array: the
 * sheet's claim is that a trend, a set of bars and a spread are three readings of
 * the same numbers, so three different series would make it three unrelated
 * pictures. Thirteen is also the floor for the claim to be legible — an earlier
 * pass passed a three-point quarter and the SparkBar drew three fat blocks while
 * the MicroBox collapsed to two dots, which is what a box plot of three points
 * honestly IS and exactly why it had no business being asked for.
 */
export const BOOKINGS_WEEKS = [
  1102, 1064, 1121, 1140, 1098, 1186, 1213, 1177, 1284, 1252, 1341, 1398, 1519,
] as const;

/** The series a model emits inside a ```chart fence, verbatim. */
export const FENCE_SERIES = [128, 131, 129, 138, 141, 139, 148, 152, 150, 157, 161, 163] as const;

/** Five shares, largest first. The failing pie and its stand-in both read this. */
export const SHARES = [28, 24, 19, 16, 13] as const;

/** What a model mid-reply actually sends, and what each renders. */
export const DEGRADE = [
  {
    input: "[NaN, 3, Infinity]",
    data: [Number.NaN, 3, Number.POSITIVE_INFINITY],
    out: "One finite value, drawn as a point.",
  },
  // `[]` draws nothing at all — verified, not assumed. That is the honest
  // answer: an empty series has no value to place, and inventing a zero would
  // put a number on the page that nobody sent.
  { input: "[]", data: [], out: "Nothing drawn. It won\u2019t invent a zero." },
  { input: "[-4, -4]", data: [-4, -4], out: "Flat at −4, on its own baseline." },
] as const;
