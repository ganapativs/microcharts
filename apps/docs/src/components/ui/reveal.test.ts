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
const css = read("../../app/global.css");
const srcFiles = () =>
  [...findFiles(new URL("../../", import.meta.url))].filter(
    (f) => /\.(tsx|ts|css)$/.test(f) && !f.includes(".test."),
  );

/** First paint ungated on JS; no scroll/route entrance choreography. */
describe("first paint is never gated on JS, and entrance choreography stays dead", () => {
  it("Reveal is a plain server-rendered wrapper", () => {
    // No client boundary, no state, no observer: a wrapper that needs hydration
    // to become visible is the bug this file guards against.
    expect(reveal).not.toMatch(/"use client"/);
    expect(reveal).not.toMatch(/useState|useEffect|IntersectionObserver/);
  });

  it("the deferred opt-out stays gone", () => {
    // `deferred` hid its subtree in the server HTML. Nothing may re-adopt it.
    // Prose may explain why it's gone; a prop, default, or type may not.
    expect(reveal).not.toMatch(/deferred\s*[?:=]/);
    const callSites = srcFiles()
      .filter((f) => f.endsWith(".tsx") && !f.endsWith("reveal.tsx"))
      .filter((file) => /<Reveal[^>]*\sdeferred[\s/>]/.test(readFileSync(file, "utf8")))
      .map((f) => f.replace(/^.*\/src\//, "src/"))
      .sort();
    expect(callSites).toEqual([]);
  });

  it("no CSS rule hides a reveal", () => {
    // A `[data-reveal]` opacity:0 anywhere means blank server HTML for the
    // length of the JS download.
    const hidingSelectors = [...css.matchAll(/^(\[data-reveal[^\]]*\][^{]*)\{([^}]*)\}/gm)]
      .filter(([, , body]) => /opacity:\s*0(?!\.)/.test(body))
      .map(([, selector]) => selector.trim());
    expect(hidingSelectors).toEqual([]);
  });

  it("the hero stream starts on hydration, with no added hold", () => {
    // The panel is server-rendered; hydration is already the late moment. A
    // startDelay on top of it (900ms, sized to a headline animation that no
    // longer exists) read as the section being broken.
    const vignette = read("../home/stream-vignette.tsx");
    expect(vignette).not.toMatch(/startDelay/);
    expect(read("../home/home-hero.tsx")).toMatch(/<StreamVignette serif \/>/);
  });

  it("route fades and gallery entrances stay removed", () => {
    for (const file of srcFiles()) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/route-fade/);
      expect(text, file).not.toMatch(/data-enter\b/);
    }
  });

  it("scroll-reveal machinery stays removed", () => {
    // The old entrance: a transform-carrying rise, staggered by --i ladders.
    expect(css).not.toMatch(/rise-in/);
    expect(css).not.toMatch(/hx-stagger/);
    for (const file of srcFiles()) {
      if (!file.endsWith(".tsx")) continue;
      expect(readFileSync(file, "utf8"), file).not.toMatch(/hx-stagger/);
    }
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
