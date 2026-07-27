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
