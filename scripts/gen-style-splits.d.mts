/**
 * Type declarations for gen-style-splits.mjs's small exported surface, so
 * src/test/style-splits.test.ts can import it under strict TypeScript
 * without turning on `allowJs` for the whole project (scripts/ is
 * intentionally plain Node ESM, outside the src/ program).
 */

/** A single line of styles.css tagged with the `@mc-chart` slug it belongs
 * to (or `null` for shared/core content). */
export interface TaggedLine {
  line: string;
  slug: string | null;
}

export type StyleSegment =
  | { type: "raw"; lines: string[] }
  | { type: "layer"; name: string; tagged: TaggedLine[] };

export interface GenerateResult {
  /** "core.css" and "<slug>.css" (per marked chart) → generated file text. */
  files: Record<string, string>;
  /** Marked chart slugs, sorted. */
  slugs: string[];
  segments: StyleSegment[];
}

/** Pure: styles.css source text → generated core + per-chart file contents. */
export function generateFromSource(src: string): GenerateResult;

/** Pure: marked slugs vs. known `src/charts/<slug>` dir names → unknown slugs. */
export function unknownSlugs(
  slugs: readonly string[],
  knownChartDirs: readonly string[] | Set<string>,
): string[];
