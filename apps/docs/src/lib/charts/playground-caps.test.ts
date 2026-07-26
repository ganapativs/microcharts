import { describe, expect, it } from "vitest";
import { FIXTURES } from "@/components/charts/playground-options";
import { PLAYGROUND_CAPS } from "./playground-caps.generated";
import { STABLE_CHARTS } from "./registry";

// The playground draws a control only when this map says the chart responds to
// it (the map is produced by rendering every chart with every option — see
// scripts/gen-playground-caps.mjs). A chart missing from the map silently loses
// its Data / Numbers / naming controls, and a phantom slug means the map was
// generated against a different catalog. Regenerate with
// `pnpm gen:playground-caps`.
describe("playground capability map", () => {
  const slugs = STABLE_CHARTS.map((c) => c.slug);

  it("covers every stable chart", () => {
    const missing = slugs.filter((s) => !PLAYGROUND_CAPS[s]);
    expect(missing, `regenerate: pnpm gen:playground-caps — missing ${missing.join(", ")}`).toEqual(
      [],
    );
  });

  it("lists no chart the catalog doesn't have", () => {
    const known = new Set(slugs);
    expect(Object.keys(PLAYGROUND_CAPS).filter((s) => !known.has(s))).toEqual([]);
  });

  it("only names fixtures that exist", () => {
    const known = new Set(FIXTURES.map((f) => f.key));
    const bogus = Object.entries(PLAYGROUND_CAPS).flatMap(([slug, c]) =>
      c.fixtures.filter((f) => !known.has(f)).map((f) => `${slug}:${f}`),
    );
    expect(bogus).toEqual([]);
  });

  it("never offers the untouched series as a fixture — it is the default", () => {
    const offenders = Object.entries(PLAYGROUND_CAPS)
      .filter(([, c]) => c.fixtures.includes("typical"))
      .map(([slug]) => slug);
    expect(offenders).toEqual([]);
  });

  it("keeps every chart nameable — title and summary are the a11y contract", () => {
    const unnameable = Object.entries(PLAYGROUND_CAPS)
      .filter(([, c]) => !c.title || !c.summary)
      .map(([slug]) => slug);
    expect(unnameable).toEqual([]);
  });

  it("marks the two inline-HTML charts as having no id-naming mode", () => {
    // Delta and TokenConfidence render inline HTML instead of <Chart>, so they
    // have no <title>/<desc> pair for `aria-labelledby` to point at (CLAUDE.md
    // documents both as the standing exceptions).
    const noId = Object.entries(PLAYGROUND_CAPS)
      .filter(([, c]) => !c.idNaming)
      .map(([slug]) => slug)
      .sort();
    expect(noId).toEqual(["delta", "token-confidence"]);
  });
});
