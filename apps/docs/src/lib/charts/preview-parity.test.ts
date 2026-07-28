import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CHART_MODULE_LAZY } from "./modules.generated";

/**
 * At rest, a chart's interactive entry must paint the box its static entry
 * paints. The gallery swaps one for the other in place and the playground
 * toggles between them, so a different box is a visible jump on mount.
 *
 * This guards the demo PROPS as much as the library: the drift that shipped was
 * docs-side — a live preview at 72×72 against a static one at 48×48, and a
 * ladder that dropped its labels on one side only.
 *
 * Scope: the painted `<svg>` box. Delta and TokenConfidence render inline HTML
 * whose box is the surrounding type scale — the doc-page audit covers those.
 */
const attr = (tag: string, name: string): string | undefined =>
  new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

/** Root `<svg>` box, or null for the inline-HTML charts. */
function box(html: string): string | null {
  const tag = /<svg\b[^>]*>/.exec(html)?.[0];
  if (!tag) return null;
  return `${attr(tag, "viewBox")} ${attr(tag, "width")}x${attr(tag, "height")} marks=${
    (html.match(/<(rect|circle|line|path|text|polyline|polygon)\b/g) ?? []).length
  }`;
}

const both = (a: string | null, b: string | null): boolean => a !== null && b !== null;

describe("static ↔ interactive preview parity", () => {
  for (const [slug, load] of Object.entries(CHART_MODULE_LAZY)) {
    it(`${slug} paints one box`, async () => {
      const mod = (await load()).default;
      const spec = mod.playground;

      if (mod.Preview && mod.PreviewLive) {
        const live = box(renderToStaticMarkup(createElement(mod.PreviewLive)));
        const stat = box(renderToStaticMarkup(createElement(mod.Preview)));
        if (both(live, stat)) expect(live, "gallery preview").toBe(stat);
      }
      if (spec?.renderInteractive) {
        const state = Object.fromEntries(spec.knobs.map((k) => [k.key, k.init]));
        const data = spec.data ?? [];
        const live = box(
          renderToStaticMarkup(spec.renderInteractive(state, data, { animate: false })),
        );
        const stat = box(renderToStaticMarkup(spec.render(state, data)));
        if (both(live, stat)) expect(live, "playground demo").toBe(stat);
      }
    });
  }
});
