/**
 * Derive a **JSON prop bag** for each chart from its registry example.
 *
 * The catalog's `example.code` is TS/JSX — the right thing to show a human, the
 * wrong thing to hand `render_microchart`, which takes JSON. So at gen time we
 * evaluate the example's own attributes against its own `sampleData` and commit
 * the result as `sample`. `get_microchart` returns it, so a model that has never
 * seen a `{ label, value }[]` chart can copy one valid payload straight into a
 * render call.
 *
 * Everything here runs at generation time only — never in the published package.
 * The inputs are this repo's own committed snippets, not user input.
 */
import { transformSync } from "esbuild";

export interface SampleExtraction {
  /** Serializable props from the example — `undefined` when none could be derived. */
  sample?: Record<string, unknown>;
  /** Props skipped because they aren't JSON (render callbacks, formatters). */
  skipped: string[];
  /** Why no sample was produced, for the gen report. */
  reason?: string;
}

/**
 * Split an example into the statements that set it up and the JSX element
 * itself. Imports go; comments and inline `const` declarations stay in the
 * prelude, because several examples define their data right there instead of in
 * `sampleData`.
 */
function splitExample(code: string): { prelude: string; jsx: string } {
  const body = code.replace(/^\s*import[^\n]*\n/gm, "");
  const at = body.search(/^[ \t]*<[A-Z]/m);
  if (at === -1) return { prelude: body, jsx: "" };
  return { prelude: body.slice(0, at), jsx: body.slice(at).trim() };
}

/**
 * Scan `name={expr}` / `name="str"` / `name` off a self-closing JSX tag.
 * Brace-balanced and string-aware, so `data={[{ a: "}" }]}` survives.
 */
function attributes(jsx: string): { name: string; expr: string }[] {
  const open = /^<([A-Z][A-Za-z0-9]*)/.exec(jsx);
  if (!open) return [];
  const out: { name: string; expr: string }[] = [];
  let i = open[0].length;

  while (i < jsx.length) {
    while (i < jsx.length && /\s/.test(jsx[i] as string)) i++;
    if (jsx.startsWith("/>", i) || jsx[i] === ">") break;

    const nameMatch = /^[A-Za-z_][A-Za-z0-9_-]*/.exec(jsx.slice(i));
    if (!nameMatch) break;
    const name = nameMatch[0];
    i += name.length;

    while (i < jsx.length && /\s/.test(jsx[i] as string)) i++;
    if (jsx[i] !== "=") {
      out.push({ name, expr: "true" }); // bare boolean attribute
      continue;
    }
    i++; // '='
    while (i < jsx.length && /\s/.test(jsx[i] as string)) i++;

    if (jsx[i] === '"' || jsx[i] === "'") {
      const quote = jsx[i] as string;
      const end = jsx.indexOf(quote, i + 1);
      if (end === -1) break;
      out.push({ name, expr: JSON.stringify(jsx.slice(i + 1, end)) });
      i = end + 1;
      continue;
    }
    if (jsx[i] !== "{") break;

    // Balanced-brace scan, skipping over string and template literals.
    let depth = 0;
    const start = i;
    let quote: string | null = null;
    for (; i < jsx.length; i++) {
      const ch = jsx[i] as string;
      if (quote) {
        if (ch === "\\") i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        i++;
        break;
      }
    }
    out.push({ name, expr: jsx.slice(start + 1, i - 1) });
  }
  return out;
}

/** TS → JS so `const x: number[] = []` and `satisfies` clauses evaluate. */
function stripTypes(code: string): string {
  return transformSync(code, { loader: "ts", format: "esm" }).code;
}

/**
 * A function body that evaluates `expr` and returns it. The expression is bound
 * to a `const` before the transform runs — esbuild discards a side-effect-free
 * *expression statement* (`(-23);` vanishes), so a bare parenthesised
 * expression is not a safe thing to hand it.
 */
function evalBody(expr: string): string {
  return `${stripTypes(`const __expr = (${expr});`)}\nreturn __expr;`;
}

/**
 * Round every non-integer to a fixed precision, recursively.
 *
 * Load-bearing for portability, not cosmetics. Several examples generate their
 * series with `Math.sin`/`Math.cos`, and those are NOT bit-identical across V8
 * versions and CPU architectures — the committed snapshot diverged in the 17th
 * significant digit between a dev machine (node 24 / arm64) and CI (node 22 /
 * x64), which failed the drift guard for a difference no chart can express. Six
 * decimals is far more precision than a word-sized mark can render, and matches
 * the library's own "rounded at generation" rule for geometry.
 *
 * Integers pass through untouched, so `Date.UTC(…)` timestamps keep full value.
 */
const SAMPLE_PRECISION = 1e6;

function roundDeep(v: unknown): unknown {
  if (typeof v === "number")
    return Number.isInteger(v) ? v : Math.round(v * SAMPLE_PRECISION) / SAMPLE_PRECISION;
  if (Array.isArray(v)) return v.map(roundDeep);
  if (v !== null && typeof v === "object")
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, roundDeep(x)]));
  return v;
}

function isJsonSafe(v: unknown): boolean {
  if (v === null) return true;
  switch (typeof v) {
    case "string":
    case "boolean":
      return true;
    case "number":
      return Number.isFinite(v);
    case "object":
      return Array.isArray(v)
        ? v.every(isJsonSafe)
        : Object.values(v as object).every((x) => x !== undefined && isJsonSafe(x));
    default:
      return false; // function, symbol, bigint, undefined
  }
}

/**
 * Evaluate the example's attributes into a JSON prop bag. Non-serializable
 * props (formatters, render callbacks) are reported in `skipped` rather than
 * silently dropped, so a chart whose example is mostly a callback is visible in
 * the gen report instead of quietly shipping a thin sample.
 */
export function extractSample(
  exampleCode: string,
  sampleData: { name: string; code: string }[] | undefined,
): SampleExtraction {
  const { prelude: inline, jsx } = splitExample(exampleCode);
  const attrs = attributes(jsx);
  if (attrs.length === 0) return { skipped: [], reason: "no attributes on the example element" };

  // Scope = the named `sampleData` snippets plus anything the example declares
  // inline, in that order, so a later inline `const` can build on a sample.
  let setup: string;
  try {
    setup = stripTypes([...(sampleData ?? []).map((s) => s.code), inline].join("\n"));
  } catch (err) {
    return { skipped: [], reason: `example setup did not compile: ${(err as Error).message}` };
  }

  const sample: Record<string, unknown> = {};
  const skipped: string[] = [];
  for (const { name, expr } of attrs) {
    let value: unknown;
    try {
      value = new Function(`${setup}\n${evalBody(expr)}`)() as unknown;
    } catch {
      skipped.push(name);
      continue;
    }
    if (value === undefined || !isJsonSafe(value)) skipped.push(name);
    else sample[name] = roundDeep(value);
  }

  if (Object.keys(sample).length === 0)
    return { skipped, reason: "no serializable props in the example" };
  return { sample, skipped };
}
