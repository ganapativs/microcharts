import { describe, expect, it } from "vitest";
import { CHARTS } from "@/lib/charts/registry";
import { SHOWCASE } from "@/lib/showcase";

/**
 * What the showcase copy is allowed to say.
 *
 * `blurb` and `story` are read on four different surfaces — the `/examples`
 * gallery, an example's own detail page, two OG images, and the plate wall on the
 * homepage — and only ONE of those surfaces shows the app's full chart list. So
 * the two fields carry different permissions, and both were being broken:
 *
 *   - A **blurb** may not name a chart type. It rides beside a plate that draws
 *     three marks chosen for how they LOOK together, so any type named in it is a
 *     promise the plate is not making. Atlas's blurb said "heat maps, dumbbells
 *     and slopes" while its plate drew a mini-bar, a percentile ladder and a
 *     stacked area, and Vitals named rings it had stopped drawing. Naming nothing
 *     is the only version of that rule that survives the next re-pick.
 *
 *   - A **story** may name types, because it is only ever read on the detail
 *     page, directly above the tiles for every type the app imports. But it may
 *     only name types that app actually imports.
 *
 * And a story may not open by repeating its blurb. Five of seven did, so a reader
 * clicking a gallery card to learn more was met with the sentence that made them
 * click.
 */

/** Every way a chart type can be written in prose: slug, spaced, and both plural. */
const NAMES = CHARTS.filter((c) => c.status === "stable").map((c) => {
  const spaced = c.slug.replace(/-/g, " ");
  return {
    slug: c.slug,
    // Longest first, so "heat cell" is tried before a bare "cell" ever could be.
    forms: [c.slug, `${c.slug}s`, spaced, `${spaced}s`].sort((a, b) => b.length - a.length),
  };
});

/** Chart types this text names, by slug. Word-bounded, so "activity" alone does
 *  not count as `activity-grid` and "confidence" is not `token-confidence`. */
function typesNamedIn(text: string): string[] {
  const hay = text.toLowerCase();
  return NAMES.filter((n) =>
    n.forms.some((f) => new RegExp(`(^|[^a-z-])${f}([^a-z-]|$)`).test(hay)),
  ).map((n) => n.slug);
}

describe("showcase copy says only what the surface it lands on can back", () => {
  it("names no chart type in any blurb", () => {
    for (const app of SHOWCASE) {
      // The homepage plate picks its three marks on visual weight (see
      // `app-plates.tsx`), so a type named here would be contradicted by the
      // marks sitting directly under it the next time those are re-picked.
      expect(typesNamedIn(app.blurb), `${app.slug} blurb`).toEqual([]);
    }
  });

  it("names only imported chart types in a story", () => {
    for (const app of SHOWCASE) {
      const named = typesNamedIn(app.story);
      const missing = named.filter((slug) => !app.charts.includes(slug));
      expect(missing, `${app.slug} story names types it does not import`).toEqual([]);
    }
  });

  it("does not open a story with the blurb it already showed", () => {
    for (const app of SHOWCASE) {
      const first = app.story.split(/(?<=\.)\s/)[0] ?? "";
      const norm = (s: string) =>
        s
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();
      expect(norm(first), `${app.slug}`).not.toBe(norm(app.blurb));
      // Near-misses count too: the pair that failed hardest was a story that
      // reworded its blurb rather than repeating it, which still reads as one
      // sentence stuttered twice.
      const blurbWords = new Set(
        norm(app.blurb)
          .split(" ")
          .filter((w) => w.length > 3),
      );
      const firstWords = norm(first)
        .split(" ")
        .filter((w) => w.length > 3);
      const shared = firstWords.filter((w) => blurbWords.has(w)).length;
      expect(
        shared / Math.max(1, blurbWords.size),
        `${app.slug} story opens by restating its blurb`,
      ).toBeLessThan(0.6);
    }
  });
});
