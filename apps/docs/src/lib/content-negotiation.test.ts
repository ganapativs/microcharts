import { describe, expect, it } from "vitest";
import {
  acceptsHtml,
  errorFormat,
  isApiPath,
  markdownAssetFor,
  matchAccept,
  negotiate,
  rewritableError,
} from "./content-negotiation.ts";

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

  // The acceptmarkdown contract's third probe: an explicit q=0 must fall back.
  it("q=0 on markdown never selects it", () => {
    expect(negotiate("text/markdown;q=0, text/html", md)).toBe("html");
  });

  it("markdown-only with no mirror is 406, else degrades to HTML", () => {
    expect(negotiate("text/markdown", false)).toBe("not-acceptable");
    expect(negotiate("text/markdown, text/html;q=0.1", false)).toBe("html");
  });
});

describe("acceptsHtml", () => {
  it("is true for browsers, wildcards, and no header at all", () => {
    expect(acceptsHtml("text/html,*/*;q=0.8")).toBe(true);
    expect(acceptsHtml("*/*")).toBe(true);
    expect(acceptsHtml(null)).toBe(true);
    expect(acceptsHtml("text/*")).toBe(true);
    expect(acceptsHtml("text/markdown, text/html;q=0.1")).toBe(true);
  });

  it("is false when HTML carries no quality", () => {
    expect(acceptsHtml("application/json")).toBe(false);
    expect(acceptsHtml("image/avif,image/webp")).toBe(false);
    expect(acceptsHtml("text/html;q=0")).toBe(false);
    expect(acceptsHtml("text/markdown")).toBe(false);
  });
});

describe("markdownAssetFor", () => {
  it.each([
    ["/", "/index.md"],
    ["/docs", "/docs.md"],
    ["/docs/", "/docs.md"],
    ["/docs/ai", "/docs/ai.md"],
    ["/docs/charts", "/docs/charts.md"],
    ["/docs/charts/sparkline", "/docs/charts/sparkline.md"],
    ["/docs/charts/sparkline/", "/docs/charts/sparkline.md"],
    // Every page route negotiates, not only `/docs/*`.
    ["/charts", "/charts.md"],
    ["/examples", "/examples.md"],
    ["/contact", "/contact.md"],
    ["/charts/core", "/charts/core.md"],
  ])("%s → %s", (path, expected) => {
    expect(markdownAssetFor(path)).toBe(expected);
  });

  it("ignores concrete files and the trees that have no twin", () => {
    expect(markdownAssetFor("/docs/charts/sparkline.md")).toBeNull();
    expect(markdownAssetFor("/docs/charts/sparkline.txt")).toBeNull();
    expect(markdownAssetFor("/catalog.json")).toBeNull();
    expect(markdownAssetFor("/api/charts.json")).toBeNull();
    expect(markdownAssetFor("/api/search")).toBeNull();
    expect(markdownAssetFor("/_next/static/chunk.js")).toBeNull();
    expect(markdownAssetFor("/og/default.png")).toBeNull();
    expect(markdownAssetFor("/.well-known/mcp/server-card.json")).toBeNull();
  });
});

describe("isApiPath", () => {
  it("covers /api/* and every .json document", () => {
    expect(isApiPath("/api")).toBe(true);
    expect(isApiPath("/api/search")).toBe(true);
    expect(isApiPath("/api/charts/sparkline.json")).toBe(true);
    expect(isApiPath("/catalog.json")).toBe(true);
    expect(isApiPath("/.well-known/mcp/server-card.json")).toBe(true);
  });

  it("leaves pages and other files alone", () => {
    expect(isApiPath("/")).toBe(false);
    expect(isApiPath("/docs/ai")).toBe(false);
    expect(isApiPath("/llms.txt")).toBe(false);
    expect(isApiPath("/apiary")).toBe(false);
  });
});

describe("errorFormat", () => {
  it("answers the JSON surface in JSON, whatever the caller sent", () => {
    expect(errorFormat("text/html", "/api/charts/nope.json")).toBe("json");
    expect(errorFormat(null, "/api/whatever")).toBe("json");
    expect(errorFormat("text/markdown", "/catalog.jsonx")).toBe("markdown");
  });

  it("honours an explicit JSON ask on any path", () => {
    expect(errorFormat("application/json", "/nope")).toBe("json");
    expect(errorFormat("application/json, text/plain", "/nope")).toBe("json");
  });

  it("gives browsers the designed page", () => {
    expect(errorFormat("text/html,application/xhtml+xml,image/avif,*/*;q=0.8", "/nope")).toBe(
      "html",
    );
    expect(errorFormat("text/html", "/nope")).toBe("html");
  });

  it("gives every scripted client Markdown", () => {
    expect(errorFormat("*/*", "/nope")).toBe("markdown"); // curl, most agents
    expect(errorFormat(null, "/nope")).toBe("markdown");
    expect(errorFormat("text/markdown", "/nope")).toBe("markdown");
    expect(errorFormat("text/*", "/nope")).toBe("markdown");
  });
});

describe("rewritableError", () => {
  it("rewrites page routes and text-ish files", () => {
    expect(rewritableError("/nope")).toBe(true);
    expect(rewritableError("/docs/nope.md")).toBe(true);
    expect(rewritableError("/nope.json")).toBe(true);
    expect(rewritableError("/nope.xml")).toBe(true);
  });

  it("leaves binary misses to the asset store", () => {
    expect(rewritableError("/brand/mark.svg")).toBe(false);
    expect(rewritableError("/examples/atlas-dark.webp")).toBe(false);
    expect(rewritableError("/fonts/Iosevka-400-latin.woff2")).toBe(false);
  });
});
