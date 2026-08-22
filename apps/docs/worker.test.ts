import { describe, expect, it } from "vitest";
import worker from "./worker.ts";

/**
 * The Worker, exercised against a stand-in for Cloudflare's asset store.
 *
 * `fakeAssets` reproduces the two behaviours `wrangler.jsonc` configures and
 * the Worker leans on: `html_handling: "auto-trailing-slash"` (a clean route
 * resolves to `<route>.html`) and `not_found_handling: "404-page"` (a miss is
 * the 404 page with a 404 status). Everything else — negotiation, error
 * format, redirects, headers — is the Worker's own code running for real.
 */
const FILES: Record<string, string> = {
  "/index.html": "<html><h1>microcharts</h1></html>",
  "/index.md": "# microcharts (https://microcharts.dev)\n\nWord-sized charts.\n",
  "/charts.html": "<html><h1>Chart index</h1></html>",
  "/charts.md": "# Chart index\n",
  "/charts/core.html": "<html><h1>Core</h1></html>",
  "/docs/ai.html": "<html><h1>AI-native</h1></html>",
  "/docs/ai.md": "# AI-native (https://microcharts.dev/docs/ai)\n",
  "/404.html": "<html><h1>This page doesn't exist</h1></html>",
  "/404.md": "# 404 — no page at this URL\n",
  "/catalog.json": '{"package":"@microcharts/react"}',
  "/api/search": '{"index":[]}',
  "/openapi.json": '{"openapi":"3.1.1"}',
  "/brand/mark.svg": "<svg/>",
  "/sitemap.xml": [
    "<urlset>",
    "<url><loc>https://microcharts.dev/docs</loc></url>",
    "<url><loc>https://microcharts.dev/docs/charts/sparkline</loc></url>",
    "<url><loc>https://microcharts.dev/docs/quickstart</loc></url>",
    "<url><loc>https://microcharts.dev/charts</loc></url>",
    "</urlset>",
  ].join(""),
};

