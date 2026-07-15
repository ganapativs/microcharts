// @microcharts/react/theme — a token builder for the `--mc-*` contract.
//
//   const brand = defineTheme({ accent: "#6d28d9" });
//   <MicroProvider style={brand.style}>…</MicroProvider>   // one instance
//   brand.css(":root")                                     // or a global sheet
//
// Give it a single brand accent and it derives a harmonized, CVD-safe
// categorical palette and hand-tuned-looking dark twins in OKLCH — all
// overridable, and it never moves the positive/negative hues off the
// colorblind-safe green/vermillion split. Zero dependencies; pure functions.

// The shipped default accent (= SEMANTIC.accent in core/color.ts). Inlined so
// this opt-in module pulls in nothing else; theme.test.ts guards the match.
const DEFAULT_ACCENT = "#1f6091";

/** Built-in bundle to start from before applying overrides. */
export type ThemePreset = "modern" | "editorial" | "mono" | "vivid" | "print" | "eink";

/** Dark-mode strategy: derive twins (`"auto"`), override some, or omit (`false`). */
export type DarkSpec = Partial<ThemeSpec> | "auto" | false;

/** The intent you describe; every field is optional and maps to one `--mc-*`. */
export interface ThemeSpec {
  /** Start from a preset bundle, then override. Folded into `vars` — no attribute needed. */
  extends?: ThemePreset;
  /** Brand emphasis colour. Seeds the derived palette + dark twins. */
  accent?: string;
  /** Primary data ink. */
  stroke?: string;
  /** Good-direction valence (kept on a CVD-safe bluish-green unless you set it). */
  positive?: string;
  /** Bad-direction valence (kept on a CVD-safe vermillion unless you set it). */
  negative?: string;
  /** No-valence marks and baselines. */
  neutral?: string;
  /** Normal-range / area shading. */
  band?: string;
  /** MoonPhase lit area. */
  moon?: string;
  /**
   * Categorical series palette. An array is used verbatim; a number derives that
   * many harmonized tones from `accent`. Omitted with an `accent` present (and
   * `derive` not `false`) derives six.
   */
  cat?: readonly string[] | number;
  /** Base font shorthand for chart text. */
  font?: string;
  /** Face for tabular figures + labels (defaults to `font`). */
  fontNumeric?: string;
  /** Label size (a CSS length, e.g. `"0.8em"`). */
  labelSize?: string;
  /** Label weight. */
  labelWeight?: number | string;
  /** Base data stroke weight (maps to `--mc-stroke-width`). */
  strokeWidth?: number | string;
  /** Uniform density scalar — compact (`< 1`) vs comfortable (`> 1`). */
  density?: number;
  /** Small-multiple gap (a CSS length). */
  gap?: string;
  /** Motion duration (a CSS time). */
  duration?: string;
  /** Motion easing. */
  easing?: string;
  /** Readout-chip surface, ink, and edge. */
  surface?: string;
  surfaceInk?: string;
  surfaceEdge?: string;
  /** Turn accent-seeded derivation on/off (defaults on when `accent` is set). */
  derive?: boolean;
  /** Dark-mode overrides. Defaults to `"auto"` — derived twins of every hex token. */
  dark?: DarkSpec;
}

type Vars = Record<string, string>;

/** The compiled theme: token maps plus ways to apply them. */
export interface Theme {
  /** Light-mode `--mc-*` properties. */
  readonly vars: Readonly<Vars>;
  /** Dark-mode `--mc-*` properties (empty when `dark` is `false`). */
  readonly darkVars: Readonly<Vars>;
  /** Alias of `vars`, ready for `style={theme.style}` or `<MicroProvider style>`. */
  readonly style: Readonly<Vars>;
  /** Serialize to CSS: `selector { … }` plus a `prefers-color-scheme: dark` twin. */
  css(selector?: string): string;
  /** Derive a new theme from this one with further overrides. */
  extend(spec: ThemeSpec): Theme;
  /** Same as `css(":root")`. */
  toString(): string;
}

