import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARTS } from "@/lib/charts/registry";
import { SHOWCASE } from "@/lib/showcase";
import { PRESETS } from "@/lib/mc-tokens";
import { CHART_GZIP } from "@/lib/stats";
import { BENCH } from "@/lib/docs-facts";
import { SHARES, CHECKOUT_P95, DEGRADE, FENCE_SERIES } from "./home-data";
import { heroData } from "./hero-data";

/**
 * The home page's load-bearing claims, held by source rather than by review.
 *
 * Every one of these was a real defect at some point in this page's history —
 * a comparison plotting two different datasets, a "seven apps use all 106"
 * headline that didn't add up, a preset wall that had drifted from the presets
 * the library ships. They are cheap to assert and expensive to notice.
 */

const dir = resolve(process.cwd(), "src/components/home");
const routeDir = resolve(process.cwd(), "src/app/(landing)");

/** The design language itself lives in `surface.css`, shared with /charts,
 *  /examples and /brand; `home.css` is what only this route has. Guards about
 *  the LANGUAGE read both; guards about a landing component read `home.css`. */
const surfacePath = resolve(process.cwd(), "src/app/surface.css");
const styles = () =>
  `${readFileSync(surfacePath, "utf8")}\n${readFileSync(join(routeDir, "home.css"), "utf8")}`;

const sources = () =>
  [
    ...readdirSync(dir)
      .filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts"))
      .map((f) => [f, readFileSync(join(dir, f), "utf8")] as const),
    ...readdirSync(routeDir)
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => [f, readFileSync(join(routeDir, f), "utf8")] as const),
  ] as const;

