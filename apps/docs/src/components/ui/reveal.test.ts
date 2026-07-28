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

  it("the on-device model is offered, never downloaded", () => {
    // `availability()` returning "downloadable" must NOT light the tab up: that
    // would put a multi-gigabyte model download one click away from a docs page.
    const live = read("../charts/use-live-model.ts");
    expect(live).toMatch(/a === "available"/);
    expect(live).not.toMatch(/"downloadable"\s*(?:===|\)|\|\|)/);
    // The tab exists only once the answer is in, so nothing is reserved for a
    // visitor who will never see it.
    expect(read("../charts/stream-demo.tsx")).toMatch(/live\.supported && tab\(LIVE_ID/);
  });
});