const env = {
  ASSETS: {
    async fetch(request: Request): Promise<Response> {
      const path = new URL(request.url).pathname;
      const clean = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;

      const hit = FILES[clean] ?? FILES[clean === "/" ? "/index.html" : `${clean}.html`];
      if (hit != null) {
        const type = clean.endsWith(".json")
          ? "application/json"
          : clean.endsWith(".md")
            ? "text/markdown"
            : clean.endsWith(".xml")
              ? "application/xml"
              : clean.endsWith(".svg")
                ? "image/svg+xml"
                : "text/html";
        return new Response(hit, { status: 200, headers: { "Content-Type": type } });
      }
      return new Response(FILES["/404.html"], {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    },
  },
};

const BROWSER = "text/html,application/xhtml+xml,image/avif,image/webp,*/*;q=0.8";

function get(path: string, accept?: string | null, method = "GET"): Promise<Response> {
  const headers = accept == null ? undefined : { Accept: accept };
  return worker.fetch(new Request(`https://microcharts.dev${path}`, { method, headers }), env);
}

describe("markdown negotiation", () => {
  it("serves the home page's twin on `Accept: text/markdown`", async () => {
    const res = await get("/", "text/markdown");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(await res.text()).toContain("# microcharts");
  });

  it("varies on Accept and Accept-Encoding, in both representations", async () => {
    for (const accept of ["text/markdown", BROWSER]) {
      const vary = (await get("/", accept)).headers.get("Vary") ?? "";
      expect(vary.toLowerCase()).toContain("accept");
      expect(vary.toLowerCase()).toContain("accept-encoding");
    }
  });

  it("negotiates every page route, not just /docs", async () => {
    expect(await (await get("/charts", "text/markdown")).text()).toContain("# Chart index");
    expect(await (await get("/docs/ai", "text/markdown")).text()).toContain("# AI-native");
  });

  it("names the twin it served in Content-Location", async () => {
    expect((await get("/", "text/markdown")).headers.get("Content-Location")).toBe("/index.md");
  });

  it("keeps browsers and wildcard clients on HTML", async () => {
    for (const accept of [BROWSER, "*/*", null]) {
      const res = await get("/", accept);
      expect(res.status).toBe(200);
      expect(await res.text()).toContain("<h1>microcharts</h1>");
    }
  });

  it("respects q=0 on markdown", async () => {
    const res = await get("/", "text/markdown;q=0, text/html");
    expect(await res.text()).toContain("<h1>microcharts</h1>");
  });

  it("406s a markdown-only client on a page with no twin", async () => {
    const res = await get("/charts/core", "text/markdown");
    expect(res.status).toBe(406);
    expect(res.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(res.headers.get("Vary")?.toLowerCase()).toContain("accept");
  });

  it("406s a client that accepts neither representation", async () => {
    const res = await get("/", "application/json");
    expect(res.status).toBe(406);
    expect(res.headers.get("Content-Type")).toBe("application/problem+json; charset=utf-8");
    expect((await res.json()).code).toBe("not_acceptable");
  });

  it("advertises the OpenAPI description on page responses", async () => {
    const link = (await get("/", BROWSER)).headers.get("Link") ?? "";
    expect(link).toContain('rel="service-desc"');
    expect(link).toContain("/openapi.json");
  });
});

describe("404s", () => {
  it("keeps the designed page for browsers, and points them at the twin", async () => {
    const res = await get("/nope", BROWSER);
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("This page doesn't exist");
    expect(res.headers.get("Link")).toContain("/404.md");
  });

  it("answers a scripted client with a short markdown recovery note", async () => {
    const res = await get("/nope", "*/*");
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");

    const body = await res.text();
    expect(body.startsWith("# 404 — ")).toBe(true);
    expect(body).toContain("/nope");
    expect(body).toContain("https://microcharts.dev/llms.txt");
    expect(body).toContain("https://microcharts.dev/sitemap.xml");
    expect(body).toContain("https://microcharts.dev/docs");
    expect(body.length).toBeLessThan(2000);
  });

  it("suggests the closest real URLs, read from the sitemap", async () => {
    const body = await (await get("/docs/charts/sparklines", "*/*")).text();
    expect(body).toContain("## Closest matches");
    expect(body).toContain("https://microcharts.dev/docs/charts/sparkline");
  });

  it("answers the JSON surface with problem details", async () => {
    const res = await get("/api/charts/nope.json", "*/*");
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("application/problem+json; charset=utf-8");

    const body = await res.json();
    expect(body.status).toBe(404);
    expect(body.code).toBe("not_found");
    expect(body.error.message).toBeTruthy();
    expect(body.hints.length).toBeGreaterThan(0);
    expect(body.links.some((l: { href: string }) => l.href.endsWith("/openapi.json"))).toBe(true);
  });

  it("answers an explicit JSON ask in JSON, on any path", async () => {
    const res = await get("/nope", "application/json");
    expect(res.headers.get("Content-Type")).toBe("application/problem+json; charset=utf-8");
    expect((await res.json()).status).toBe(404);
  });

  it("never caches an error", async () => {
    expect((await get("/nope", "*/*")).headers.get("Cache-Control")).toBe("no-store");
  });

  it("leaves a missing binary asset to the asset store", async () => {
    const res = await get("/brand/missing.woff2", "*/*");
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toContain("text/html");
  });
});

describe("methods", () => {
  it("405s a write with problem details and an Allow header", async () => {
    const res = await get("/api/search", "*/*", "POST");
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");
    expect(res.headers.get("Content-Type")).toBe("application/problem+json; charset=utf-8");

    const body = await res.json();
    expect(body.code).toBe("method_not_allowed");
    expect(body.detail).toContain("POST");
  });

  it("answers OPTIONS with what it allows", async () => {
    const res = await get("/", "*/*", "OPTIONS");
    expect(res.status).toBe(204);
    expect(res.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");
  });

  it("HEAD carries the headers and no body", async () => {
    const res = await get("/", "text/markdown", "HEAD");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(await res.text()).toBe("");
  });
});

describe("redirects and content types", () => {
  it("redirects /gallery with a real 301", async () => {
    const res = await get("/gallery", BROWSER);
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://microcharts.dev/charts");
  });

  it("names the type of the extensionless API files", async () => {
    const res = await get("/api/search", "*/*");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  });

  it("passes a real asset through untouched", async () => {
    const res = await get("/brand/mark.svg", BROWSER);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
  });
});
