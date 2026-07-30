/**
 * The page's demo numbers, in one place.
 *
 * Act I's beat is "the same component in four places, unchanged", so all four
 * frames must plot the SAME series — different data in each would prove nothing.
 * The same rule applies to the pie comparison: both marks read one `SHARES`
 * list, or the comparison is about the data rather than the encoding.
 */

/* The fold's four measured series are NOT here: they come from `hero-data.ts`,
 * which reads `chart-sizes.json`, `bench-summary.json`, the entries registry and
 * `showcase.ts` on the server and hands them to the hero as a prop. What stays
 * in this file is the demo data no measurement produces. */

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
