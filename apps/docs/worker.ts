/**
 * Cloudflare Worker fronting the static-exported docs (`./out`).
 *
 * The site is static HTML on a CDN; this Worker adds the four behaviours a
 * static host cannot express, all of them for the benefit of a caller that is
 * not a browser:
 *
 * 1. **Markdown negotiation** (https://acceptmarkdown.com) on every page route,
 *    not just `/docs/*` — `Accept: text/markdown` streams the pre-generated
 *    `.md` mirror from the same URL, and every negotiated response carries
 *    `Vary: Accept, Accept-Encoding` so a shared cache keys on the header.
 * 2. **Errors a caller can act on** — a 404 answers in the caller's own format:
 *    RFC 9457 problem details on the JSON surface, a short Markdown note with
 *    real links (and closest-match URLs read from `sitemap.xml`) for any other
 *    scripted client, the designed HTML page for browsers.
 * 3. **A real 301 for `/gallery`**, whose static page can only meta-refresh —
 *    a stub no non-JS client follows.
 * 4. **Honest content types on `/api/*`**, whose files are extensionless in the
 *    export and would otherwise be sniffed.
 *
 * Browsers are unaffected: same HTML, same status, two extra response headers.
 * Everything here is additive — the `.md` mirrors, `/404.md` and the static
 * `/gallery` page all keep working on a host with no Worker at all.
 */
import {
  acceptsHtml,
  errorFormat,
  isApiPath,
  markdownAssetFor,
  negotiate,
  rewritableError,
} from "./src/lib/content-negotiation.ts";
import {
  methodNotAllowed,
  notAcceptable,
  notFound,
  problemJson,
  problemMarkdown,
  suggestRoutes,
  type Problem,
} from "./src/lib/agent-errors.ts";

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const READ_METHODS = new Set(["GET", "HEAD"]);
const ALLOW = ["GET", "HEAD", "OPTIONS"];

/** Append a token to an existing `Vary` header without duplicating it. */
function addVary(headers: Headers, ...tokens: string[]): void {
  for (const token of tokens) {
    const existing = headers.get("Vary");
    if (!existing) {
      headers.set("Vary", token);
      continue;
    }
    const has = existing.split(",").some((t) => t.trim().toLowerCase() === token.toLowerCase());
    if (!has) headers.set("Vary", `${existing}, ${token}`);
  }
}

/** Advertise the OpenAPI description, per the RFC 8631 `service-desc` relation. */
function addServiceDesc(headers: Headers, origin: string): void {
  const link = `<${origin}/openapi.json>; rel="service-desc"; type="application/json"`;
  const existing = headers.get("Link");
  headers.set("Link", existing ? `${existing}, ${link}` : link);
}

/** Advertise the Markdown twin of a page route. */
function addMarkdownAlternate(headers: Headers, origin: string, mdPath: string): void {
  const link = `<${origin}${mdPath}>; rel="alternate"; type="text/markdown"`;
  const existing = headers.get("Link");
  headers.set("Link", existing ? `${existing}, ${link}` : link);
}

/** Body only on GET; a HEAD response carries the headers and nothing else. */
function bodyFor(method: string, body: BodyInit | null): BodyInit | null {
  return method === "HEAD" ? null : body;
}

/** Render a problem in the format the caller asked for. */
function problemResponse(
  problem: Problem,
  format: "json" | "markdown",
  method: string,
  origin: string,
): Response {
  const headers = new Headers();
  addVary(headers, "Accept", "Accept-Encoding");
  addServiceDesc(headers, origin);
  headers.set("Cache-Control", "no-store");
  if (problem.allow) headers.set("Allow", problem.allow.join(", "));

  const [type, body] =
    format === "json"
      ? (["application/problem+json; charset=utf-8", problemJson(problem, origin)] as const)
      : (["text/markdown; charset=utf-8", problemMarkdown(problem)] as const);
  headers.set("Content-Type", type);

  return new Response(bodyFor(method, body), { status: problem.status, headers });
}

/**
 * Every `<loc>` in the deployed sitemap, as site-relative paths, memoised for
 * the life of the isolate. Read only when a 404 needs closest-match
 * suggestions, so the common path never pays for it; a failure here costs the
 * suggestions and nothing else.
 */
