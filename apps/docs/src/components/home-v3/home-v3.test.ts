import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARTS } from "@/lib/charts/registry";
import { SHOWCASE } from "@/lib/showcase";
import { PRESETS } from "@/lib/mc-tokens";
import { CHART_GZIP } from "@/lib/stats";
import { SHARES, CHECKOUT_P95, DEGRADE, FENCE_SERIES } from "./v3-data";

/**
 * The v3 homepage's load-bearing claims, held by source rather than by review.
 *
 * Every one of these was a real defect at some point in this page's history —
 * a comparison plotting two different datasets, a "seven apps use all 106"
 * headline that didn't add up, a preset wall that had drifted from the presets
 * the library ships. They are cheap to assert and expensive to notice.
 */

const dir = resolve(process.cwd(), "src/components/home-v3");
const routeDir = resolve(process.cwd(), "src/app/home-v3");

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
    const src = readFileSync(join(dir, "four-places.tsx"), "utf8");
    // Four Sparklines, and each one reads CHECKOUT_P95 (the /search row is the
    // second table row, deliberately a different route).
    const sparks = src.match(/<Sparkline\b/g) ?? [];
    expect(sparks.length).toBeGreaterThanOrEqual(4);
    expect(src).not.toMatch(/data=\{\[\s*\d/); // no inline literal series
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

describe("nothing on the page animates itself", () => {
  it("declares no keyframes and no hidden resting state", () => {
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
    // The page ships static. Every entrance this route tried — scroll reveals, a
    // staggered hero, the library's own draw — could only hide something the
    // server had already painted, so the reload read as a flicker.
    expect(rules).not.toMatch(/@keyframes/);
    expect(rules).not.toMatch(/opacity:\s*0\s*[;}]/);
    // `animation: none` in the reduced-motion block is the opposite of a problem.
    // Whitespace is normalised first: with `\s*` able to match nothing, a negative
    // lookahead lands on the space and passes, which made this assertion vacuous.
    expect(rules.replace(/animation:\s+/g, "animation:")).not.toMatch(/animation:(?!none)/);
  });

  it("carries no reveal attributes, gate, or motion engine anywhere", () => {
    expect(readdirSync(dir)).not.toContain("use-v3-reveal.ts");
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
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    // A transition is a response to the reader. Anything longer than a third of a
    // second stops reading as feedback and starts reading as choreography.
    for (const m of css.matchAll(/transition:[^;]*?([\d.]+)s/g)) {
      expect(Number(m[1]), m[0].trim()).toBeLessThanOrEqual(0.3);
    }
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
    for (const f of ["hero-sentence.tsx", "four-places.tsx", "paper-inversion.tsx"]) {
      const src = readFileSync(join(dir, f), "utf8");
      const marks = (src.match(/<(?:Sparkline|SparkBar|MicroBox|HeatStrip|RugStrip)\b/g) ?? [])
        .length;
      expect(marks, f).toBeGreaterThan(0);
      expect(src, f).toContain('className="mc-inline"');
    }
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
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    expect(css).toMatch(/\.v3 \.fan-lab \{[^}]*left: calc\(var\(--fan-step\)/s);
    expect(css).toMatch(/\.v3 \.fan-drop \{[^}]*left: calc\(var\(--fan-step\)/s);
    // The stem's default must be server-renderable, or a JS-less reader sees no tree.
    expect(css).toMatch(/left: var\(--fan-x, 50%\)/);
  });
});

describe("interactivity is spent where a reader can act on it", () => {
  /** Sections that import an `/interactive` entry, and the reason each earns it. */
  const EARNS_IT = new Set([
    // The fold's living mark: hovering it IS the product's thesis.
    "hero-sentence.tsx",
    // One `domain` toggle re-scaling five encodings — the readouts are how you
    // check that each one stayed correct.
    "grammar-rows.tsx",
  ]);

  it("imports the interactive entry in exactly the sections that use it", () => {
    const found = new Set<string>();
    for (const [file, src] of sources()) {
      if (/@microcharts\/react\/[\w-]+\/interactive/.test(stripComments(src))) found.add(file);
    }
    // A hover readout that repeats a figure already printed beside the mark — the
    // table row, the KPI card, the fence's own JSON — is a client bundle bought for
    // nothing. And a printed report has no pointer at all.
    expect([...found].sort()).toEqual([...EARNS_IT].sort());
  });

  it("keeps the placement section and the fence on the server", () => {
    for (const f of ["four-places.tsx", "fence-beat.tsx", "paper-inversion.tsx"]) {
      const src = stripComments(readFileSync(join(dir, f), "utf8"));
      expect(src, f).not.toContain('"use client"');
    }
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
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    const cell = /\.v3 \.cell \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
    expect(cell).toContain("justify-items: center");
    expect(cell).toContain("text-align: center");
    expect(css).toMatch(/\.v3 \.cell-mark \{[^}]*justify-content: center/s);
  });
});

describe("the masthead is the site's, not a second one", () => {
  it("renders SiteNav and defines no bespoke rail", () => {
    const shell = readFileSync(join(dir, "v3-shell.tsx"), "utf8");
    expect(shell).toContain("<SiteNav />");
    expect(readdirSync(dir)).not.toContain("v3-masthead.tsx");
    // A `<header>` of its own would be a second rail competing with the real one.
    for (const [file, src] of sources()) {
      expect(stripComments(src), file).not.toMatch(/<header[\s>]/);
    }
  });

  it("shares one measure with the nav, so the first line starts under the wordmark", () => {
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    // `.shell` is the nav's own container: --container-shell + the nav's gutters.
    expect(css).toMatch(/\.v3 \.shell \{[^}]*max-width: var\(--container-shell\)/s);
    expect(css).toMatch(/\.v3 \.shell \{[^}]*padding-inline: 1rem/s);
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
  it("keeps both rule weights faint and the lattice fainter still", () => {
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    for (const m of css.matchAll(/--rule-2: color-mix\(in oklab, #[0-9a-f]{6} (\d+)%/g)) {
      expect(Number(m[1]), "the emphasis rule is structure, not a mark").toBeLessThanOrEqual(20);
    }
    // ~220 edges at once, so the lattice halves the hairline again.
    expect(css).toMatch(/--rule-cell: color-mix\(in oklab, var\(--hairline\) 50%/);
  });

  it("gives the install and copy controls one resting edge", () => {
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    const ctrl = /\.v3 \.ctrl \{([\s\S]*?)\}/.exec(css)?.[1] ?? "";
    expect(ctrl).toContain("border: 1px solid var(--rule)");
    // Hover must not jump two steps of edge weight — that reads as a resize.
    const hover = /\.v3 \.ctrl:hover \{([\s\S]*?)\}/.exec(css)?.[1] ?? "";
    expect(hover).toContain("var(--rule-2)");
    expect(hover).not.toContain("var(--ink-3)");
  });

  it("locks the specimen readout's height and draws no rule above it", () => {
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    expect(css).toMatch(/\.v3 \.readout \{[^}]*height: \d+px/s);
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
    const libDir = resolve(process.cwd(), "src");
    const owners = walk(libDir)
      .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
      .filter((f) => /hv-tok-tag/.test(readFileSync(f, "utf8")));
    expect(owners.map((f) => f.replace(`${libDir}/`, ""))).toEqual(["lib/jsx-lex.ts"]);
  });

  it("puts the v3 code surfaces on that lexer and on one code style", () => {
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
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    expect(css).not.toMatch(/\.ctrl-accent/);
    expect(css).toMatch(/\.v3 \.door\[data-primary\]/);
  });
});

describe("the display face keeps its floor", () => {
  it("never sets the display family below 40px and never on a numeral", () => {
    const css = readFileSync(join(routeDir, "v3.css"), "utf8");
    // Each rule that uses var(--fd) declares a clamp whose LOWER bound is the
    // smallest size it can render. `.d2` may go under 40 on a phone, where a
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
    // No figure is ever set in it: every number in running text is `.fig`,
    // which is the mono family.
    expect(css).toMatch(/\.v3 \.fig \{[^}]*var\(--fm\)/s);
  });
});
