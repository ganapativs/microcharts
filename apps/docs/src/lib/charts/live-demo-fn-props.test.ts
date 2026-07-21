import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Chart-doc MDX renders chart tags as the INTERACTIVE (client) entries
 * (`mdx-chart-tags-live`). A `<LiveDemo>` VARIANT (no `sizeOf`) hands its
 * children to the client `LiveDemoView` as the preview — so a **function** prop
 * on that element (`format={(n) => …}`, `xFormat`, `etaFormat`, a callback…)
 * has to cross the RSC server→client boundary, which throws:
 *
 *   "Functions cannot be passed directly to Client Components…"
 *
 * The page still 200s but the preview crashes in the browser. Use a serializable
 * `Intl.NumberFormatOptions` object instead (`{ style: "unit", unit: "millisecond" }`),
 * or move the demo to a `sizeOf` entry (whose children are discarded), or — for a
 * genuinely function-only prop — drop it from the live element and keep it in the
 * `code` string. Guide pages (content/docs/*.mdx) use the STATIC tags and are
 * exempt: their charts render server-side, consuming the function there.
 */
const DIR = join(process.cwd(), "content/docs/charts");
// A live JSX function prop: `name={(args) => …}` or `name={fn}` arrow, or `name={function …}`.
const FN_PROP = /(\w+)=\{\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>|(\w+)=\{\s*function\b/;

describe("chart-doc LiveDemo variants pass no function props across the RSC boundary", () => {
  for (const file of readdirSync(DIR).filter((f) => f.endsWith(".mdx"))) {
    it(`${file}`, () => {
      let src = readFileSync(join(DIR, file), "utf8");
      // Strip fenced blocks and `code={`…`}` template strings FIRST — they are
      // text, not live JSX (and their `>`/`}` would break block parsing).
      src = src.replace(/```[\s\S]*?```/g, "").replace(/code=\{`[\s\S]*?`\}/g, "code={``}");

      const offenders: string[] = [];
      const blocks = /<LiveDemo\b([^>]*)>([\s\S]*?)<\/LiveDemo>/g;
      let m: RegExpExecArray | null;
      while ((m = blocks.exec(src))) {
        if (/\bsizeOf=/.test(m[1]!)) continue; // entry demo → children discarded
        const fn = m[2]!.match(FN_PROP);
        if (fn) offenders.push(fn[0].replace(/\s+/g, " ").slice(0, 60));
      }
      expect(
        offenders,
        `function prop(s) in a LiveDemo variant — use serializable Intl options instead: ${offenders.join(" | ")}`,
      ).toEqual([]);
    });
  }
});