describe("Act I — the same component in four places", () => {
  it("plots one series in every frame; different data would prove nothing", () => {
    // Four frames, four Sparklines — but the KPI card is its own client module
    // (it holds the reading its chart drives), so the quad spans two files.
    const src = readFileSync(join(dir, "four-places.tsx"), "utf8");
    const kpi = readFileSync(join(dir, "kpi-card.tsx"), "utf8");
    // `PrintSparkline` is the fourth: the same component, static entry, because
    // that frame is paper.
    const sparks = [...src.matchAll(/<(?:Print)?Sparkline\b/g), ...kpi.matchAll(/<Sparkline\b/g)];
    expect(sparks.length).toBeGreaterThanOrEqual(4);
    for (const s of [src, kpi]) expect(s).not.toMatch(/data=\{\[\s*\d/); // no inline literal series
    expect(kpi).toContain("CHECKOUT_P95");
  });

  it("uses the checkout series the copy quotes", () => {
    expect(CHECKOUT_P95.at(-1)).toBe(141);
  });
});

describe("Act II — the fence renders the JSON it quotes", () => {
  it("the fenced data and the rendered mark are one array", () => {
    const src = readFileSync(join(dir, "fence-beat.tsx"), "utf8");
    expect(src).toContain("FENCE_SERIES.join");
    expect(src).toContain("data={[...FENCE_SERIES]}");
    expect(FENCE_SERIES.at(-1)).toBe(163);
  });
});

describe("the pie comparison", () => {
  it("draws both marks from one SHARES list", () => {
    const src = readFileSync(join(dir, "left-out.tsx"), "utf8");
    const reads = src.match(/SHARES/g) ?? [];
    // the pie geometry, the SegmentedBar data, the kicker, and the verdict
    expect(reads.length).toBeGreaterThanOrEqual(4);
    expect(src).not.toMatch(/data=\{\[\s*\{\s*label/); // no second dataset
  });

  it("states shares that are ordered largest-first and sum to a whole", () => {
    expect([...SHARES]).toEqual([...SHARES].sort((a, b) => b - a));
    expect(SHARES.reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe("the degradation cards", () => {
  it("pass the literal hostile inputs their labels claim", () => {
    for (const d of DEGRADE) {
      const rendered = `[${[...d.data]
        .map((n) => (Number.isNaN(n) ? "NaN" : n === Infinity ? "Infinity" : String(n)))
        .join(", ")}]`;
      expect(rendered).toBe(d.input);
    }
  });
});

describe("Act IV — seven apps, all 106 types", () => {
  it("the apps' own import lists union to the whole stable catalog", () => {
    const stable = new Set(CHARTS.filter((c) => c.status === "stable").map((c) => c.slug));
    const used = new Set(SHOWCASE.flatMap((a) => a.charts));
    expect(used.size).toBe(stable.size);
    expect([...stable].filter((s) => !used.has(s))).toEqual([]);
  });

  it("plates only draw marks their app actually imports", () => {
    const src = readFileSync(join(dir, "app-plates.tsx"), "utf8");
    const blocks = src.split(/slug: "/).slice(1);
    for (const block of blocks) {
      const slug = block.slice(0, block.indexOf('"'));
      const app = SHOWCASE.find((a) => a.slug === slug);
      if (!app) continue;
      const marks = /marks: \[([^\]]+)\]/.exec(block)?.[1] ?? "";
      for (const m of marks.matchAll(/"([a-z0-9-]+)"/g)) {
        expect(app.charts, `${app.name} does not import ${m[1]}`).toContain(m[1]);
      }
    }
  });

  it("shows a plate for every showcase app, each in a different preset", () => {
    const src = readFileSync(join(dir, "app-plates.tsx"), "utf8");
    const slugs = [...src.matchAll(/slug: "([a-z-]+)"/g)].map((m) => m[1]);
    expect(new Set(slugs).size).toBe(SHOWCASE.length);
    const presets = [...src.matchAll(/preset: "([a-z]+)"/g)].map((m) => m[1]!);
    for (const p of presets) expect(PRESETS.map((x) => x.id)).toContain(p);
    // At least five of the six presets on screen at once, or the wall isn't
    // showing what defineTheme spans.
    expect(new Set(presets).size).toBeGreaterThanOrEqual(5);
  });

  it("marks a plate 'ships' only when the showcase registry says so", () => {
    const src = readFileSync(join(dir, "app-plates.tsx"), "utf8");
    for (const block of src.split(/slug: "/).slice(1)) {
      const slug = block.slice(0, block.indexOf('"'));
      const app = SHOWCASE.find((a) => a.slug === slug);
      const claimsOwn = /own: true/.test(block.slice(0, block.indexOf("place:")));
      if (!app || !claimsOwn) continue;
      const preset = /preset: "([a-z]+)"/.exec(block)?.[1] ?? "";
      expect(app.tag, `${app.name} claims to ship ${preset}`).toContain(preset);
    }
  });
});

describe("the preset wall never drifts from the shipped presets", () => {
  it("derives every scoped bundle from mc-tokens rather than copied colours", () => {
    const src = readFileSync(join(dir, "preset-scope-style.tsx"), "utf8");
    expect(src).toContain("PRESETS");
    expect(src).toContain("PRESET_DARK_TWINS");
    expect(src).toContain("deriveCatPalette");
    // A hex literal here is a copied value, which is how a wall goes stale.
    expect(src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });
});

/** Every `.ts`/`.tsx` under a directory, recursively. */
const walk = (d: string): string[] =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : /\.tsx?$/.test(e.name) ? [join(d, e.name)] : [],
  );

/** Comments discuss the tags this suite bans, so they are stripped first. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("nothing on the page is an image", () => {
  it("no source renders <img>, <picture>, <video> or next/image", () => {
    for (const [file, src] of sources()) {
      const code = stripComments(src);
      expect(code, file).not.toMatch(/<(img|picture|video)[\s/>]/);
      expect(code, file).not.toMatch(/from "next\/image"/);
    }
  });
});

describe("every figure resolves from measured data", () => {
  it("the specimen sheet reads sizes from chart-sizes.json, not literals", () => {
    const src = readFileSync(join(dir, "glyph-specimen.tsx"), "utf8");
    expect(src).toContain("CHART_GZIP");
    expect(src.match(/\d+\.\d+ kB/g) ?? []).toEqual([]);
  });

  it("the bill counts a competitor figure from competitor-facts", () => {
    const src = readFileSync(join(dir, "bill-field.tsx"), "utf8");
    expect(src).toContain("RECHARTS.oneChartGzipKb");
    expect(src).toContain("SIZE.interactiveMedian");
  });

  it("the comparison table types no size of its own", () => {
    const src = readFileSync(join(dir, "give-up-table.tsx"), "utf8");
    expect(src).toContain("SIZE.interactiveMin");
    expect(src).toContain("RECHARTS.oneChartGzipKb");
  });

  it("every chart in the catalog has a measured interactive-or-static size", () => {
    for (const c of CHARTS.filter((x) => x.status === "stable")) {
      const g = CHART_GZIP[c.slug];
      expect(g, c.slug).toBeDefined();
      expect(typeof (g!.interactive ?? g!.static), c.slug).toBe("number");
    }
  });
});

describe("nothing on the page animates itself except the specimen", () => {
  it("declares no keyframes, and hides nothing the server painted", () => {
    const css = styles();
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
    // The page ships static. Every ENTRANCE this route tried — scroll reveals, a
    // staggered hero, the library's own draw — could only hide something the
    // server had already painted, so the reload read as a flicker. That still
    // holds, and it is a different thing from the specimen rotation: the first
    // frame is painted and opaque in server HTML, and only the four ALTERNATES
    // behind it rest at zero.
    // Exactly ONE keyframe is allowed, by name: the scroll cue's tick. It is page
    // chrome pointing at the rest of the document, not a chart drawing itself in
    // and not an entrance — the thing it annotates is painted and opaque before it
    // ever runs. Anything else that moves on this page is a `[data-state]`
    // transition, and a second `@keyframes` means an entrance has crept back.
    expect(rules.match(/@keyframes\s+([\w-]+)/g) ?? []).toEqual(["@keyframes home-cue"]);
    const anim = rules.replace(/animation:\s+/g, "animation:").match(/animation:[\w-]+/g) ?? [];
    expect([...new Set(anim)].sort()).toEqual(["animation:home-cue", "animation:none"]);
    // So every `opacity: 0` in the file has to be a swap state. A bare one on a
    // plain selector is the old failure coming back.
    // Keyframe STEPS (`0% { opacity: 0 }`) are not selectors and are not a hidden
    // resting state, so the one allowed animation's body is dropped first.
    const noFrames = rules.replace(/@keyframes\s+[\w-]+\s*\{[\s\S]*?\n\}/g, "");
    const blocks = [...noFrames.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
    for (const [, selector, body] of blocks) {
      if (!/opacity:\s*0\s*[;}]/.test(body!)) continue;
      expect(selector!.trim(), `hidden by default: ${selector!.trim()}`).toMatch(
        /\[data-state="(?:off|out)"\]/,
      );
    }
  });

  it("carries no reveal attributes, gate, or motion engine anywhere", () => {
    expect(readdirSync(dir)).not.toContain("use-home-reveal.ts");
    for (const [file, src] of sources()) {
      const code = stripComments(src);
      expect(code, file).not.toMatch(/data-(?:reveal|stagger|hero|anim)\b/);
      // `animate` makes a chart draw itself in; the motion engine import exists
      // only to serve it, so neither belongs on this route.
      expect(code, file).not.toMatch(/@microcharts\/react\/motion/);
      expect(code, file).not.toMatch(/^\s*animate\s*$/m);
    }
  });

  it("keeps the transitions it does have to hover and focus only", () => {
    const css = styles();
    // A transition is a response to the reader. Anything longer than a third of a
    // second stops reading as feedback and starts reading as choreography.
    //
    // The hero specimen swap is the ONE exception and it is deliberate: it is not
    // feedback, it is a hand-off between two charts, and at 0.3s two marks this
    // dense crossfade into a smear. It goes through `--hero-swap` precisely so it
    // is declared in one place and cannot be copied by accident — a second rule
    // reaching for it would have to name it.
    // Comments are stripped first: several of them contain the word `transition:`
    // followed by prose, and the scan was asserting on an explanation.
    for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/transition:[^;]*?([\d.]+)s/g)) {
      expect(Number(m[1]), m[0].trim()).toBeLessThanOrEqual(0.3);
    }
    expect(css).toMatch(/--hero-swap:\s*460ms/);
  });
});

describe("the hero claim rotates without moving anything", () => {
  const frames = () => readFileSync(join(dir, "hero-frames.tsx"), "utf8");
  const sentence = () => readFileSync(join(dir, "hero-sentence.tsx"), "utf8");
  const css = () => readFileSync(join(routeDir, "home.css"), "utf8");

  it("rotates the SENTENCE, not just the mark", () => {
    // An earlier pass swapped only the chart and left one sentence about
    // kilobytes underneath it, so three frames out of four sat inside words that
    // had nothing to do with them — the mark changed and the claim did not, which
    // reads as decoration. Each frame owns its own sentence and its own mark.
    const src = stripComments(frames());
    expect(src.match(/sentence: \(/g) ?? []).toHaveLength(4);
    expect(src.match(/<Mark>/g) ?? []).toHaveLength(4);
    expect(stripComments(sentence())).not.toMatch(/hero-cap/);
  });

  it("shows no chart type twice, and no dataset twice", () => {
    const src = stripComments(frames());
    const types = [...src.matchAll(/^\s+<([A-Z]\w+)$/gm)].map((m) => m[1]!);
    expect(types).toHaveLength(4);
    // Two of one type is one claim wearing two costumes, and so is one dataset
    // drawn two ways. Both shipped for a few minutes and both read as padding —
    // the fold is meant to show the catalog's RANGE.
    expect(new Set(types).size, types.join(",")).toBe(4);
    const data = [...src.matchAll(/data=\{d\.(\w+)\}/g)].map((m) => m[1]!);
    expect(data).toHaveLength(4);
    expect(new Set(data).size, data.join(",")).toBe(data.length);
  });

  it("draws every frame at one size, or its own sentence re-wraps", () => {
    const src = stripComments(frames());
    expect(src).toMatch(/const W = \d+;/);
    expect(src).toMatch(/const H = \d+;/);
    expect(src.match(/width=\{W\}/g) ?? []).toHaveLength(4);
    expect(src.match(/height=\{H\}/g) ?? []).toHaveLength(4);
    expect(src).not.toMatch(/(?:width|height)=\{\d/);
  });

  it("reserves the tallest sentence, so nothing below the claim can be pushed", () => {
    // All four share ONE grid cell, so the box is the height of the tallest at the
    // current width — correct in server HTML, identical on every tick. Absolute
    // positioning would collapse the box and let it move on every rotation.
    expect(css()).toMatch(/\.home \.hero-say \{[^}]*display: grid/s);
    expect(css()).toMatch(/\.home \.hero-say > \.sentence \{[^}]*grid-area: 1 \/ 1/s);
  });

  it("quotes each type's own measured weight in the callout", () => {
    // Four types spanning ~2–7 kB demonstrate the range the first sentence
    // claims. A hard-coded kB beside a mark that becomes three other charts is
    // the exact drift this file exists to catch, so the callout reads
    // `chart-sizes.json` by slug and this checks the four it resolves.
    const quoted = Object.values(heroData().kb);
    expect(quoted).toHaveLength(4);
    const real = new Set(Object.values(CHART_GZIP).map((g) => g.interactive));
    for (const kb of quoted) expect(real, String(kb)).toContain(kb);
    expect(stripComments(frames())).not.toMatch(/kb: [\d.]+,/);
  });

  // The hero's series are measured, not typed: `hero-data.ts` reads them on the
  // server and `ActOne` passes them in, because `hero-frames.tsx` is a client
  // component and importing the registry there would ship ~236 kB of JSON to
  // plot 105 numbers. These tests hold both halves — that the arrays are the
  // real ones, and that no figure in the prose is a literal.
  const stable = () => CHARTS.filter((c) => c.status === "stable");

  it("plots every measured interactive size, in order", () => {
    const measured = stable()
      .map((c) => CHART_GZIP[c.slug]?.interactive)
      .filter((n): n is number => typeof n === "number")
      .sort((a, b) => a - b);
    // 105 of 106 — `wind-barb` ships static only.
    expect([...heroData().sizes]).toEqual(measured);
  });

  it("plots every measured SVG payload, in order", () => {
    const measured = stable()
      .map((c) => BENCH.chart(c.slug)?.avgBytes)
      .filter((n): n is number => typeof n === "number")
      .sort((a, b) => a - b);
    expect([...heroData().svgBytes]).toEqual(measured);
  });

  it("splits the catalog by its real collections, and counts the real apps", () => {
    const d = heroData();
    expect(d.collections.reduce((n, c) => n + c.value, 0)).toBe(d.total);
    expect(d.apps).toEqual(SHOWCASE.map((a) => a.charts.length));
    // The sentence says "Seven example apps" in words; an eighth would make it
    // false without touching a number.
    expect(SHOWCASE.length).toBe(7);
    expect(stripComments(frames())).toContain("Seven example apps");
  });

  it("types no figure of its own — every number comes from the data prop", () => {
    // The sentences used to carry the medians as literals beside the arrays they
    // describe, which is the pair most likely to drift: the array gets
    // regenerated and the prose doesn't. Both are computed from `d` now.
    const src = stripComments(frames());
    expect(src).toContain("<Fig>{median(d.sizes)} kB</Fig>");
    expect(src).toContain('<Fig>{median(d.svgBytes).toLocaleString("en-US")}</Fig>');
    expect(src).not.toMatch(/<Fig>[\d,]/);
  });

  it("claims a ceiling only while every chart is under it", () => {
    // "the biggest is < 7 kB" holds while the largest measured size is strictly
    // below the whole number; sparkline is 6,995 B, which rounds to 7.00 kB, so
    // the sentence states the max itself rather than an inequality it fails.
    const sizes = heroData().sizes;
    const max = sizes[sizes.length - 1]!;
    const ceiling = Math.ceil(max);
    expect(stripComments(frames())).toContain("const biggest = max < ceiling");
    expect(max).toBeLessThanOrEqual(ceiling);
  });

  it("gives the rail one dot per claim, and every dot a name", () => {
    const src = stripComments(sentence());
    expect(src).toMatch(/frames\.map\(\(f, i\) => \(\s*<button/s);
    expect(src).toContain("aria-label={f.name}");
    expect(src).toContain("aria-selected={i === active}");
    // State is never colour alone on this page, and its own furniture follows the
    // rule the charts do: the active dot is longer as well as accented.
    //
    // The LENGTH is what matters, not the property. It used to be an animated
    // `width`, which is layout: two rotations ran ~110 layouts on the fold every
    // thirteen seconds, for the life of the page. The mark is now always the full
    // bar and the rest state clips it to the circle in its middle, so the reading
    // is identical and the fold lays out nothing at all while it rotates.
    const on = /\.home \.hero-dot\[data-state="on"\] \.hero-dot-mark \{([^}]*)\}/s.exec(css())?.[1];
    expect(on, "the active dot must differ by more than colour").toMatch(/clip-path|width:/);
    expect(css(), "the rail must not animate a layout property").not.toMatch(
      /\.hero-dot-mark \{[^}]*transition:[^;]*\bwidth\b/s,
    );
  });

  it("hides every claim but the visible one from keyboards and screen readers", () => {
    // Four mounted charts is four tab stops and four announced images, and the
    // callout beside them says "one tab stop" — without `inert` that label lies.
    expect(stripComments(sentence())).toMatch(/inert=\{i !== active\}/);
  });

  it("stops the cycle for reduced motion rather than cutting without one", () => {
    const src = stripComments(sentence());
    expect(src).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    // And a hidden tab, a reader inspecting the mark, or one stepping the rail
    // all hold it.
    expect(src).toContain("visibilitychange");
    expect(src).toContain("onPointerEnter");
  });

  it("crossfades with overlap, so the box is never blank mid-swap", () => {
    // The first version eased opacity on `--e` (ease-out-expo) and delayed the
    // incoming frame by 90ms. Expo spends almost all of its change in the first
    // few frames, so the outgoing sentence hit zero before the incoming one
    // started and the box went visibly BLANK — caught in a screenshot, and
    // exactly the flicker this rotation is not allowed to have. Opacity is LINEAR
    // and undelayed so the pair cross; only the travel keeps its easing.
    for (const sel of ["\\.hero-say > \\.sentence", "\\.fan-swap"]) {
      expect(css(), sel).toMatch(
        new RegExp(`\\.home ${sel} \\{[^}]*opacity var\\(--hero-fade\\) linear`, "s"),
      );
    }
    expect(css()).not.toMatch(/transition-delay/);
  });

  it("never clips the mark, because the readout lives outside it", () => {
    // The hover readout is absolutely positioned at `bottom: 100%` of the chart.
    // `overflow: clip` on the slot cut it off, which removed the one piece of UI
    // in the fold that proves the mark is interactive.
    const mark = /\.home \.hero-mark \{([\s\S]*?)\n\}/.exec(css())?.[1] ?? "";
    expect(mark).not.toMatch(/overflow/);
    // Full-bleed types (SegmentedBar, SparkBar) paint to the very edge of their
    // box and read as glued to the words at `.mc-inline`'s own `.2em`. Only a
    // little more, though: `.45em` opened a hole and split the line in two.
    expect(mark).toMatch(/margin-inline: 0\.22em/);
  });
});

describe("inline marks use the library's own seat", () => {
  it("wraps every mark in running prose in .mc-inline and improvises nothing", () => {
    for (const [file, src] of sources()) {
      const code = stripComments(src);
      // The library ships the seat: a chart emits `--mc-seat` from its geometry
      // and `.mc-inline` (styles.css) stands it on the text baseline like a glyph.
      // A hand-rolled `align-[-0.22em]` is one guessed offset applied to every
      // type regardless of whether it has a floor or a midline, and it drifts with
      // the typeface. There is no case for it.
      expect(code, file).not.toMatch(/align-\[-?[\d.]+em\]/);
      expect(code, file).not.toMatch(/\bvertical-?[Aa]lign\b/);
    }
    // And the marks that ARE in prose take it.
    for (const f of ["four-places.tsx", "paper-inversion.tsx"]) {
      const src = readFileSync(join(dir, f), "utf8");
      const marks = (src.match(/<(?:Sparkline|SparkBar|MicroBox|HeatStrip|RugStrip)\b/g) ?? [])
        .length;
      expect(marks, f).toBeGreaterThan(0);
      expect(src, f).toContain('className="mc-inline"');
    }
    // The hero's marks moved into `hero-frames.tsx` when the claim started
    // rotating, and the seat moved WITH them — each sentence sets its own mark, so
    // the wrapper belongs beside the words it sits in. One `Mark` helper carries
    // it for all four, which is what stops a fifth frame being added without one.
    const frames = readFileSync(join(dir, "hero-frames.tsx"), "utf8");
    expect(frames).toMatch(/<(?:Sparkline|SparkBar|SegmentedBar|RugStrip)\b/);
    expect(frames).toContain('className="mc-inline hero-mark"');
    expect(frames.match(/<Mark>/g) ?? []).toHaveLength(4);
    // A chart in a table CELL is not prose and takes the table reset instead.
    expect(readFileSync(join(dir, "four-places.tsx"), "utf8")).toContain("mc-inline-table");
  });

  it("lets the fold measure one thing, and never a position it lays out with", () => {
    const src = readFileSync(join(dir, "hero-sentence.tsx"), "utf8");
    const code = stripComments(src);
    // The tree's geometry is CSS percentages the server already knows. The only
    // thing JS may compute is `--fan-x`, the stem's horizontal aim, because the
    // mark sits mid-sentence and only a browser knows where the line wrapped.
    // Writing label positions instead is what made the labels jump 270px at
    // hydration, so: one property, and nothing that lays out may read from it.
    expect(code).toContain("--fan-x");
    expect(code).not.toMatch(/\.style\.(?:left|top|width|height)\s*=/);
    expect(code).not.toMatch(/setAttribute\(\s*"d"/);
    expect(code).not.toContain("offsetWidth");
    expect(code).not.toContain("fonts.ready");
    // And the CSS has to own every other coordinate.
    const css = readFileSync(join(routeDir, "home.css"), "utf8");
    expect(css).toMatch(/\.home \.fan-lab \{[^}]*left: calc\(var\(--fan-step\)/s);
    expect(css).toMatch(/\.home \.fan-drop \{[^}]*left: calc\(var\(--fan-step\)/s);
    // The stem is the ONE part of the tree the server cannot place: it points at
    // the mark, and where the mark lands depends on where the sentence wrapped.
    // It used to render at the `50%` default and snap across on hydration — a
    // sideways jump with no cause a reader could see. So it must start scaled to
    // nothing and draw itself once a browser has measured. The fallback stays as
    // a value, but nothing is painted at it.
    //
    // The aim is a signed pixel offset from the middle applied with `translate`,
    // NOT an absolute `left`. It changes every six seconds for as long as the
    // page is open, and `left` re-ran layout and paint for all 460ms of every one
    // of those moves; `translate` is a compositor property. The 50% is now a
    // static anchor and the fallback offset is zero — same place, no layout.
    expect(css).toMatch(/\.home \.fan-stem \{[^}]*left: 50%/s);
    expect(css).toMatch(/translate: var\(--fan-x, 0px\)/);
    expect(css).not.toMatch(/transition:[^;]*\bleft\b/);
    expect(css).toMatch(/\.home \.fan-stem\[data-state="off"\] \{[^}]*transform: scaleY\(0\)/s);
    expect(stripComments(src)).toContain('data-state={aimed ? "on" : "off"}');
    // And the rest of the tree still IS server-renderable — only the stem waits.
    expect(css).not.toMatch(/\.home \.fan-(?:bus|drop)\[data-state/);
  });
});

describe("interactivity is spent where a reader can act on it", () => {
  /** Sections that import an `/interactive` entry, and the reason each earns it. */
  const EARNS_IT = new Set([
    // The fold's living marks: hovering one IS the product's thesis. They live in
    // `hero-frames.tsx` because each rotating claim sets its own.
    "hero-frames.tsx",
    // One `domain` toggle re-scaling five encodings — the readouts are how you
    // check that each one stayed correct.
    "grammar-rows.tsx",
    // "The same component in four places" is a claim about SCREENS. Three of the
    // four are screens, and a mark you can scrub in a sentence, in a table cell
    // and on a card proves sameness better than three still pictures do.
    "four-places.tsx",
    // The card whose chart drives the card: `onActive` → the big number.
    "kpi-card.tsx",
    // The fence's mark is the thing the fence produced. A mark you cannot touch
    // is a picture of a component, which is the one thing this beat denies.
    "fence-beat.tsx",
  ]);

  it("imports the interactive entry in exactly the sections that use it", () => {
    const found = new Set<string>();
    for (const [file, src] of sources()) {
      if (/@microcharts\/react\/[\w-]+\/interactive/.test(stripComments(src))) found.add(file);
    }
    // The exclusions are surfaces, not budgets: the printed sheet and the printed
    // frame inside the placement quad stay static, because paper has no pointer.
    expect([...found].sort()).toEqual([...EARNS_IT].sort());
  });

  it("keeps the printed sheet static, and every section a server module", () => {
    // `paper-inversion` is the printed page — static entries only, no exceptions.
    const paper = stripComments(readFileSync(join(dir, "paper-inversion.tsx"), "utf8"));
    expect(paper).not.toMatch(/@microcharts\/react\/[\w-]+\/interactive/);
    // …and the printed FRAME inside the placement quad is held to the same rule,
    // which is what the static alias is for.
    expect(stripComments(readFileSync(join(dir, "four-places.tsx"), "utf8"))).toMatch(
      /Sparkline as PrintSparkline \} from "@microcharts\/react\/sparkline"/,
    );
    // Importing a `'use client'` entry does not make the importer a client module.
    // These three stay server-rendered; only `kpi-card` holds state.
    for (const f of ["four-places.tsx", "fence-beat.tsx", "paper-inversion.tsx"]) {
      const src = stripComments(readFileSync(join(dir, f), "utf8"));
      expect(src, f).not.toContain('"use client"');
    }
  });

  it("reads the KPI card's number off the chart it sits beside", () => {
    const src = stripComments(readFileSync(join(dir, "kpi-card.tsx"), "utf8"));
    // `readout={false}` + `datum.formatted` is the library's documented KPI
    // pattern: one reading, painted once, in the place the card already reads.
    expect(src).toContain("readout={false}");
    expect(src).toContain("onActive=");
    expect(src).toContain("d.formatted");
    // No hardcoded 141 — the card's resting value is the series' own last point,
    // so editing `CHECKOUT_P95` can never leave a stale number on the card.
    expect(src).not.toMatch(/\b141\b/);
    expect(src).toContain("CHECKOUT_P95");
  });
});

describe("every link and command on the page resolves", () => {
  it("points the machine surfaces at the routes this site actually serves", () => {
    const src = readFileSync(join(dir, "fence-beat.tsx"), "utf8");
    const appDir = resolve(process.cwd(), "src/app");
    for (const m of src.matchAll(/href: "\/([\w.-]+)"/g)) {
      // `/llms.txt` is served by `src/app/llms.txt/route.ts`, so the route
      // segment is the filename itself. A label pointing at a human page —
      // `agent-setup.md` at `/docs/ai` — is the failure this catches.
      expect(readdirSync(appDir), m[1]).toContain(m[1]);
    }
  });

  it("gives every shell command a copy button", () => {
    for (const [file, src] of sources()) {
      const code = stripComments(src);
      // A command is a binary followed by a VERB or a flag. Requiring that keeps
      // prose like "installs it from npm the way you would" out of the results.
      const CMD = /(?:npx|pnpm|npm|yarn|bun)\s+(?:-\w|add|install|i|create|dlx|exec|run)\b/g;
      for (const m of code.matchAll(CMD)) {
        const around = code.slice(Math.max(0, m.index - 220), m.index + 60);
        expect(around, `${file}: ${m[0]}`).toMatch(/CopyLine|CommandLine|SIZE_LIMIT|import \{/);
      }
    }
  });
});

describe("the specimen sheet sends the reader somewhere", () => {
  it("makes every cell a link to that chart's own page", () => {
    const src = readFileSync(join(dir, "specimen-lattice.tsx"), "utf8");
    // `/docs/charts/<slug>` is the reference page. `/charts/<slug>` is the
    // COLLECTION route, which 500s on any slug that isn't a collection — 13 of the
    // 106 shipped that way once, and only a link-follow caught it.
    expect(src).toContain("href={`/docs/charts/${item.slug}`}");
    expect(src).not.toMatch(/href=\{`\/charts\/\$/);
    // Not a button that copies and stops. The import is still one click away on
    // the readout, but the sheet's own job is to open the reference page.
    expect(stripComments(src)).not.toMatch(/<button[^>]*data-cell/s);
    expect(src).toContain("HTMLAnchorElement");
  });

  it("builds the sheet from the same list the router publishes", () => {
    const src = readFileSync(join(dir, "glyph-specimen.tsx"), "utf8");
    expect(src).toContain('CHARTS.filter((c) => c.status === "stable")');
    expect(CHARTS.filter((c) => c.status === "stable").length).toBeGreaterThan(100);
  });

  it("centres every cell, so 106 aspect ratios read as one sheet", () => {
    const css = readFileSync(join(routeDir, "home.css"), "utf8");
    const cell = /\.home \.cell \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
    expect(cell).toContain("justify-items: center");
    expect(cell).toContain("text-align: center");
    expect(css).toMatch(/\.home \.cell-mark \{[^}]*justify-content: center/s);
  });
});

describe("the masthead is the site's, not a second one", () => {
  it("renders SiteNav and defines no bespoke rail", () => {
    const shell = readFileSync(join(dir, "home-shell.tsx"), "utf8");
    expect(shell).toContain("<SiteNav />");
    expect(readdirSync(dir)).not.toContain("home-masthead.tsx");
    // A `<header>` of its own would be a second rail competing with the real one.
    for (const [file, src] of sources()) {
      expect(stripComments(src), file).not.toMatch(/<header[\s>]/);
    }
  });

  it("shares one measure with the nav, so the first line starts under the wordmark", () => {
    const css = styles();
    // `.shell` is the nav's own container: --container-shell + the nav's gutters.
    // It lives in surface.css now, so /charts and /examples share the same axis.
    expect(css).toMatch(/\.surface \.shell \{[^}]*max-width: var\(--container-shell\)/s);
    expect(css).toMatch(/\.surface \.shell \{[^}]*padding-inline: 1rem/s);
    // And no section may reintroduce the private gutter this replaced. (Card
    // padding like `sm:px-5` is not a page gutter and is none of this test's
    // business — `lg:px-10` and a second `max-w-shell` are exactly what drifted.)
    for (const [file, src] of sources()) {
      const code = stripComments(src);
      expect(code, file).not.toMatch(/\bmax-w-shell\b/);
      expect(code, file).not.toMatch(/\blg:px-10\b/);
    }
  });
});

describe("the page invents no editorial furniture", () => {
  it("numbers no figure, table or plate it cannot count", () => {
    for (const [file, src] of sources()) {
      const code = stripComments(src);
      expect(code, file).not.toMatch(/\bfig\.\s*\d/i);
      expect(code, file).not.toMatch(/\b(table|plate)\s+\d\b/i);
    }
  });

  it("spends at most two em-dashes on the whole page", () => {
    // A budget from the brief. Comments are stripped, and so are the box-drawing
    // rules this file's own section dividers are made of.
    const total = sources().reduce((n, [, src]) => {
      const code = stripComments(src).replace(/─+/g, "");
      return n + (code.match(/—/g) ?? []).length;
    }, 0);
    expect(total).toBeLessThanOrEqual(2);
  });
});

describe("rules stay quiet and controls stay still", () => {
  it("keeps both rule weights faint and draws no rule in the lattice at all", () => {
    const css = styles();
    for (const m of css.matchAll(/--rule-2: color-mix\(in oklab, #[0-9a-f]{6} (\d+)%/g)) {
      expect(Number(m[1]), "the emphasis rule is structure, not a mark").toBeLessThanOrEqual(20);
    }
    // The lattice used to rule all four sides of 106 cells and then halve the
    // hairline to survive it. It is separated by space now: a cell is a field,
    // and the sheet carries no line ink of its own. Half a hairline times 220
    // edges is still 220 edges.
    const cells = /\.home \.cells \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
    const cell = /\.home \.cell \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
    expect(cells).toMatch(/\n {2}gap:/);
    for (const block of [cells, cell]) expect(block).not.toMatch(/^\s*border[^-]/m);
  });

  it("locks the specimen readout's height and draws no rule above it", () => {
    const css = readFileSync(join(routeDir, "home.css"), "utf8");
    expect(css).toMatch(/\.home \.readout \{[^}]*height: \d+px/s);
    expect(css).toMatch(/line-clamp: 2/);
    const src = readFileSync(join(dir, "specimen-lattice.tsx"), "utf8");
    const readout = /className="readout([^"]*)"/.exec(src)?.[1] ?? "";
    expect(readout).not.toContain("border-t");
  });

  it("arranges Act IV's plates in flush rows, width being the only encoding", () => {
    const src = readFileSync(join(dir, "app-plates.tsx"), "utf8");
    const code = stripComments(src);
    expect(code).not.toContain("marginTop");
    expect(code).not.toContain("zIndex");
    // Width still varies, or the count is no longer readable from the layout.
    const spans = [...code.matchAll(/gridColumn: "(\d+) \/ (\d+)"/g)].map(
      (m) => Number(m[2]) - Number(m[1]),
    );
    expect(new Set(spans).size).toBeGreaterThanOrEqual(3);
  });
});

describe("code is highlighted by one shared lexer", () => {
  it("has no second copy of the tokenizer anywhere in the app", () => {
    // Two lexers, one palette: `jsx-lex` reads the JSX snippets, `config-lex`
    // reads the JSON/TOML/YAML/shell blocks on /docs/mcp. They cover disjoint
    // languages and share the `tok-*` classes; a THIRD file emitting those
    // classes is the duplicate this guards against.
    const libDir = resolve(process.cwd(), "src");
    const owners = walk(libDir)
      .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
      .filter((f) => /tok-tag/.test(readFileSync(f, "utf8")));
    expect(owners.map((f) => f.replace(`${libDir}/`, "")).sort()).toEqual([
      "lib/config-lex.ts",
      "lib/jsx-lex.ts",
    ]);
  });

  it("puts the home code surfaces on that lexer and on one code style", () => {
    for (const f of ["grammar-rows.tsx", "fence-beat.tsx", "define-theme-line.tsx"]) {
      const src = readFileSync(join(dir, f), "utf8");
      expect(src, f).toContain("CodeTokens");
      expect(src, f).toMatch(/className="code|className="[^"]*\bcode\b/);
    }
  });
});

describe("the appearance popover explains the presets it offers", () => {
  it("reads the preset list and its notes from mc-tokens", () => {
    const src = readFileSync(resolve(process.cwd(), "src/components/appearance-menu.tsx"), "utf8");
    expect(src).toContain('from "@/lib/mc-tokens"');
    expect(src).toContain("p.note");
    // No second hand-written preset list to drift from the shipped bundles.
    expect(stripComments(src)).not.toMatch(/id: "editorial", label:/);
  });

  it("has a note for every preset the library ships", () => {
    for (const p of PRESETS) {
      expect(p.note, p.id).toBeTruthy();
      expect(p.note.length, p.id).toBeLessThanOrEqual(80);
    }
  });
});

describe("the close is a door, not a second colophon", () => {
  it("does not reprint the licence or the author the footer already carries", () => {
    const src = stripComments(readFileSync(join(routeDir, "page.tsx"), "utf8"));
    // The footer sits ~200px below and already prints "Zero deps · MIT" and the
    // name. Saying it twice made the close read as a page that had run out of
    // things to say. The author link lives in the footer, where it always did.
    expect(src).not.toContain("SITE.author");
    expect(src).not.toMatch(/Zero dependencies/);
  });

  it("offers the same four actions as the current home page", () => {
    const src = readFileSync(join(dir, "actions.tsx"), "utf8");
    // Same destinations, so two homepages cannot disagree about what to do next.
    for (const href of ["/docs/quickstart", "/charts", "/docs", "SETUP_HREF"]) {
      expect(src, href).toContain(href);
    }
    // The AI door comes from the one exported constant, never a typed path.
    expect(src).toContain('from "@/components/ui/setup-with-ai"');
    expect(src).not.toMatch(/quickstart#set-up/);
    // And it is this page's language: no filled pill, no shadow.
    const css = styles();
    expect(css).not.toMatch(/\.ctrl-accent/);
    expect(css).toMatch(/\.surface \.door\[data-primary\]/);
  });
});

describe("the display face keeps its floor", () => {
  it("never sets the display family below 40px and never on a numeral", () => {
    const css = styles();
    // Each rule that uses var(--fd) declares a clamp whose LOWER bound is the
    // smallest size it can render. `.display-2` may go under 40 on a phone, where a
    // 48px heading would not fit the measure — but nothing else may.
    const usesDisplay = css
      .split("}")
      .filter((c) => c.includes("var(--fd)"))
      .map((c) => c.trim());
    expect(usesDisplay.length).toBeGreaterThan(0);
    for (const rule of usesDisplay) {
      const min = /clamp\((\d+)px/.exec(rule)?.[1];
      expect(min, rule.slice(0, 60)).toBeDefined();
      expect(Number(min), rule.slice(0, 60)).toBeGreaterThanOrEqual(30);
    }
    // No figure is ever set in it: every number in running text is `.num` and
    // every number that IS the statement is `.figure`, both the mono family.
    expect(css).toMatch(/\.surface \.num \{[^}]*var\(--fm\)/s);
    expect(css).toMatch(/\.surface \.figure \{[^}]*var\(--fm\)/s);
  });
});