// ── Preset bundles (mirror styles.css; kept honest by theme.test.ts) ──────────
const PRESETS: Record<ThemePreset, Vars> = {
  modern: {},
  editorial: { "--mc-accent": "#a32236", "--mc-stroke-width": "1" },
  mono: {
    "--mc-positive": "var(--mc-stroke)",
    "--mc-negative": "var(--mc-stroke)",
    "--mc-accent": "var(--mc-stroke)",
    "--mc-neutral": "var(--mc-stroke)",
    "--mc-moon": "var(--mc-stroke)",
  },
  vivid: { "--mc-positive": "#0f9e78", "--mc-negative": "#e24d2e", "--mc-stroke-width": "2" },
  print: {
    "--mc-stroke": "#1a1a1a",
    "--mc-neutral": "#666666",
    "--mc-positive": "#0c6249",
    "--mc-negative": "#a33f22",
    "--mc-accent": "#14507a",
    "--mc-moon": "#7a5a12",
    "--mc-band": "color-mix(in oklab, #1a1a1a 9%, transparent)",
    "--mc-stroke-width": "1.25",
  },
  eink: {
    "--mc-stroke": "#000000",
    "--mc-positive": "#000000",
    "--mc-negative": "#595959",
    "--mc-neutral": "#8c8c8c",
    "--mc-accent": "#000000",
    "--mc-moon": "#000000",
    "--mc-band": "color-mix(in oklab, #000000 14%, transparent)",
    "--mc-stroke-width": "2",
  },
};

