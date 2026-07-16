/**
 * `Accept: text/markdown` content negotiation, per https://acceptmarkdown.com —
 * the same doc URL serves HTML to browsers and the pre-generated Markdown mirror
 * to agents that ask for it, with no separate URL or redirect.
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
 * Decide what a doc route should serve for a given `Accept` header.
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
 * Map a clean doc route to its `.md` mirror asset path, or `null` when the path
 * is not a negotiable doc route (non-`/docs`, or already a concrete file such as
 * `…/sparkline.md` / `…/catalog.json`). Mirrors `mirrorFor` in `gen-md.ts`:
 * `/docs` → `/docs.md`, `/docs/charts/sparkline` → `/docs/charts/sparkline.md`.
 */
export function markdownAssetFor(pathname: string): string | null {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (path !== "/docs" && !path.startsWith("/docs/")) return null;
  const last = path.slice(path.lastIndexOf("/") + 1);
  if (last.includes(".")) return null; // already a file (.md/.txt/.json/…)
  return `${path}.md`;
}
