import type { ComponentType } from "react";
import { catalog, getEntry, LIBRARY_VERSION } from "./catalog";
import { STYLES } from "./assets.generated";
import type { ChartEntry } from "./types";

/**
 * Render a static chart to a self-contained SVG string, using the real
 * `@microcharts/react` static component (imported at runtime from the package's
 * own dependency — carry model A). The default `svg` format embeds the shipped
 * stylesheet so the mark renders correctly dropped into any surface with no
 * external CSS; `bare` omits it for callers that already load `styles.css`.
 *
 * The `summary` is the chart's own generated accessible name (read back out of
 * the rendered markup) — correct for every data shape, no assumption that the
 * data is a number series.
 *
 * React and `react-dom/server` are imported lazily, inside the first render:
 * a session that only calls `find` / `get` (and every consumer of the AI-SDK
 * subpath that never renders) then never pays for loading them.
 */

export type RenderFormat = "svg" | "bare";

export interface RenderResult {
  /** The rendered mark. SVG for most charts; HTML for the few inline text marks
   *  (delta, token-confidence) — see `mimeType`. */
  svg: string;
  /** `image/svg+xml` for SVG-rooted charts, `text/html` for inline text marks. */
  mimeType: "image/svg+xml" | "text/html";
  /** The chart's generated accessible name — its honest alt text. */
  summary: string;
  /** Pixel size for SVG-rooted charts; 0 for font-relative inline marks. */
  width: number;
  height: number;
  /** The `@microcharts/react` version that produced this render. */
  library: string;
}

export interface RenderInput {
  /** Chart slug, e.g. "sparkline". */
  type: string;
  /** Primary data — mapped to the `data` prop; omit for scalar charts. */
  data?: unknown;
  /** Any other props (e.g. `value`, `target`, `curve`, `color`, `width`). */
  props?: Record<string, unknown> | undefined;
  /** `svg` (default, self-contained) or `bare` (no embedded CSS). */
  format?: RenderFormat | undefined;
}

// Abuse / footgun guards. A microchart is a word-sized mark: nothing legitimate
// needs thousands of points, a giant prop bag, or a megabyte of output. The byte
// caps are the load-bearing ones — a point count only sees the *top* level, and
// a series-of-series (`{ label, values }[]`) hides its bulk one level down.
const MAX_DATA_POINTS = 5000;
const MAX_DATA_BYTES = 256_000;
const MAX_PROPS_BYTES = 20_000;
const MAX_OUTPUT_BYTES = 512_000;

const componentCache = new Map<string, ComponentType<Record<string, unknown>>>();

/** Loaded on first render; see the lazy-import note above. */
let reactRuntime:
  | Promise<{
      createElement: typeof import("react").createElement;
      renderToStaticMarkup: typeof import("react-dom/server").renderToStaticMarkup;
    }>
  | undefined;

function loadReact(): NonNullable<typeof reactRuntime> {
  reactRuntime ??= Promise.all([import("react"), import("react-dom/server")]).then(
    ([react, server]) => ({
      createElement: react.createElement,
      renderToStaticMarkup: server.renderToStaticMarkup,
    }),
  );
  return reactRuntime;
}

async function loadComponent(
  slug: string,
  importPath: string,
  name: string,
): Promise<ComponentType<Record<string, unknown>>> {
  const cached = componentCache.get(slug);
  if (cached) return cached;
  const mod = (await import(importPath)) as Record<string, unknown>;
  const Comp = mod[name];
  if (typeof Comp !== "function")
    throw new Error(`render_microchart: "${name}" not exported from ${importPath}`);
  const typed = Comp as ComponentType<Record<string, unknown>>;
  componentCache.set(slug, typed);
  return typed;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * The chart's accessible name, exactly as an assistive technology would compute
 * it. Two shapes reach us:
 *
 *  - **No `id`** — the root carries `aria-label` (the default). Inner glyphs are
 *    aria-hidden, so the first hit is always the name.
 *  - **With an `id`** — the chart switches to `<title>`/`<desc>` +
 *    `aria-labelledby`, and the generated sentence lives in `<desc>`, with the
 *    author's `title` in `<title>`. Reading `<title>` alone would return
 *    "Revenue" and drop the data entirely, so resolve the reference list in
 *    order and join it, the way the accessibility tree does.
 */
function extractSummary(markup: string): string {
  const label = /aria-label="([^"]*)"/.exec(markup);
  if (label?.[1]) return decodeEntities(label[1]);

  const labelledBy = /aria-labelledby="([^"]*)"/.exec(markup)?.[1];
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => {
        const m = new RegExp(`<(?:title|desc)[^>]*\\bid="${id}"[^>]*>([^<]*)<`).exec(markup);
        return m?.[1] ?? "";
      })
      .filter(Boolean);
    if (parts.length > 0) return decodeEntities(parts.join(" "));
  }

  const title = /<title[^>]*>([^<]*)<\/title>/.exec(markup);
  return title?.[1] ? decodeEntities(title[1]) : "";
}