// ── sRGB ↔ OKLab (Björn Ottosson) ────────────────────────────────────────────
function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function toGamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1]!.length === 3 ? m[1]!.replace(/./g, (d) => d + d) : m[1]!;
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function toHex(r: number, g: number, b: number): string {
  const ch = (x: number) =>
    Math.round(Math.min(1, Math.max(0, x)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklabToRgb(okl: number, oka: number, okb: number): [number, number, number] {
  const l = (okl + 0.3963377774 * oka + 0.2158037573 * okb) ** 3;
  const m = (okl - 0.1055613458 * oka - 0.0638541728 * okb) ** 3;
  const s = (okl - 0.0894841775 * oka - 1.291485548 * okb) ** 3;
  return [
    toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

interface Oklch {
  L: number;
  C: number;
  H: number;
}
function hexToOklch(hex: string): Oklch | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [L, a, b] = rgbToOklab(rgb[0], rgb[1], rgb[2]);
  return { L, C: Math.hypot(a, b), H: (Math.atan2(b, a) * 180) / Math.PI };
}
/** OKLCH → hex, reducing chroma toward gray until the colour is inside sRGB. */
function oklchToHex({ L, C, H }: Oklch): string {
  const h = (H * Math.PI) / 180;
  const cos = Math.cos(h);
  const sin = Math.sin(h);
  const fits = (c: number): boolean =>
    oklabToRgb(L, c * cos, c * sin).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  let c = C;
  if (!fits(c)) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  const [r, g, b] = oklabToRgb(L, c * cos, c * sin);
  return toHex(r, g, b);
}

const isHex = (v: string): boolean => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());

/**
 * Dark twin of a light-mode colour: near-black ink lifts to a warm off-white;
 * mid-tones brighten for a dark surface while holding hue and chroma. Mirrors
 * the shape of the hand-tuned dark tokens; override any twin via `dark`.
 */
function darkTwin(hex: string): string {
  const c = hexToOklch(hex);
  if (!c) return hex;
  if (c.L < 0.35) return oklchToHex({ L: 0.94 - c.L * 0.12, C: Math.min(c.C, 0.015), H: c.H });
  return oklchToHex({ L: Math.min(0.82, c.L + 0.18), C: c.C * 0.94, H: c.H });
}

/**
 * Harmonized categorical palette seeded from `accent`: `n` hues rotated around
 * the wheel at a matte lightness/chroma, so series stay distinct but share the
 * house finish. Lightness alternates a touch for grayscale/CVD separation.
 */
function deriveCats(accent: string, n: number, dark: boolean): string[] {
  const seed = hexToOklch(accent) ?? { L: 0.5, C: 0.11, H: 250 };
  const L = dark ? 0.72 : 0.58;
  const C = 0.108;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const H = (((seed.H + i * (360 / Math.max(n, 1))) % 360) + 360) % 360;
    out.push(oklchToHex({ L: L + (i % 2 ? -0.05 : 0.05), C, H }));
  }
  return out;
}

const num = (v: number | string): string => (typeof v === "number" ? String(v) : v);

/** Map a spec's colour/typography fields onto their `--mc-*` names (no derivation). */
function directVars(spec: ThemeSpec): Vars {
  const v: Vars = {};
  const set = (name: string, value: string | number | undefined) => {
    if (value !== undefined) v[name] = num(value);
  };
  set("--mc-stroke", spec.stroke);
  set("--mc-positive", spec.positive);
  set("--mc-negative", spec.negative);
  set("--mc-neutral", spec.neutral);
  set("--mc-accent", spec.accent);
  set("--mc-band", spec.band);
  set("--mc-moon", spec.moon);
  set("--mc-font", spec.font);
  set("--mc-font-numeric", spec.fontNumeric);
  set("--mc-label-size", spec.labelSize);
  set("--mc-label-weight", spec.labelWeight);
  set("--mc-stroke-width", spec.strokeWidth);
  set("--mc-density", spec.density);
  set("--mc-gap", spec.gap);
  set("--mc-duration", spec.duration);
  set("--mc-easing", spec.easing);
  set("--mc-surface", spec.surface);
  set("--mc-surface-ink", spec.surfaceInk);
  set("--mc-surface-edge", spec.surfaceEdge);
  return v;
}

function serialize(selector: string, vars: Vars): string {
  const body = Object.entries(vars)
    .map(([k, val]) => `  ${k}: ${val};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

function build(spec: ThemeSpec): Theme {
  const derive = spec.derive ?? spec.accent !== undefined;
  const seedAccent = spec.accent ?? DEFAULT_ACCENT;
  const catCount = typeof spec.cat === "number" ? spec.cat : 6;
  const deriveCatsWanted =
    !Array.isArray(spec.cat) &&
    (typeof spec.cat === "number" || (spec.accent !== undefined && derive));

  // Light vars: preset base < derived cats < explicit fields (later wins).
  const vars: Vars = { ...PRESETS[spec.extends ?? "modern"] };

  if (Array.isArray(spec.cat)) {
    spec.cat.forEach((c, i) => (vars[`--mc-cat-${i + 1}`] = c));
  } else if (deriveCatsWanted) {
    deriveCats(seedAccent, catCount, false).forEach((c, i) => (vars[`--mc-cat-${i + 1}`] = c));
  }
  Object.assign(vars, directVars(spec));

  // Dark vars: auto-twin every hex colour, then apply explicit dark overrides.
  const darkVars: Vars = {};
  if (spec.dark !== false) {
    for (const [k, val] of Object.entries(vars)) {
      if (isHex(val)) darkVars[k] = darkTwin(val);
    }
    if (deriveCatsWanted) {
      deriveCats(seedAccent, catCount, true).forEach((c, i) => (darkVars[`--mc-cat-${i + 1}`] = c));
    }
    if (spec.dark && spec.dark !== "auto") Object.assign(darkVars, directVars(spec.dark));
  }

  const frozen = Object.freeze({ ...vars });
  const frozenDark = Object.freeze({ ...darkVars });

  const css = (selector = ":root"): string => {
    let out = serialize(selector, frozen);
    if (Object.keys(frozenDark).length) {
      out += `\n@media (prefers-color-scheme: dark) {\n${serialize(selector, frozenDark).replace(/^/gm, "  ")}\n}`;
    }
    return out;
  };

  return {
    vars: frozen,
    darkVars: frozenDark,
    style: frozen,
    css,
    toString: () => css(),
    extend: (over) => build(mergeSpecs(spec, over)),
  };
}

function mergeSpecs(base: ThemeSpec, over: ThemeSpec): ThemeSpec {
  const merged: ThemeSpec = { ...base, ...over };
  if (base.dark && over.dark && typeof base.dark === "object" && typeof over.dark === "object") {
    merged.dark = { ...base.dark, ...over.dark };
  }
  return merged;
}

/**
 * Compile a `ThemeSpec` into a {@link Theme}. Called with no accent it simply
 * echoes the fields you set; called with one it derives a full palette.
 */
export function defineTheme(spec: ThemeSpec = {}): Theme {
  return build(spec);
}
