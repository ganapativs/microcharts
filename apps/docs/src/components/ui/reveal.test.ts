import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

function* findFiles(dir: URL): Generator<string> {
  for (const entry of readdirSync(fileURLToPath(dir), {
    withFileTypes: true,
  })) {
    if (entry.name === "node_modules") continue;
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
    if (entry.isDirectory()) yield* findFiles(child);
    else yield fileURLToPath(child);
  }
}

const reveal = read("./reveal.tsx");
const routeTransition = read("../route-transition.tsx");
const css = read("../../app/global.css");

/**
 * The first-paint contract: nothing an entrance animation does may stand
 * between a cold visitor and the content. Server HTML renders the finished
 * state; the hidden state is applied later, by the client, only where the
 * reader cannot see it happen. Breaking any of these puts the site back to a
 * blank screen for the length of the JS download on a slow connection.
 */
describe("first paint is never gated on JS", () => {
  it("Reveal's server-rendered state is the visible one", () => {
    expect(reveal).toMatch(/deferred \? "pending" : "static"/);
  });

  it("deferred stays a rare, deliberate opt-out", () => {
    // `deferred` re-arms the old behaviour (hidden in the server HTML) and is
    // only honest where the markup holds nothing worth reading. Sprinkled
    // widely it rebuilds exactly the blank-first-paint this all replaced, so
    // each new call site is a decision someone has to make on purpose.
    const callSites = [...findFiles(new URL("../..", import.meta.url))]
      .filter((f) => f.endsWith(".tsx") && !f.endsWith("reveal.tsx"))
      .filter((file) => /<Reveal[^>]*\sdeferred[\s/>]/.test(readFileSync(file, "utf8")))
      .map((f) => f.replace(/^.*\/src\//, "src/"))
      .sort();
    expect(callSites).toEqual(["src/components/home/home-hero.tsx"]);
  });

  it("only the client-applied state hides anything", () => {
    // Every rule that hides a reveal must be scoped to `pending` — the state
    // the server never emits. A bare `[data-reveal]` hide would ship blank HTML.
    const hidingSelectors = [...css.matchAll(/^(\[data-reveal[^\]]*\][^{]*)\{([^}]*)\}/gm)]
      .filter(([, , body]) => /opacity:\s*0(?!\.)/.test(body))
      .map(([, selector]) => selector.trim());
    expect(hidingSelectors).toEqual(['[data-reveal="pending"]']);
  });

  it("the route fade is opt-in per navigation, not a class on every page", () => {
    // A `route-fade` baked into the markup holds the whole page at opacity 0
    // for its duration on a cold load, delaying LCP by exactly that much.
    expect(routeTransition).not.toMatch(/className=\{?["'`][^"'`]*route-fade/);
    expect(routeTransition).toMatch(/navigated/);
  });

  it("the cold-boot flag starts cold in server-rendered HTML", () => {
    expect(read("../../app/layout.tsx")).toMatch(/data-boot="cold"/);
  });

  it("the /charts entrance is opt-in too", () => {
    // Same failure as `route-fade`, reached through CSS instead of React: as
    // `.g2:not([data-entered])` the fade applied on first paint with no JS
    // involved, and `backwards` fill held the grid at opacity 0 through its
    // delay. It has to be a positive selector that only the client sets.
    expect(css).not.toMatch(/\.g2:not\(\[data-entered\]\)/);
    expect(css).toMatch(/\.g2\[data-enter\] \.g2-grid/);
    // …and the marker is only set once boot has gone warm.
    const dock = read("../../app/(home)/charts/use-gallery-dock.ts");
    expect(dock).toMatch(/dataset\.boot !== "warm"/);
  });

  it("live mode's late arrival is predicted, not just animated", () => {
    // `LanguageModel.availability()` settles after paint, so the composer and
    // the taller reply floor both land late. Landing them instantly snapped the
    // hero panel 315px -> 536px and shoved the caption under it (CLS 0.05).
    // The prediction is what gets that to zero for a returning visitor.
    expect(read("../../app/layout.tsx")).toMatch(
      /typeof LanguageModel!=="undefined"&&localStorage\.getItem\("mc-live"\)==="1"/,
    );
    expect(css).toMatch(/\[data-mc-live="1"\] \.hv-composer/);
    expect(css).toMatch(/\[data-mc-live="1"\] \.hv-reply-floor/);
    // …and the animated growth stays as the first-visit fallback.
    expect(css).toMatch(/\.hv-reply-floor\s*\{[^}]*transition:\s*min-height/);

    const live = read("../home/use-live-model.ts");
    // A stale flag must self-heal, or a visitor who uninstalled Nano keeps
    // reserving space nothing will ever fill.
    expect(live).toMatch(/localStorage\.removeItem\(LIVE_HINT_KEY\)/);
    expect(live).toMatch(/delete document\.documentElement\.dataset\.mcLive/);
  });

  it("the always-mounted composer stays collapsed and out of reach", () => {
    const vignette = read("../home/stream-vignette.tsx");
    // Rendered unconditionally so `1fr` can reserve its true height — which
    // means it must be inert when live is off, or the chips and the input are
    // tabbable inside a zero-height box for every visitor.
    expect(vignette).toMatch(/inert=\{!live\.supported\}/);
    // Under border-box sizing a grid item never shrinks below its own padding,
    // so the padded element must NOT be the direct child of the grid — that
    // leaked 27px into every collapsed panel.
    expect(vignette).toMatch(
      /className="hv-composer"[\s\S]{0,140}?>\s*<div>\s*<div className="border-t/,
    );
  });
});