/** Pixel size from the ROOT tag only (px for SVG-rooted; 0 for font-relative). */
function extractSize(rootTag: string): { width: number; height: number } {
  // Signed, so an out-of-range prop surfaces as a negative to validate rather
  // than silently reading as 0.
  const w = /\bwidth="(-?[\d.]+)"/.exec(rootTag)?.[1];
  const h = /\bheight="(-?[\d.]+)"/.exec(rootTag)?.[1];
  if (w !== undefined && h !== undefined) return { width: Number(w), height: Number(h) };
  const vb = /\bviewBox="[\d.-]+ [\d.-]+ (-?[\d.]+) (-?[\d.]+)"/.exec(rootTag);
  return { width: Number(vb?.[1] ?? 0), height: Number(vb?.[2] ?? 0) };
}

/** `JSON.stringify` that answers "how big is this" without throwing on cycles. */
function sizeOf(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    throw new Error("render_microchart: props/data must be plain JSON (a cycle was found)");
  }
}

/**
 * Required props the caller didn't pass. Charts declare their own required
 * props in the catalog, so this is exact per chart — and the message names the
 * data shape, because the alternative is React throwing `Cannot read properties
 * of undefined (reading 'length')` at a model that has no way to act on it.
 */
function missingRequired(entry: ChartEntry, props: Record<string, unknown>): string[] {
  return entry.props
    .filter((p) => p.required && !p.interactive && props[p.name] === undefined)
    .map((p) => p.name);
}

/**
 * Coarse shape check against the catalog's declared prop types. Only the three
 * unambiguous cases are enforced — an array type, a plain `number`, a plain
 * `string` — because that is where a model actually goes wrong (passing
 * `"1,2,3"` or `{…}` where a series belongs) and the failure would otherwise
 * surface as `r.map is not a function`. Anything richer is left to the chart,
 * which has documented edge-case behaviour for nulls and non-finite numbers.
 */
function typeMismatches(entry: ChartEntry, props: Record<string, unknown>): string[] {
  const wrong: string[] = [];
  for (const p of entry.props) {
    const value = props[p.name];
    if (value === undefined || p.interactive) continue;
    const expected = p.type.trim();
    const ok = expected.endsWith("[]")
      ? Array.isArray(value)
      : expected === "number"
        ? typeof value === "number"
        : expected === "string"
          ? typeof value === "string"
          : true;
    if (!ok)
      wrong.push(
        `\`${p.name}\` must be ${expected}, got ${Array.isArray(value) ? "an array" : typeof value}`,
      );
  }
  return wrong;
}

/** Split a declared type on its TOP-LEVEL `|`, so `(d: A | null) => void` stays one alternative. */
function alternatives(type: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < type.length; i++) {
    const ch = type[i];
    if (ch === "(" || ch === "[" || ch === "{" || ch === "<") depth++;
    else if (ch === ")" || ch === "]" || ch === "}" || ch === ">") depth--;
    else if (ch === "|" && depth === 0) {
      out.push(type.slice(start, i));
      start = i + 1;
    }
  }
  out.push(type.slice(start));
  return out;
}

/**
 * Props that cannot mean anything over this transport, and why.
 *
 * JSON has no functions and no React children, and this tool renders the STATIC
 * entry. Left unchecked, each of these fails in a different unhelpful way: a
 * partial `strings` table throws `o.trendPct is not a function` from deep
 * inside the library, and `animate` is accepted and silently does nothing —
 * which is worse, because the caller believes it applied. Naming the reason is
 * the only honest option.
 */
function unsupportedProps(entry: ChartEntry, props: Record<string, unknown>): string[] {
  // Shared grammar props (`animate`, `onActive`, `format`, …) live beside the
  // chart's own; a chart-specific entry wins if both declare the same name.
  const declared = new Map(
    [...catalog.sharedProps, ...entry.props].map((p) => [p.name, p] as const),
  );
  const out: string[] = [];

  if (props.children !== undefined)
    out.push(
      "`children` — annotations (Threshold, Marker, TargetZone, Callout) are React children and have no JSON form",
    );
  for (const name of ["strings", "seriesStrings"])
    if (props[name] !== undefined)
      out.push(
        `\`${name}\` — a table of functions; pass \`locale\` for number formatting, or set \`summary\` to supply the sentence yourself`,
      );

  for (const [name, value] of Object.entries(props)) {
    if (value === undefined) continue;
    const p = declared.get(name);
    if (!p) continue;
    if (p.interactive) {
      out.push(`\`${name}\` — interactive-only; this tool renders the static chart`);
      continue;
    }
    const alts = alternatives(p.type);
    if (alts.length > 0 && alts.every((a) => a.includes("=>")))
      out.push(`\`${name}\` — a function, which cannot cross JSON`);
  }
  return out;
}

