import { PRESETS } from "@/lib/mc-tokens";
import {
  ACCENTS,
  CAT_VARS,
  INK_PRESET_CATS,
  PRESET_DARK_TWINS,
  deriveCatPalette,
  resolveTokens,
} from "@/lib/token-export";

/**
 * Two things the site's own preset CSS cannot express, emitted from the same
 * token source it reads.
 *
 * **1. Element-scoped presets** (`[data-v3-preset]`). The site keys presets off
 * `:root[data-mc-preset]`, because the picker themes the whole document — which
 * is right, and useless for a wall of plates that each has to hold a different
 * preset at the same time. A declaration on the element beats an inherited one
 * from `:root` whatever the specificity, so a plate stays pinned to its own
 * preset while the reader drives the masthead switch through all six.
 *
 * **2. The inverted sheet** (`[data-v3-invert]`). A chart on the opposite stock
 * needs the ink the OTHER mode would give it — but it still has to follow the
 * active preset, or flipping to eink leaves an ember endpoint on a grayscale
 * page and the "one pass re-themes every mark" claim stops being true. So the
 * inversion is emitted per preset from `resolveTokens`, whose light/dark maps are
 * exactly what the library ships, and `--mc-accent` gets its own per-accent rule
 * on top (with the ink presets' pinned accent protected by a specificity bump,
 * the same trick global.css uses for their categorical ramps).
 *
 * Nothing here is a copied colour. `home-v3.test.ts` fails on a hex literal in
 * this file, because a hand-written value is how a wall like this goes stale.
 */

/** Tokens whose meaning depends on which stock the mark is drawn on. */
const SURFACE_INK = [
  "--mc-stroke",
  "--mc-positive",
  "--mc-negative",
  "--mc-neutral",
  "--mc-moon",
  "--mc-band",
] as const;

/**
 * Valence and reference ink, deepened toward the sheet's own text ink.
 *
 * The library's per-mode values are tuned for the library's own field. This page
 * inverts onto a *lighter* light sheet and a *deeper* dark one, where the mid-tone
 * inks — neutral especially — fall under the 3:1 bar for a graphical object. The
 * site's own stylesheet solves the same problem the same way (its light valence
 * is deepened past the library default so it clears contrast over composited
 * glass); this is that adjustment expressed as one rule instead of six literals.
 * 30% measured across all six presets × both sheets: minimum 3.4:1.
 */
const DEEPEN = new Set(["--mc-positive", "--mc-negative", "--mc-neutral", "--mc-accent"]);
const deepen = (cssVar: string, value: string) =>
  DEEPEN.has(cssVar) ? `color-mix(in srgb, ${value} 70%, var(--paper-ink))` : value;

const decls = (pairs: Iterable<readonly [string, string]>) =>
  [...pairs].map(([k, v]) => `${k}:${v}`).join(";");

type Resolved = ReturnType<typeof resolveTokens>["light"];
const accentOf = (side: Resolved) =>
  side.find((e) => e.cssVar === "--mc-accent")?.value ?? "currentColor";

export function PresetScopeStyle() {
  const blocks: string[] = [];

  // ── 1. presets, scoped to an element ──────────────────────────────────────
  for (const preset of PRESETS) {
    if (preset.id === "modern") continue; // the default carries no deltas
    const sel = `[data-v3-preset="${preset.id}"]`;

    const light = preset.changes.map((c) => [c.cssVar, c.value] as const);
    const cats = deriveCatPalette(preset.id, null);
    const inkPreset = preset.id in INK_PRESET_CATS;
    blocks.push(
      `${sel}{${decls([...light, ...(inkPreset && cats ? Object.entries(cats.light) : [])])}}`,
    );

    // Dark: the preset deltas above still hold; only the pinned colours re-tune,
    // exactly as the library's dark-preset bundles do.
    const dark: (readonly [string, string])[] = Object.entries(PRESET_DARK_TWINS[preset.id] ?? {});
    if (inkPreset && cats) dark.push(...Object.entries(cats.dark));
    if (dark.length) blocks.push(`.dark ${sel}{${decls(dark)}}`);
  }

  // ── 2. the inverted sheet, per preset ─────────────────────────────────────
  for (const preset of PRESETS) {
    const { light, dark } = resolveTokens({ preset: preset.id, accent: null, include: "color" });
    const pick = (side: typeof light, keys: readonly string[]) =>
      side
        .filter((e) => keys.includes(e.cssVar))
        .map((e) => [e.cssVar, deepen(e.cssVar, e.value)] as const);

    // A light page inverts to a dark sheet, so the sheet takes the DARK ink —
    // and vice versa. Categoricals invert with it (they are lightness-ordered).
    const onDarkSheet = [...pick(dark, SURFACE_INK), ...pick(dark, CAT_VARS)];
    const onLightSheet = [...pick(light, SURFACE_INK), ...pick(light, CAT_VARS)];

    // `modern` is the no-attribute default, so it needs the unscoped selector.
    const at = preset.id === "modern" ? "" : `[data-mc-preset="${preset.id}"]`;
    const root = at ? `:root${at}` : ":root";
    blocks.push(`${root} .v3 [data-v3-invert]{${decls(onDarkSheet)}}`);
    blocks.push(`${root}.dark .v3 [data-v3-invert]{${decls(onLightSheet)}}`);
  }

  // ── 3. the accent on an inverted sheet, per accent ─────────────────────────
  // Doubled `[data-accent]` so these beat the equal-specificity preset rules
  // above regardless of source order — and so the ink presets, which own their
  // accent outright, can still win with a doubled preset attribute below.
  const accentDecl = (value: string) => `--mc-accent:${deepen("--mc-accent", value)}`;
  for (const accent of ACCENTS) {
    const sel = `[data-accent="${accent.id}"][data-accent="${accent.id}"]`;
    blocks.push(`:root${sel} .v3 [data-v3-invert]{${accentDecl(accent.dark)}}`);
    blocks.push(`:root${sel}.dark .v3 [data-v3-invert]{${accentDecl(accent.light)}}`);
  }
  // Ember is the site default and carries no [data-accent] attribute.
  const ember = ACCENTS[0]!;
  blocks.push(`:root:not([data-accent]) .v3 [data-v3-invert]{${accentDecl(ember.dark)}}`);
  blocks.push(`:root:not([data-accent]).dark .v3 [data-v3-invert]{${accentDecl(ember.light)}}`);

  // A preset that names its own `--mc-accent` owns it, whatever the accent picker
  // says — mono/print/eink own their whole ink set, and editorial's claret
  // endpoint is that preset's identity (global.css makes the same call). Three
  // attribute selectors, to clear the doubled accent rules above.
  const ownsAccent = PRESETS.filter((p) => p.changes.some((c) => c.cssVar === "--mc-accent")).map(
    (p) => p.id,
  );
  for (const id of ownsAccent) {
    const { light, dark } = resolveTokens({ preset: id, accent: null, include: "color" });
    const sel = `[data-mc-preset="${id}"][data-mc-preset="${id}"][data-mc-preset="${id}"]`;
    blocks.push(`:root${sel} .v3 [data-v3-invert]{${accentDecl(accentOf(dark))}}`);
    blocks.push(`:root${sel}.dark .v3 [data-v3-invert]{${accentDecl(accentOf(light))}}`);
  }

  return <style>{blocks.join("")}</style>;
}
