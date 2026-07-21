import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CHARTS = join(import.meta.dirname);

/** Escape-aware extract of `contexts.sentence.code` from a chart module source. */
function sentenceCode(src: string): string | null {
  const start = src.indexOf("sentence:");
  if (start < 0) return null;
  const cell = src.indexOf("\n  cell:", start);
  const region = src.slice(start, cell < 0 ? undefined : cell);
  const mark = region.search(/\bcode:\s*/);
  if (mark < 0) return null;
  let i = mark + region.slice(mark).match(/\bcode:\s*/)![0].length;
  const quote = region[i];
  if (quote !== "`" && quote !== '"' && quote !== "'") return null;
  i += 1;
  let body = "";
  while (i < region.length) {
    const c = region[i]!;
    if (c === "\\" && i + 1 < region.length) {
      body += region.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (c === quote) {
      return body
        .replace(/\\n/g, "\n")
        .replace(new RegExp(`\\\\${quote}`, "g"), quote)
        .replace(/\\\\/g, "\\");
    }
    body += c;
    i += 1;
  }
  return null;
}

function sentenceRender(src: string): string | null {
  const m = src.match(/sentence:\s*\{([\s\S]*?)\n\s*\},\n\s*cell:/);
  return m ? m[1]!.split(/\bcode:\s*/)[0]! : null;
}

describe("four-homes sentence code includes mc-inline", () => {
  const files = readdirSync(CHARTS)
    .filter((f) => f.endsWith(".tsx") && !f.endsWith(".live.tsx"))
    .filter((f) => f !== "contexts-factory.tsx" && f !== "delta.tsx");

  it("covers the chart modules", () => {
    expect(files.length).toBeGreaterThan(90);
  });

  for (const file of files) {
    it(`${file}: sentence code mirrors render's mc-inline (+ summary={false})`, () => {
      const src = readFileSync(join(CHARTS, file), "utf8");
      if (!src.includes("contexts")) return;
      const render = sentenceRender(src);
      if (!render || !render.includes('className="mc-inline"')) return;
      const code = sentenceCode(src);
      expect(code, `${file}: missing sentence.code`).toBeTruthy();
      expect(code, `${file}: code omits mc-inline`).toContain('className="mc-inline"');
      if (render.includes("summary={false}")) {
        expect(code, `${file}: code omits summary={false}`).toContain("summary={false}");
      }
    });
  }

  it("delta sentence stays bare (owns its baseline)", () => {
    const src = readFileSync(join(CHARTS, "delta.tsx"), "utf8");
    const code = sentenceCode(src);
    expect(code).toBeTruthy();
    expect(code).not.toContain('className="mc-inline"');
    expect(code).toContain("<Delta");
  });
});
