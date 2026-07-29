/**
 * The page's demo numbers, in one place.
 *
 * Act I's beat is "the same component in four places, unchanged", so all four
 * frames must plot the SAME series — different data in each would prove nothing.
 * The same rule applies to the pie comparison: both marks read one `SHARES`
 * list, or the comparison is about the data rather than the encoding.
 */

/* Hero specimen literals — checked against their sources by `home.test.ts`.
 * Runtime derivation would pull `entries.generated.json` (~1 MB) into a client
 * component; a literal plus a guard test costs ~700 B. */

/**
 * Interactive gzip kB for all 105 interactive entries in the stable catalog,
 * sorted ascending. Source: `chart-sizes.json` × the stable list. Sorted, the
 * plateau at 4.7–5.5 is the shape of the claim the sentence beside it makes.
 * (105 of 106 — `wind-barb` ships static only.)
 */
export const HERO_SIZES = [
  2.18, 2.35, 2.8, 3.04, 3.14, 3.17, 3.18, 3.31, 3.33, 3.46, 3.59, 3.62, 3.74, 3.77, 3.78, 4, 4,
  4.17, 4.35, 4.4, 4.63, 4.7, 4.7, 4.71, 4.76, 4.76, 4.83, 4.84, 4.84, 4.86, 4.89, 4.92, 4.93, 4.93,
  4.93, 4.94, 4.98, 4.99, 5.01, 5.04, 5.07, 5.08, 5.09, 5.09, 5.1, 5.14, 5.14, 5.16, 5.19, 5.2,
  5.22, 5.23, 5.24, 5.25, 5.28, 5.29, 5.29, 5.3, 5.32, 5.34, 5.35, 5.39, 5.39, 5.39, 5.41, 5.42,
  5.46, 5.46, 5.47, 5.47, 5.5, 5.51, 5.51, 5.51, 5.51, 5.51, 5.52, 5.53, 5.55, 5.72, 5.73, 5.76,
  5.77, 5.77, 5.79, 5.79, 5.82, 5.85, 5.86, 5.87, 5.91, 5.92, 5.94, 5.94, 5.97, 6.02, 6.02, 6.03,
  6.1, 6.18, 6.18, 6.41, 6.43, 6.71, 6.94,
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
  238, 301, 312, 323, 344, 397, 399, 425, 438, 465, 474, 484, 500, 501, 506, 517, 528, 572, 595,
  637, 698, 728, 731, 746, 762, 783, 842, 854, 879, 897, 899, 921, 928, 972, 976, 982, 997, 1038,
  1050, 1066, 1106, 1124, 1154, 1166, 1180, 1188, 1200, 1210, 1294, 1335, 1337, 1345, 1370, 1375,
  1376, 1391, 1396, 1419, 1433, 1434, 1456, 1510, 1600, 1606, 1635, 1654, 1662, 1712, 1770, 1841,
  1889, 1922, 1926, 1979, 1982, 1991, 2032, 2115, 2127, 2153, 2217, 2349, 2496, 2507, 2574, 2591,
  2616, 2690, 2722, 2740, 2746, 2842, 3153, 3230, 3485, 3557, 3708, 3841, 3847, 3937, 4552, 4957,
  5028, 5537, 6986, 9767,
] as const;

/** Weekly p95 latency for /checkout, ms. Ends at the figure the copy quotes. */
export const CHECKOUT_P95 = [168, 161, 157, 149, 152, 144, 141] as const;

/** The same measure for /search — a second row, trending the other way. */
export const SEARCH_P95 = [274, 281, 289, 296, 302, 311, 318] as const;

/**
 * Bookings by week through a recovering quarter. All three marks on the paper
 * sheet read this ONE array — the claim is that a trend, a set of bars and a
 * spread are three readings of the same numbers. Thirteen points is also the
 * floor for legibility: at three, MicroBox honestly collapses to two dots.
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
