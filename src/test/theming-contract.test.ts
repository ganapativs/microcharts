// Theming invariants that live in `styles.css` and can only be checked against
// the stylesheet's own token VALUES: label ink contrast on the fills it lands on,
// achromatic presets actually being achromatic, the forced-colors mappings, and
// the one easing literal that is duplicated in JS because WAAPI cannot read a
// custom property.
//
// These are arithmetic, not rendering, so they belong in the node project: the
// numbers come out of the same hex literals a browser would resolve, and a
// palette edit that quietly drops a label below 4.5:1 fails here instead of in a
// screenshot nobody re-reads.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MC_EASE_ENTER } from "../shared/motion-gate.js";

const root = resolve(import.meta.dirname, "../..");
const css = readFileSync(resolve(root, "styles.css"), "utf8");

// ---------------------------------------------------------------- colour maths

type RGB = readonly [number, number, number];

function hex(h: string): RGB {
  const s = h.trim().replace("#", "");
  const full = s.length === 3 ? [...s].map((c) => c + c).join("") : s;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as unknown as RGB;
}

/** `rgba(r, g, b, a)` → premultiplied composite over `bg`. */
function rgbaOver(decl: string, bg: RGB): RGB {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/.exec(decl);
  if (!m) throw new Error(`not an rgba() colour: ${decl}`);
  const a = m[4] === undefined ? 1 : Number(m[4]);
  return [0, 1, 2].map((i) => Number(m[i + 1]) * a + bg[i]! * (1 - a)) as unknown as RGB;
}

/** Composite an opaque colour at `alpha` over `bg` — what `fill-opacity` does. */
function over(fg: RGB, alpha: number, bg: RGB): RGB {
  return [0, 1, 2].map((i) => fg[i]! * alpha + bg[i]! * (1 - alpha)) as unknown as RGB;
}

