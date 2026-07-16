import { describe, expect, it } from "vitest";
import { markdownAssetFor, matchAccept, negotiate } from "./content-negotiation.ts";

describe("matchAccept", () => {
  it("no header is a no-preference wildcard", () => {
    expect(matchAccept(null, "text/markdown")).toEqual({ q: 1, spec: 0 });
    expect(matchAccept("", "text/markdown")).toEqual({ q: 1, spec: 0 });
  });

  it("scores exact > type-wildcard > full-wildcard", () => {
    expect(matchAccept("text/markdown", "text/markdown")).toEqual({ q: 1, spec: 2 });
    expect(matchAccept("text/*", "text/markdown")).toEqual({ q: 1, spec: 1 });
    expect(matchAccept("*/*", "text/markdown")).toEqual({ q: 1, spec: 0 });
    expect(matchAccept("application/json", "text/markdown")).toEqual({ q: 0, spec: -1 });
  });

  it("honours and clamps q-values", () => {
    expect(matchAccept("text/markdown;q=0.4", "text/markdown").q).toBe(0.4);
    expect(matchAccept("text/markdown;q=0", "text/markdown").q).toBe(0);
    expect(matchAccept("text/markdown;q=9", "text/markdown").q).toBe(1);
    expect(matchAccept("text/markdown;q=bogus", "text/markdown").q).toBe(1);
  });

  it("picks the most specific range from a list", () => {
    const h = "text/html,application/xhtml+xml,*/*;q=0.8";
    expect(matchAccept(h, "text/html")).toEqual({ q: 1, spec: 2 });
    expect(matchAccept(h, "text/markdown")).toEqual({ q: 0.8, spec: 0 });
  });
});

describe("negotiate", () => {
  const md = true;
  it("bare `text/markdown` opts into the mirror", () => {
    expect(negotiate("text/markdown", md)).toBe("markdown");
    expect(negotiate("text/markdown, text/plain", md)).toBe("markdown");
    expect(negotiate("text/markdown;q=0.9, text/html;q=0.8", md)).toBe("markdown");
  });

  it("browsers and curl defaults stay on HTML", () => {
    expect(negotiate("text/html,application/xhtml+xml,*/*;q=0.8", md)).toBe("html");
    expect(negotiate("*/*", md)).toBe("html"); // curl's default
    expect(negotiate(null, md)).toBe("html");
    expect(negotiate("text/markdown;q=0.5, text/html", md)).toBe("html");
  });

  it("markdown-only with no mirror is 406, else degrades to HTML", () => {
    expect(negotiate("text/markdown", false)).toBe("not-acceptable");
    expect(negotiate("text/markdown, text/html;q=0.1", false)).toBe("html");
  });

  it("q=0 on markdown never selects it", () => {
    expect(negotiate("text/markdown;q=0, text/html", md)).toBe("html");
  });
});

describe("markdownAssetFor", () => {
  it.each([
    ["/docs", "/docs.md"],
    ["/docs/", "/docs.md"],
    ["/docs/ai", "/docs/ai.md"],
    ["/docs/charts", "/docs/charts.md"],
    ["/docs/charts/sparkline", "/docs/charts/sparkline.md"],
    ["/docs/charts/sparkline/", "/docs/charts/sparkline.md"],
  ])("%s → %s", (path, expected) => {
    expect(markdownAssetFor(path)).toBe(expected);
  });

  it("ignores non-doc routes and concrete files", () => {
    expect(markdownAssetFor("/")).toBeNull();
    expect(markdownAssetFor("/elements")).toBeNull();
    expect(markdownAssetFor("/docs/charts/sparkline.md")).toBeNull();
    expect(markdownAssetFor("/docs/charts/sparkline.txt")).toBeNull();
    expect(markdownAssetFor("/catalog.json")).toBeNull();
  });
});