let routeCache: Promise<string[]> | null = null;
function knownRoutes(env: Env, origin: string): Promise<string[]> {
  routeCache ??= env.ASSETS.fetch(new Request(`${origin}/sitemap.xml`))
    .then(async (res) => {
      if (!res.ok) return [];
      const xml = await res.text();
      return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
        try {
          return new URL(m[1]).pathname;
        } catch {
          return m[1];
        }
      });
    })
    .catch(() => []);
  return routeCache;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { origin, pathname } = url;
    const method = request.method;
    const accept = request.headers.get("Accept");

    // OPTIONS is a capability question, and the answer is the same everywhere:
    // this site is readable and nothing else.
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { Allow: ALLOW.join(", ") } });
    }

    // A write to a read-only site. Answer in JSON rather than letting the asset
    // store decide, so a caller that POSTs an endpoint learns why it failed.
    if (!READ_METHODS.has(method)) {
      const problem = methodNotAllowed({ path: pathname, origin, method, allow: ALLOW });
      // A write is never a browser navigation, so HTML is not on the menu here.
      const format = errorFormat(accept, pathname) === "markdown" ? "markdown" : "json";
      return problemResponse(problem, format, method, origin);
    }

    // `/gallery` is a legacy URL whose static page can only meta-refresh to
    // `/charts`. At the edge it can be the real redirect it always meant.
    if (pathname === "/gallery" || pathname === "/gallery/") {
      return new Response(null, {
        status: 301,
        headers: { Location: `${origin}/charts`, "Cache-Control": "public, max-age=3600" },
      });
    }

    const mdPath = markdownAssetFor(pathname);

    // Markdown was asked for by name: probe the mirror, and serve it if it exists.
    if (mdPath != null && negotiate(accept, true) === "markdown") {
      const mirrorURL = new URL(url);
      mirrorURL.pathname = mdPath;
      const mirror = await env.ASSETS.fetch(new Request(mirrorURL, { method: "GET" }));

      if (mirror.ok) {
        const headers = new Headers(mirror.headers);
        headers.set("Content-Type", "text/markdown; charset=utf-8");
        headers.set("Content-Location", mdPath);
        addVary(headers, "Accept", "Accept-Encoding");
        addServiceDesc(headers, origin);
        return new Response(bodyFor(method, mirror.body), { status: 200, headers });
      }
      // No mirror: fall through to HTML, or to the 406 below if this client
      // cannot read HTML either.
    }

    const response = await env.ASSETS.fetch(request);

    if (response.status === 404 && rewritableError(pathname)) {
      const format = errorFormat(accept, pathname);
      if (format === "html") {
        // Browsers keep the designed page; the headers still point a parser at
        // the Markdown twin of this error.
        const headers = new Headers(response.headers);
        addVary(headers, "Accept", "Accept-Encoding");
        addMarkdownAlternate(headers, origin, "/404.md");
        addServiceDesc(headers, origin);
        return new Response(bodyFor(method, response.body), { status: 404, headers });
      }

      const suggestions = suggestRoutes(pathname, await knownRoutes(env, origin)).map(
        (path) => `${origin}${path}`,
      );
      const problem = notFound({ path: pathname, origin, suggestions });
      return problemResponse(problem, format, method, origin);
    }

    // The page exists and Markdown is off the table, so HTML is what is left.
    // A client that cannot read it gets 406 — but only here, after the 404
    // check, because "no such page" is the more useful answer when both apply.
    if (mdPath != null && response.status === 200 && !acceptsHtml(accept)) {
      const problem = notAcceptable({ path: pathname, origin, accept: accept ?? "" });
      const format = errorFormat(accept, pathname) === "json" ? "json" : "markdown";
      return problemResponse(problem, format, method, origin);
    }

    const headers = new Headers(response.headers);

    // The export writes route handlers with no extension, so `/api/search` and
    // friends arrive without a usable type. Name it.
    if (isApiPath(pathname) && response.ok && !pathname.includes(".")) {
      headers.set("Content-Type", "application/json; charset=utf-8");
    }

    if (mdPath != null) {
      addVary(headers, "Accept", "Accept-Encoding");
      addServiceDesc(headers, origin);
    }

    return new Response(bodyFor(method, response.body), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
