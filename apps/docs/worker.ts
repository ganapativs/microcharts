/**
 * Cloudflare Worker fronting the static-exported docs (`./out`), adding
 * `Accept: text/markdown` content negotiation per https://acceptmarkdown.com.
 *
 * It runs *only* on `/docs/*` (see `run_worker_first` in `wrangler.jsonc`); every
 * other path is served straight from the edge with no Worker cost. On a doc
 * route it inspects `Accept` and, when the client prefers Markdown, streams the
 * pre-generated `.md` mirror inline from the asset store. Browsers and
 * no-preference clients fall through to the HTML page unchanged, save for an
 * added `Vary: Accept` so shared caches key on the header.
 *
 * The static `.md` mirrors (`/docs/<slug>.md`) remain the host-agnostic
 * fallback: this Worker is a Cloudflare-only enhancement, not a dependency.
 */
import { markdownAssetFor, negotiate } from "./src/lib/content-negotiation.ts";

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

/** Append a token to an existing `Vary` header without duplicating it. */
function addVary(headers: Headers, token: string): void {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", token);
    return;
  }
  const has = existing.split(",").some((t) => t.trim().toLowerCase() === token.toLowerCase());
  if (!has) headers.set("Vary", `${existing}, ${token}`);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const isRead = request.method === "GET" || request.method === "HEAD";
    const url = new URL(request.url);
    const mdPath = isRead ? markdownAssetFor(url.pathname) : null;

    // Not a negotiable doc route → hand straight to the asset store.
    if (mdPath == null) return env.ASSETS.fetch(request);

    // Probe whether a mirror actually exists for this route.
    const mirrorURL = new URL(url);
    mirrorURL.pathname = mdPath;
    const mirror = await env.ASSETS.fetch(new Request(mirrorURL, { method: "GET" }));
    const hasMarkdown = mirror.ok;

    const decision = negotiate(request.headers.get("Accept"), hasMarkdown);

    if (decision === "markdown") {
      const headers = new Headers(mirror.headers);
      headers.set("Content-Type", "text/markdown; charset=utf-8");
      addVary(headers, "Accept");
      const body = request.method === "HEAD" ? null : mirror.body;
      return new Response(body, { status: 200, headers });
    }

    if (decision === "not-acceptable") {
      return new Response("Not Acceptable\n", {
        status: 406,
        headers: { "Content-Type": "text/plain; charset=utf-8", Vary: "Accept" },
      });
    }

    // HTML: serve the page, advertising that this URL also negotiates Markdown.
    const page = await env.ASSETS.fetch(request);
    const headers = new Headers(page.headers);
    addVary(headers, "Accept");
    // Cross-origin isolation, scoped to the one route that needs it: the
    // Quickstart embeds a StackBlitz WebContainer inline, which only runs when
    // the host document is isolated. `credentialless` keeps the blast radius
    // small (cross-origin subresources load without credentials rather than
    // being blocked); every other route stays un-isolated. A mirror of these
    // lives in public/_headers for non-Worker hosts.
    if (url.pathname === "/docs/quickstart") {
      headers.set("Cross-Origin-Opener-Policy", "same-origin");
      headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    }
    return new Response(request.method === "HEAD" ? null : page.body, {
      status: page.status,
      statusText: page.statusText,
      headers,
    });
  },
};
