/**
 * `Accept` negotiation, per https://acceptmarkdown.com — the same URL serves
 * HTML to browsers and the pre-generated Markdown mirror to agents that ask for
 * it, with no separate URL or redirect. Every page route negotiates, not just
 * `/docs/*`: `/` mirrors to `/index.md`, `/charts` to `/charts.md`.
 *
 * Pure and runtime-free so it unit-tests in the node project; the Cloudflare
 * Worker (`worker.ts`) is the only place that touches the network. The static
 * `.md` mirrors (`scripts/gen-md.ts`) remain the universal, host-agnostic
 * fallback — negotiation is an additive edge concern layered on top of them.
 */

/** One parsed `Accept` token with its resolved quality and match specificity. */
type Match = {
  /** Quality value in [0, 1]; 0 means "not acceptable". */
  q: number;
  /** 2 = exact `type/subtype`, 1 = `type/<star>`, 0 = full wildcard, -1 = no match. */
  spec: number;
};

/**
 * Resolve the effective quality for `target` (e.g. `text/markdown`) against an
 * `Accept` header, honouring q-values and wildcards. Picks the most specific
 * matching range; ties break toward the higher q. A missing header means the
 * client expressed no preference — treated as a full wildcard (`q=1`, `spec=0`).
 */
export function matchAccept(header: string | null | undefined, target: string): Match {
  const [tType, tSub] = target.split("/");
  if (header == null || header.trim() === "") return { q: 1, spec: 0 };

  let best: Match = { q: 0, spec: -1 };
  for (const part of header.split(",")) {
    const [rangeRaw, ...params] = part.trim().split(";");
    const range = rangeRaw.trim().toLowerCase();
    if (!range) continue;

    const [rType, rSub] = range.split("/");
    let spec: number;
    if (rType === tType && rSub === tSub) spec = 2;
    else if (rType === tType && rSub === "*") spec = 1;
    else if (rType === "*" && rSub === "*") spec = 0;
    else continue;

    // q defaults to 1 when absent; a malformed q is treated as 1.
    let q = 1;
    for (const p of params) {
      const m = p.trim().match(/^q=(.*)$/i);
      if (m) {
        const v = Number.parseFloat(m[1]);
        q = Number.isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
      }
    }

    if (spec > best.spec || (spec === best.spec && q > best.q)) best = { q, spec };
  }
  return best;
}

export type Negotiation = "markdown" | "html" | "not-acceptable";

/**
 * Decide what a page route should serve for a given `Accept` header.
 *
 * - `markdown` — the client prefers Markdown and a mirror exists.
 * - `html` — the default; browsers and no-preference clients land here.
 * - `not-acceptable` — the client accepts *only* Markdown but none exists → 406.
 *
 * Markdown wins only on an explicit, at-least-as-strong signal: a higher q than
 * HTML, or an equal q matched more specifically (so a bare `text/markdown` beats
 * a wildcard, while a full wildcard — curl's default — stays on HTML).
 */
export function negotiate(accept: string | null | undefined, hasMarkdown: boolean): Negotiation {
  const md = matchAccept(accept, "text/markdown");
  const html = matchAccept(accept, "text/html");

  const wantsMd = md.q > 0 && (md.q > html.q || (md.q === html.q && md.spec > html.spec));
  if (!wantsMd) return "html";
  if (hasMarkdown) return "markdown";
  return html.q > 0 ? "html" : "not-acceptable";
}

/**
 * Would this client accept the HTML representation?
 *
 * Asked only once Markdown has been ruled out and the page is known to exist,
 * because HTML is then the only thing left to send. A client that gives
 * `text/html` a zero quality — by naming another type and no wildcard, or by
 * `text/html;q=0` — has nothing to receive, and RFC 9110 §15.5.7 says to answer
 * 406 rather than send something it said it could not read.
 */
export function acceptsHtml(accept: string | null | undefined): boolean {
  return matchAccept(accept, "text/html").q > 0;
}

/** Trees that never carry a Markdown twin: build output, API surface, images. */
const NO_MIRROR = ["/_next/", "/api/", "/og/", "/.well-known/"];

/**
 * Map a clean page route to its `.md` mirror asset path, or `null` when the path
 * cannot have one — a build/API/image tree, or an already-concrete file such as
 * `…/sparkline.md` or `…/catalog.json`.
 *
 * Mirrors `mirrorFor` in `gen-md.ts`: `/` → `/index.md`, `/docs` → `/docs.md`,
 * `/docs/charts/sparkline` → `/docs/charts/sparkline.md`. Whether the mirror
 * actually exists is decided by probing the asset store, not by a list here —
 * one less thing to keep in sync with the generator.
 */
export function markdownAssetFor(pathname: string): string | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (NO_MIRROR.some((p) => path === p.slice(0, -1) || path.startsWith(p))) return null;
  if (path === "/" || path === "") return "/index.md";
  const last = path.slice(path.lastIndexOf("/") + 1);
  if (last.includes(".")) return null; // already a file (.md/.txt/.json/…)
  return `${path}.md`;
}

/**
 * Is this path part of the JSON API surface (`/api/*` and the `.json`
 * documents)? Those answer in JSON when they succeed, so they answer in JSON
 * when they fail — an HTML error page there is unparseable to the caller.
 */
export function isApiPath(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return path === "/api" || path.startsWith("/api/") || path.endsWith(".json");
}

export type ErrorFormat = "json" | "markdown" | "html";

/**
 * Pick the representation for an *error* response.
 *
 * Deliberately more forward than {@link negotiate}: a successful page keeps the
 * strict acceptmarkdown reading, where a bare full wildcard gets HTML, because
 * there is a designed page to serve. An error has no page worth serving to a
 * non-browser, so a client that never names `text/html` — a wildcard, a type
 * wildcard, or no header at all, which is every scripted client — gets the
 * Markdown recovery body instead of a screenful of chrome. The status code is
 * identical either way; only the body changes.
 */
export function errorFormat(accept: string | null | undefined, pathname: string): ErrorFormat {
  if (isApiPath(pathname)) return "json";

  const json = matchAccept(accept, "application/json");
  const md = matchAccept(accept, "text/markdown");
  const html = matchAccept(accept, "text/html");

  if (json.spec === 2 && json.q > 0 && json.q >= html.q && json.q >= md.q) return "json";
  if (md.spec === 2 && md.q > 0 && md.q >= html.q) return "markdown";
  // No explicit `text/html` in the header means no browser is reading this.
  return html.spec === 2 && html.q > 0 ? "html" : "markdown";
}

/**
 * Extensions whose 404 body is worth rewriting. A missing `.png` or `.woff2` is
 * answered by the asset store untouched — a Markdown recovery note in an
 * `<img>` slot helps nobody, and the status code already carries the message.
 */
const REWRITABLE = new Set(["md", "txt", "json", "html", "htm", "mdx", "xml", "yaml", "yml"]);

/** Should a 404 for this path carry an agent-readable body? */
export function rewritableError(pathname: string): boolean {
  const last = pathname.slice(pathname.lastIndexOf("/") + 1);
  if (!last.includes(".")) return true; // a page route
  const ext = last.slice(last.lastIndexOf(".") + 1).toLowerCase();
  return REWRITABLE.has(ext);
}
