import { describe, expect, it } from "vitest";
import {
  entryPoints,
  methodNotAllowed,
  notAcceptable,
  notFound,
  problemJson,
  problemMarkdown,
  suggestRoutes,
} from "./agent-errors.ts";

const ORIGIN = "https://microcharts.dev";

describe("problem builders", () => {
  it("names the path that missed, and offers a way out", () => {
    const problem = notFound({ path: "/sparklines", origin: ORIGIN });
    expect(problem.status).toBe(404);
    expect(problem.code).toBe("not_found");
    expect(problem.detail).toContain("/sparklines");
    expect(problem.hints.length).toBeGreaterThan(0);
    expect(problem.links.length).toBeGreaterThan(0);
  });

  it("falls back to generic wording for the static twin", () => {
    const problem = notFound({ path: null, origin: ORIGIN });
    expect(problem.detail).toContain("the URL you requested");
    expect(problem.detail).not.toContain("null");
  });

  it("carries the allowed methods on a 405", () => {
    const problem = methodNotAllowed({ path: "/api/search", origin: ORIGIN, method: "POST" });
    expect(problem.status).toBe(405);
    expect(problem.allow).toEqual(["GET", "HEAD"]);
    expect(problem.detail).toContain("POST");
  });

  it("quotes the offending Accept on a 406", () => {
    const problem = notAcceptable({
      path: "/charts/core",
      origin: ORIGIN,
      accept: "text/markdown",
    });
    expect(problem.status).toBe(406);
    expect(problem.detail).toContain("text/markdown");
  });

  it("points every entry point at the requesting origin", () => {
    const preview = "https://preview.example.dev";
    for (const link of entryPoints(preview)) expect(link.href.startsWith(preview)).toBe(true);
  });

  it("lists the site's machine surfaces", () => {
    const hrefs = entryPoints(ORIGIN).map((l) => l.href);
    expect(hrefs).toContain(`${ORIGIN}/llms.txt`);
    expect(hrefs).toContain(`${ORIGIN}/sitemap.xml`);
    expect(hrefs).toContain(`${ORIGIN}/openapi.json`);
    expect(hrefs).toContain(`${ORIGIN}/catalog.json`);
  });
});

describe("problemJson", () => {
  const body = JSON.parse(
    problemJson(
      notFound({ path: "/nope", origin: ORIGIN, suggestions: [`${ORIGIN}/docs`] }),
      ORIGIN,
    ),
  );

  it("is RFC 9457 problem details", () => {
    expect(body.type).toMatch(/^https:\/\//);
    expect(body.title).toBeTruthy();
    expect(body.status).toBe(404);
    expect(body.detail).toBeTruthy();
    expect(body.instance).toBe("/nope");
  });

  it("carries the members an agent acts on", () => {
    expect(body.code).toBe("not_found");
    expect(body.error).toEqual({ code: "not_found", message: body.detail });
    expect(Array.isArray(body.hints)).toBe(true);
    expect(body.suggestions).toEqual([`${ORIGIN}/docs`]);
    expect(body.links.every((l: { href: string }) => l.href.startsWith(ORIGIN))).toBe(true);
  });
});

describe("problemMarkdown", () => {
  const md = problemMarkdown(
    notFound({
      path: "/sparklines",
      origin: ORIGIN,
      suggestions: [`${ORIGIN}/docs/charts/sparkline`],
    }),
  );

  it("opens with an H1 that states the status", () => {
    expect(md.startsWith("# 404 — ")).toBe(true);
  });

  it("links the recovery routes as Markdown", () => {
    expect(md).toContain(`[llms.txt](${ORIGIN}/llms.txt)`);
    expect(md).toContain("## Where to look next");
    expect(md).toContain(`<${ORIGIN}/docs/charts/sparkline>`);
  });

  it("stays short enough to read in a tool result", () => {
    expect(md.length).toBeLessThan(2000);
  });

  it("balances its code fences", () => {
    expect((md.match(/```/g) ?? []).length % 2).toBe(0);
  });

  it("drops the suggestions heading when there are none", () => {
    expect(problemMarkdown(notFound({ path: "/x", origin: ORIGIN }))).not.toContain(
      "## Closest matches",
    );
  });
});

describe("suggestRoutes", () => {
  const routes = [
    "/docs",
    "/docs/quickstart",
    "/docs/charts",
    "/docs/charts/sparkline",
    "/docs/charts/spark-bar",
    "/docs/theming",
    "/charts",
    "/examples/cortex",
  ];

  it("finds the page behind a near-miss slug", () => {
    expect(suggestRoutes("/docs/charts/sparklines", routes)[0]).toBe("/docs/charts/sparkline");
    expect(suggestRoutes("/docs/chart/sparkline", routes)[0]).toBe("/docs/charts/sparkline");
  });

  it("falls back to the section when only the section matches", () => {
    expect(suggestRoutes("/docs/theme", routes)).toContain("/docs/theming");
  });

  it("offers the section a missing page would have lived in", () => {
    expect(suggestRoutes("/docs/nothing-here", routes)).toContain("/docs");
  });

  it("returns nothing for a path with no overlap", () => {
    expect(suggestRoutes("/wp-admin/xyz", routes)).toEqual([]);
  });

  // Regression: short tokens are one edit from everything, so a nonsense path
  // came back with three confident-looking guesses.
  it("stays quiet rather than guessing", () => {
    expect(suggestRoutes("/some-path-that-does-not-exist", routes)).toEqual([]);
    expect(suggestRoutes("/.env", routes)).toEqual([]);
    expect(suggestRoutes("/api/v2/users", routes)).toEqual([]);
  });

  it("caps the list", () => {
    expect(suggestRoutes("/docs/charts", routes, 2).length).toBe(2);
  });

  it("survives an empty route list", () => {
    expect(suggestRoutes("/docs", [])).toEqual([]);
  });
});