export async function renderChart(input: RenderInput): Promise<RenderResult> {
  const { type, data, props = {}, format = "svg" } = input;

  const entry = getEntry(type);
  if (!entry) throw new Error(`render_microchart: unknown chart "${type}"`);
  if (entry.status !== "stable")
    throw new Error(`render_microchart: "${type}" is not a stable, renderable chart`);

  const finalProps: Record<string, unknown> = {
    ...(data !== undefined ? { data } : {}),
    ...props,
  };

  // `data` gets the roomy cap wherever the caller put it; everything else is
  // configuration and stays small.
  const { data: series, ...config } = finalProps;
  if (Array.isArray(series) && series.length > MAX_DATA_POINTS)
    throw new Error(`render_microchart: data exceeds ${MAX_DATA_POINTS} points`);
  if (sizeOf(series) > MAX_DATA_BYTES)
    throw new Error(`render_microchart: data exceeds ${MAX_DATA_BYTES / 1000} kB`);
  if (sizeOf(config) > MAX_PROPS_BYTES)
    throw new Error("render_microchart: props payload too large");

  const missing = missingRequired(entry, finalProps);
  if (missing.length > 0)
    throw new Error(
      `render_microchart: "${type}" needs ${missing.map((m) => `\`${m}\``).join(", ")}. ` +
        `Data shape: ${entry.dataShape}. ` +
        `Call get_microchart("${type}") for a ready-to-render \`sample\`.`,
    );

  const unsupported = unsupportedProps(entry, finalProps);
  if (unsupported.length > 0)
    throw new Error(
      `render_microchart: these props can't cross a tool call — ${unsupported.join("; ")}. ` +
        "Drop them, or import the component and pass them in your own code.",
    );

  const wrong = typeMismatches(entry, finalProps);
  if (wrong.length > 0)
    throw new Error(
      `render_microchart: "${type}" — ${wrong.join("; ")}. Data shape: ${entry.dataShape}. ` +
        `Call get_microchart("${type}") for a ready-to-render \`sample\`.`,
    );

  const [{ createElement, renderToStaticMarkup }, Comp] = await Promise.all([
    loadReact(),
    loadComponent(entry.slug, entry.staticImport, entry.name),
  ]);

  let markup: string;
  try {
    markup = renderToStaticMarkup(createElement(Comp, finalProps));
  } catch (err) {
    throw new Error(
      `render_microchart: ${entry.name} failed to render — ${(err as Error).message}`,
      { cause: err },
    );
  }

  if (markup.length > MAX_OUTPUT_BYTES)
    throw new Error(
      `render_microchart: "${type}" produced ${Math.round(markup.length / 1000)} kB of markup ` +
        `(limit ${MAX_OUTPUT_BYTES / 1000} kB) — a microchart is a word-sized mark; send fewer points.`,
    );

  const rootTag = /^<[a-zA-Z][^>]*>/.exec(markup)?.[0] ?? "";
  const rootIsSvg = rootTag.startsWith("<svg");
  const summary = extractSummary(markup);
  const { width, height } = extractSize(rootTag);

  // A non-positive or non-finite box is not a renderable SVG (`viewBox="0 0 -5
  // 20"` is invalid and paints nothing), so refuse it rather than hand back
  // markup that silently shows up blank.
  if (rootIsSvg && !(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0))
    throw new Error(
      `render_microchart: "${type}" produced an invalid ${width}×${height} box — ` +
        "check that `width`/`height` and any domain props are positive, finite numbers.",
    );

  // Namespace an SVG root so it's a valid standalone SVG (renderToStaticMarkup
  // omits xmlns). HTML-rooted inline marks (delta, token-confidence) stay HTML.
  if (rootIsSvg && !/\bxmlns=/.test(rootTag))
    markup = markup.replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');

  // Self-contained: embed the stylesheet. Inside the SVG for an SVG root (first
  // child); before the fragment for an HTML-rooted mark.
  if (format === "svg") {
    const style = `<style>${STYLES}</style>`;
    if (rootIsSvg) {
      const tagEnd = markup.indexOf(">") + 1;
      markup = markup.slice(0, tagEnd) + style + markup.slice(tagEnd);
    } else {
      markup = style + markup;
    }
  }

  return {
    svg: markup,
    mimeType: rootIsSvg ? "image/svg+xml" : "text/html",
    summary,
    width,
    height,
    library: LIBRARY_VERSION,
  };
}