function luminance(c: RGB): number {
  const ch = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as unknown as RGB;
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

function contrast(a: RGB, b: RGB): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** WCAG 1.4.3 for body-size text. In-chart labels are 7–11 viewBox units, which
 *  is never "large text" at any rendered size the catalog targets. */
const AA = 4.5;

// ------------------------------------------------------------- token extraction

/** The declarations inside the first `{…}` after `marker`. */
function block(marker: string): string {
  const at = css.indexOf(marker);
  expect(at, `styles.css no longer contains ${marker}`).toBeGreaterThan(-1);
  const open = css.indexOf("{", at);
  return css.slice(open + 1, css.indexOf("}", open));
}

function tokenIn(scope: string, name: string): string {
  const m = new RegExp(`${name}:\\s*([^;]+);`).exec(scope);
  expect(m, `${name} not declared in that block`).not.toBeNull();
  return m![1]!.trim();
}

// The light tokens sit in the first `:where(:root)`; the dark twins in the
// `[data-mc-theme="dark"]` scope (identical to the prefers-color-scheme copy,
// which the third test below pins).
const LIGHT = block(":where(:root)");
const DARK = block(':where([data-mc-theme="dark"])');

// A chart never paints its own background, so "the page" is the surface the ink
// composites over. These are the surfaces the catalog is designed and reviewed
// on: paper white, and the near-black the docs and the visual suite use.
const PAGE = { light: hex("#ffffff"), dark: hex("#161616") } as const;

const CATS = [1, 2, 3, 4, 5, 6] as const;

/** The fill opacity PartitionStrip paints a LABELLED segment at (row 0) — full,
 *  so the label sits on the categorical hue rather than a lightened wash. */
const LABELLED_OPACITIES = [1] as const;

describe("on-fill label ink clears AA on the fills it lands on", () => {
  // Deep semantic fills: HeatCell's upper steps, TimeInRange zones,
  // EventTimeline spans, TraceFold's critical/bar spans. `--mc-on-fill` is the
  // ink for these, and it flips between themes because the dark palette is
  // deliberately LIFTED — the same role is the lighter of the two there.
  for (const theme of ["light", "dark"] as const) {
    const scope = theme === "light" ? LIGHT : DARK;
    const ink = tokenIn(scope, "--mc-on-fill");
    for (const role of ["--mc-accent", "--mc-positive", "--mc-stroke"] as const) {
      it(`${theme}: --mc-on-fill on ${role}`, () => {
        // `--mc-stroke` is only re-declared in the dark scope for some roles;
        // fall back to the light value the same way the cascade does.
        const fill = hex(scope.includes(role) ? tokenIn(scope, role) : tokenIn(LIGHT, role));
        expect(contrast(rgbaOver(ink, fill), fill)).toBeGreaterThanOrEqual(AA);
      });
    }
  }

  // Categorical fills take a PER-CAT ink. One `--mc-on-cat` per palette could
  // not be made correct: measured across the shipped palettes, some cats need
  // the light ink and some the dark one INSIDE THE SAME SCOPE, so the single
  // token plus a hand-written cat-4 exception was always going to leave some
  // fill under the floor. `scripts/gen-on-cat-ink.mjs` generates
  // `--mc-on-cat-1..6` per scope; this asserts the generated answer is right.
  for (const theme of ["light", "dark"] as const) {
    const scope = theme === "light" ? LIGHT : DARK;
    for (const n of CATS) {
      it(`${theme}: cat-${n} takes an ink that clears AA on itself`, () => {
        const cat = hex(tokenIn(scope, `--mc-cat-${n}`));
        const ink = tokenIn(scope, `--mc-on-cat-${n}`);
        for (const fo of LABELLED_OPACITIES) {
          const bg = over(cat, fo, PAGE[theme]);
          expect(
            contrast(rgbaOver(ink, bg), bg),
            `cat-${n} at fill-opacity ${fo} in ${theme}`,
          ).toBeGreaterThanOrEqual(AA);
        }
      });
    }
  }

  it("every palette scope that declares cats also declares their inks", () => {
    // The generator writes both together; this catches a hand-edited palette
    // that added a cat and forgot to re-run it.
    for (const [, body] of [...css.matchAll(/\{([^{}]*--mc-cat-6:[^{}]*)\}/g)].map((m) => [
      0,
      m[1]!,
    ])) {
      if (!/--mc-cat-6:\s*#/.test(String(body))) continue; // color-mix palettes opt out
      for (const n of CATS)
        expect(String(body), `--mc-on-cat-${n} missing beside --mc-cat-${n}`).toMatch(
          new RegExp(`--mc-on-cat-${n}:`),
        );
    }
  });

  it("the per-cat rules key off the cat the label sits on", () => {
    for (const n of CATS) expect(css).toMatch(new RegExp(`rect\\[data-mc-cat="${n}"\\] \\+ text`));
    // …and the fallback keeps the achromatic presets working.
    expect(css).toContain("var(--mc-on-cat-1, var(--mc-on-cat))");
  });

  it("the rules reach for the tokens, not for the literals", () => {
    // The whole point of a token with a dark twin is that the RULE follows the
    // theme. These two rules used to spell `rgba(255, 255, 255, 0.96)` out, so
    // they could not.
    const strip = css.slice(css.indexOf(":where(.mc-trace, .mc-partition) :where(text)"));
    expect(strip.slice(0, 160)).toContain("var(--mc-on-fill)");
    // The categorical base rule now covers SegmentedBar too, and each cat's own
    // ink layers over it.
    expect(css).toMatch(
      /:where\(\.mc-partition, \.mc-segbar\) :where\(text\)\s*\{\s*fill:\s*var\(--mc-on-cat\)/,
    );
    // No rule outside the tokens layer may hardcode the on-fill literal.
    const charts = css.slice(css.indexOf("@layer microcharts.charts"));
    expect(charts).not.toContain("rgba(255, 255, 255, 0.96)");
  });

  it("the dim TraceFold label is legible, not invisible", () => {
    // It used to borrow `--mc-surface` (the readout chip's plane, i.e. the page
    // colour), which on a 0.62-opacity neutral span is ~1.4:1.
    const dim = tokenIn(LIGHT, "--mc-on-fill-dim");
    expect(dim).toContain("--mc-stroke");
    for (const theme of ["light", "dark"] as const) {
      const scope = theme === "light" ? LIGHT : DARK;
      const neutral = hex(tokenIn(scope, "--mc-neutral"));
      const strokeInk = hex(tokenIn(scope, "--mc-stroke"));
      const bg = over(neutral, 0.62, PAGE[theme]);
      expect(contrast(strokeInk, bg), `dim label in ${theme}`).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe("achromatic presets remap the categorical ramp", () => {
  // `mono` collapses every semantic token onto one ink and `eink`'s own comment
  // says "no chroma (the panel can't show it)". Neither remapped `--mc-cat-*`,
  // so nine categorical charts kept full jewel-tone colour inside a preset that
  // had just declared colour unavailable.
  for (const preset of ["mono", "eink"] as const) {
    it(`${preset} derives all six cats from --mc-stroke`, () => {
      const at = css.indexOf(`[data-mc-theme="${preset}"]`);
      expect(at).toBeGreaterThan(-1);
      // The shared achromatic block comes after each preset's own block.
      const shared = css.slice(css.indexOf(`[data-mc-preset="${preset}"]`, at));
      for (const n of CATS) {
        const m = new RegExp(`--mc-cat-${n}:\\s*([^;]+);`).exec(shared);
        expect(m, `${preset} does not remap --mc-cat-${n}`).not.toBeNull();
        expect(m![1], `${preset} cat-${n} is not derived from the ink`).toContain("--mc-stroke");
      }
    });
  }

  it("print keeps its chroma on purpose (it is a colour-output context)", () => {
    // Guards the DECISION, so a future sweep does not "fix" print by accident.
    const printBlock = block(':where([data-mc-theme="print"], [data-mc-preset="print"])');
    expect(printBlock).not.toContain("--mc-cat-");
  });
});

describe("forced-colors mappings", () => {
  const fc = css.slice(css.indexOf("@media (forced-colors: active)"));

  it("a hollow mark stays hollow, and that rule comes last", () => {
    // A role covers closed AND hollow marks, and a hollow one says so with a
    // literal `fill="none"`. Forcing a fill onto it turns an outline into a
    // solid, which changes MEANING: heat-strip's muted rect is its missing-data
    // cell and read as a recorded value in High Contrast Mode. One blanket rule
    // covers every role, present and future — but only if it is the LAST fill
    // declaration in the block, since these all sit at zero specificity.
    const hollow = fc.indexOf(':where(.mc-root [fill="none"])');
    expect(hollow, "the hollow-mark invariant is gone").toBeGreaterThan(-1);
    const after = fc.slice(hollow + 1);
    const strays = [...after.matchAll(/fill:\s*(?!none)([A-Za-z(][^;]*);/g)].map((m) => m[1]);
    expect(strays, "a fill mapping was added AFTER the hollow-mark rule").toEqual([]);
  });

  it("the categorical channel is mapped at all", () => {
    // `.mc-root` sets `forced-color-adjust: none`, which PRESERVES authored
    // hues rather than mapping them — so an unmapped cat ships its own colour
    // into High Contrast Mode (`--mc-cat-4` is near-invisible on black).
    expect(fc).toMatch(/\[data-mc-cat\]\)\s*\{[^}]*fill:\s*CanvasText/);
    for (const n of [2, 3, 4, 5, 6] as const) {
      expect(fc, `cat-${n} has no lightness step`).toMatch(
        new RegExp(`\\[data-mc-cat="${n}"\\]\\)\\s*\\{[^}]*fill-opacity`),
      );
    }
  });

  it("labels on those fills knock out to Canvas", () => {
    const partition = fc.slice(fc.indexOf(".mc-trace, .mc-partition"));
    expect(partition).toMatch(/fill:\s*Canvas;/);
  });
});

describe("one source of truth for the shared vocabulary", () => {
  it("MC_EASE_ENTER matches --mc-easing", () => {
    // WAAPI cannot read a custom property, so the curve is duplicated in JS.
    // The two copies had drifted (0.23/0.32 against 0.22/0.36), which eased a
    // chart's CSS transitions and its scripted entrance on different curves.
    expect(tokenIn(LIGHT, "--mc-easing")).toBe(MC_EASE_ENTER);
  });

  it("the dark twins are declared for BOTH dark signals", () => {
    // @media(prefers-color-scheme) and an explicit [data-mc-theme="dark"] scope
    // — a token added to one and not the other is a half-themed chart.
    const media = block("@media (prefers-color-scheme: dark)");
    for (const name of ["--mc-on-fill", ...CATS.map((n) => `--mc-cat-${n}`)]) {
      expect(media, `${name} missing from the media-query twin`).toContain(name);
      expect(DARK, `${name} missing from the [data-mc-theme="dark"] twin`).toContain(name);
    }
  });
});

describe("charts read the density-scaled stroke token", () => {
  it("no component hardcodes var(--mc-stroke-width)", () => {
    // `--mc-sw` is `--mc-stroke-width * --mc-density`. Thirty inline
    // declarations across twenty charts reached for the base token and so opted
    // their PRIMARY mark out of `--mc-density` while every stroke around it
    // scaled. Nothing reaches for the base token now.
    const offenders: string[] = [];
    for (const file of chartSources()) {
      if (file.text.includes("var(--mc-stroke-width)")) offenders.push(file.path);
    }
    expect(offenders).toEqual([]);
  });

  // The test above only catches the BASE TOKEN spelled out. A bare number
  // escapes further: it reaches neither `--mc-density` nor
  // `@media (prefers-contrast: more)`, which raises `--mc-stroke-width` 1.5 → 2
  // for a reader who asked the OS for heavier contrast. Every mark below stays
  // hairline for that reader while its neighbours thicken.
  //
  // The set is FROZEN rather than emptied, because clearing it changes rendered
  // stroke weights and that is a visual decision, not a test's to make. Adding a
  // new one fails here; removing one is a deliberate edit to this list.
  const RAW_STROKE_WIDTH: Record<string, number> = {
    // Interaction overlays. Not data ink, and `[data-mc-ui]` already governs
    // their paint, so the weight is chrome rather than an encoded channel.
    "src/charts/activity-grid/client.tsx": 1,
    "src/charts/calendar-strip/client.tsx": 1,
    "src/charts/cohort-triangle/client.tsx": 1,
    "src/charts/confusion-grid/client.tsx": 1,
    "src/charts/data-diff/client.tsx": 1,
    "src/charts/garden-grid/client.tsx": 1,
    "src/charts/heat-strip/client.tsx": 1,
    "src/charts/dumbbell/client.tsx": 2,
    // DATA marks — these are the ones that genuinely lose prefers-contrast.
    "src/charts/dumbbell/index.tsx": 1,
    "src/charts/thermometer/index.tsx": 1,
    // Documented byte trade: the subpath is pinned at its cap and the token
    // string costs ~20 B (see the comment at the site).
    "src/charts/percentile-ladder/index.tsx": 1,
    // Annotation hairlines. `chartSources()` does not reach `src/shared`, so
    // these three sat outside every stroke guard: the Threshold and Marker
    // rules carry a comment claiming exemption from `--mc-density`, and the
    // Callout leader carries none at all.
    "src/shared/annotations.tsx": 3,
  };

  it("the set of bare-number stroke widths does not grow", () => {
    const annotations = {
      path: "src/shared/annotations.tsx",
      text: readFileSync(resolve(root, "src/shared/annotations.tsx"), "utf8"),
    };
    const found: Record<string, number> = {};
    for (const file of [...chartSources(), annotations]) {
      if (!file.path.endsWith(".tsx")) continue;
      for (const line of stripComments(file.text).split("\n")) {
        const m = /strokeWidth\s*[:=]\s*\{?\s*"?([^,;\n}"]+)/.exec(line);
        if (!m) continue;
        if (line.includes("var(--mc-sw)")) continue; // token, or a calc on it
        const value = m[1]?.trim() ?? "";
        if (/^(geo|rg|Math|[a-z]\w*\.)/.test(value)) continue; // geometry-derived
        found[file.path] = (found[file.path] ?? 0) + 1;
      }
    }
    expect(found).toEqual(RAW_STROKE_WIDTH);
  });
});

/** Drop line and block comments so prose about a pattern never counts as it. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

describe("the interaction overlay is a channel, not a hardcode", () => {
  // ~70 client entries drew their focus/selection mark as a literal
  // `stroke="var(--mc-accent)"`. That put the entire hover state outside the
  // `--mc-*` contract: a consumer could change its COLOUR only by moving the
  // accent token, which also repaints endpoint dots and emphasis bars, and could
  // change its SHAPE only by scoping CSS onto `data-mc-*` — package internals,
  // from outside the package. `data-mc-active` + four tokens replaced it.
  //
  // Two charts are excused, both because their mark is filled rather than
  // stroked and the block below would paint over what they encode.
  const EXEMPT = new Set([
    // The active sector is a FILLED accent wedge, not an outline — it repaints
    // the arc it names. Giving it the marker would add a stroke it never had.
    "polar-clock",
  ]);

  it("no client entry paints the overlay with a literal accent", () => {
    const offenders = chartSources()
      .filter((f) => f.path.endsWith("client.tsx"))
      .filter((f) => /stroke[=:]\s*"var\(--mc-accent\)"/.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("every chart that draws an overlay is on the channel", () => {
    // `data-mc-w` is the overlay's own width role — in a client entry, nothing
    // else carries it — so it is the cheap test for "this chart draws one".
    const offenders = chartSources()
      .filter((f) => f.path.endsWith("client.tsx"))
      .filter((f) => f.text.includes("data-mc-w") && !f.text.includes("data-mc-active"))
      .map((f) => f.path)
      .filter((p) => !EXEMPT.has(p.split("/")[2]!));
    expect(offenders).toEqual([]);
    // …and the allowlist cannot go stale: an excused chart must still be one.
    for (const name of EXEMPT) {
      const client = chartSources().find((f) => f.path === `src/charts/${name}/client.tsx`);
      expect(client, `${name} is excused but no longer exists`).toBeDefined();
      expect(client!.text, `${name} joined the channel — drop the exemption`).not.toContain(
        "data-mc-active",
      );
    }
  });

  it("every client entry is on the channel, on the scalar hook, or excused by name", () => {
    // The overlay test above triggers on `data-mc-w`, so a chart that draws no
    // overlay at all used to escape every active-state gate by never matching
    // it. This closes the partition: an interactive entry either carries a
    // `data-mc-active` overlay, activates whole-chart through `useScalarActive`
    // (one unit — there is no per-unit mark for a ring to name), or is excused
    // here with the reason a reviewer signed off on.
    const EXCUSED = new Set([
      "polar-clock", // filled accent wedge repaints the arc (see EXEMPT above)
      "minimap-strip", // role="slider" window picker — its own interaction shape
      "token-confidence", // inline HTML tokens; underline tiers, not overlays
    ]);
    const offenders = chartSources()
      .filter((f) => f.path.endsWith("client.tsx"))
      .filter((f) => !f.text.includes("data-mc-active") && !f.text.includes("useScalarActive"))
      .map((f) => f.path.split("/")[2]!)
      .filter((slug) => !EXCUSED.has(slug));
    expect(offenders).toEqual([]);
    for (const name of EXCUSED) {
      const client = chartSources().find((f) => f.path === `src/charts/${name}/client.tsx`);
      expect(client, `${name} is excused but no longer exists`).toBeDefined();
    }
  });

  it("styles.css resolves all four tokens with their documented defaults", () => {
    const charts = css.slice(css.indexOf("@layer microcharts.charts"));
    expect(charts).toContain("stroke: var(--mc-active-stroke, var(--mc-accent))");
    expect(charts).toContain("fill: var(--mc-active-fill, var(--mc-on-fill))");
    expect(charts).toContain("fill-opacity: var(--mc-active-fill-opacity, 0.2)");
    expect(charts).toContain("opacity: var(--mc-rest-opacity, 1)");
    // The wash is what makes the ring visible on an accent-inked mark, and it
    // may only reach CLOSED primitives — filling an open strand (EnsembleGhosts'
    // member, MicroDonut's arc) paints a wedge, the same split the ink roles make.
    expect(charts).toMatch(/:is\(rect, circle, ellipse, polygon\)\[data-mc-active\]/);
  });

  it("forced-colors collapses the treatment back to a system outline", () => {
    // A host's themed ink was chosen against ITS palette, not the user's forced
    // one, and an opacity dim has nothing to say in a two-ink mode. Both have to
    // be overridden here or High Contrast Mode ships the host's brand hex.
    const fc = css.slice(css.indexOf("@media (forced-colors: active)"));
    expect(fc).toMatch(/\[data-mc-active\]\)\s*\{\s*stroke:\s*Highlight/);
    expect(fc).toMatch(/--mc-rest-opacity:\s*1/);
    // The wash needs no rule of its own: every overlay keeps a literal
    // `fill="none"`, which the blanket hollow-mark rule restores.
    const hollow = fc.indexOf(':where(.mc-root [fill="none"])');
    expect(hollow).toBeGreaterThan(-1);
  });

  it("every marked overlay still declares itself hollow", () => {
    // …which is what the rule above relies on. A marked mark that dropped
    // `fill="none"` would keep the host's wash in High Contrast Mode.
    const offenders: string[] = [];
    for (const { path, text } of chartSources()) {
      if (!path.endsWith("client.tsx")) continue;
      for (const el of jsxElements(text, /<(rect|circle|ellipse|polygon)\b/g)) {
        if (!el.source.includes("data-mc-active")) continue;
        if (!el.source.includes('fill="none"')) offenders.push(`${path}:${el.line} <${el.tag}>`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("animated marks stay inside the viewBox", () => {
  it("the StatusDot halo's end scale keeps it in the box", () => {
    // Containment is a hard rule and a TRANSFORM does not escape it: `.mc-root`
    // is `overflow: visible`, so a mark that scales past the viewBox paints into
    // the page for as long as the animation runs. The halo is r = 3 centred in an
    // 8-unit box, so its end scale may not exceed 8 / 2 / 3.
    const halo = css.slice(css.indexOf("@keyframes mc-status-pulse"));
    const m = /transform:\s*scale\(([\d.]+)\)/g;
    const scales = [...halo.slice(0, 400).matchAll(m)].map((x) => Number(x[1]));
    expect(scales.length, "the pulse keyframe no longer scales").toBeGreaterThan(0);
    const HALO_R = 3;
    const BOX = 8;
    expect(Math.max(...scales)).toBeLessThanOrEqual(BOX / 2 / HALO_R);
  });
});

describe("primary stroked marks are scale-invariant", () => {
  // The responsiveness model is `viewBox` + `preserveAspectRatio` +
  // `vector-effect: non-scaling-stroke`, and there is no `ResizeObserver`. Every
  // interactive entry spreads `FILL` (`width: 100%`), so an unpinned stroke
  // THICKENS with its host and the same chart reads at two weights in a table
  // cell and in a figure.
  //
  // This used to require the ATTRIBUTE on every `data-mc-ink="data"` mark, which
  // asked 106 charts to remember it — 39 missed at least one, and 14 pinned some
  // marks and not others, so a single chart held a hairline on its line while its
  // own baseline thickened. The pin now lives in `styles.css`, keyed on where the
  // stroke-width comes from, so these assert the RULE rather than 222 copies of
  // an attribute.
  it("styles.css pins every token-width ink role", () => {
    const rule = css.slice(css.indexOf("Ink holds its weight at any render scale"));
    const decl = rule.slice(
      0,
      rule.indexOf("}", rule.indexOf("vector-effect: non-scaling-stroke")),
    );
    for (const sel of [
      "[data-mc-w]",
      '[data-mc-ink="data"]',
      '[data-mc-ink="muted"]',
      '[data-mc-ink="unit-off"]',
      '[data-mc-ink="gap"]',
      '[data-mc-ink="accent"]',
      '[data-mc-ink="positive"]',
      '[data-mc-ink="negative"]',
      '[data-mc-ink="ghost"]',
      '[data-mc-ink="flag"]',
    ]) {
      expect(decl, `the pin rule no longer covers ${sel}`).toContain(sel);
    }
    expect(decl).toContain("vector-effect: non-scaling-stroke");
  });

  it("exactly three marks are exempt, because their stroke-width IS the encoding", () => {
    // Widening this list means a mark grows with its box on purpose. That is a
    // design decision (the donut's band, the ring halo's span), not a default.
    const at = css.indexOf("vector-effect: none");
    expect(at, "the geometry-width exemption rule is gone").toBeGreaterThan(-1);
    const sel = css.slice(css.lastIndexOf(":where(", at), at);
    expect(sel).toContain("mc-donut-wedge");
    expect(sel).toContain("mc-ring-halo");
    expect(sel).toContain('.mc-ring path[data-mc-ink="accent"]');
    expect(css.split("vector-effect: none").length - 1).toBe(1);
  });

  it("no chart re-spells the attribute on a mark the rule already covers", () => {
    // Drift guard, and a byte guard: every subpath is measured standalone, so a
    // re-spelled attribute is paid for once per chart that spells it.
    const COVERED = ["data", "muted", "unit-off", "gap"];
    const OPEN_ONLY = ["accent", "positive", "negative", "ghost", "flag"];
    const offenders: string[] = [];
    for (const { path, text } of chartSources()) {
      if (!path.endsWith(".tsx")) continue;
      for (const el of jsxElements(text, /<(path|line|polyline|polygon|circle|rect|ellipse)\b/g)) {
        if (!el.source.includes('vectorEffect="non-scaling-stroke"')) continue;
        if (/data-mc-ink=\{/.test(el.source)) continue; // role decided at runtime
        const ink = /data-mc-ink="([a-z-]+)"/.exec(el.source)?.[1];
        const open = ["path", "line", "polyline"].includes(el.tag);
        const covered =
          /data-mc-w[=\s]/.test(el.source) ||
          (ink !== undefined && COVERED.includes(ink)) ||
          (ink !== undefined && OPEN_ONLY.includes(ink) && open);
        if (covered) offenders.push(`${path}:${el.line} <${el.tag}>`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

// --------------------------------------------------------------------- helpers

/** Opening JSX tags matching `pattern`, sliced to their closing `>`. Brace-aware
 *  so an expression container holding a `>` does not end the tag early. */
function jsxElements(
  text: string,
  pattern: RegExp,
): { tag: string; line: number; source: string }[] {
  const out: { tag: string; line: number; source: string }[] = [];
  for (const m of text.matchAll(pattern)) {
    let i = m.index + m[0].length;
    let depth = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (depth === 0 && c === ">") break;
      i++;
    }
    out.push({
      tag: m[1]!,
      line: text.slice(0, m.index).split("\n").length,
      source: text.slice(m.index, i + 1),
    });
  }
  return out;
}

function chartSources(): { path: string; text: string }[] {
  const { readdirSync } = require("node:fs") as typeof import("node:fs");
  const dir = resolve(root, "src/charts");
  const out: { path: string; text: string }[] = [];
  for (const name of readdirSync(dir)) {
    for (const entry of ["index.tsx", "client.tsx", "geometry.ts"]) {
      const path = resolve(dir, name, entry);
      try {
        out.push({ path: `src/charts/${name}/${entry}`, text: readFileSync(path, "utf8") });
      } catch {
        /* not every chart ships every entry */
      }
    }
  }
  expect(out.length).toBeGreaterThan(200);
  return out;
}

// The on-fill suite above pairs each theme's ink with the SAME theme's fills, so
// it can only catch a mistuned twin. The failure that actually shipped was a
// cross-theme pairing: `@media (prefers-color-scheme: dark)` set `--mc-on-fill`
// off the OS, while a host pinning light overrode the palette — light fills,
// dark ink, 3.0–3.8:1 on the docs site with every other token correct. The
// mechanism was that dark was expressible and light was not.
describe("a host can pin light, not just dark", () => {
  const EXPLICIT_LIGHT = block(':where([data-mc-theme="light"])');

  it("an explicit-light scope exists to beat the dark media query", () => {
    expect(EXPLICIT_LIGHT.trim().length).toBeGreaterThan(0);
  });

  // Every token the dark branch overrides must be restated here, or pinning
  // light leaves that one token on the dark value — which is precisely the
  // shape of the --mc-on-fill bug.
  const overridden = [...DARK.matchAll(/(--mc-[a-z0-9-]+):/g)].map((m) => m[1]!);
  for (const name of overridden) {
    it(`explicit light restates ${name}`, () => {
      expect(tokenIn(EXPLICIT_LIGHT, name)).toBe(tokenIn(LIGHT, name));
    });
  }

  it("the pathological pairing is unreachable: light fills never meet the dark ink", () => {
    const darkInk = tokenIn(DARK, "--mc-on-fill");
    const lightInk = tokenIn(EXPLICIT_LIGHT, "--mc-on-fill");
    expect(lightInk).not.toBe(darkInk);
    // And the ink a pinned-light host now gets clears AA on its own fills.
    for (const role of ["--mc-accent", "--mc-positive", "--mc-stroke"] as const) {
      const fill = hex(tokenIn(EXPLICIT_LIGHT, role));
      expect(contrast(rgbaOver(lightInk, fill), fill)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
