/**
 * Error bodies an agent can act on.
 *
 * A static site's default 404 is a designed HTML page: fine for a reader,
 * useless to a script, which gets a screenful of chrome and no way to recover.
 * These builders answer the same 404 in the caller's own format — RFC 9457
 * problem details for the JSON surface, a short Markdown note with real links
 * for everything else — so a wrong URL ends in a next step rather than a dead
 * end.
 *
 * Pure and runtime-free: the Cloudflare Worker renders these at the edge, and
 * `scripts/gen-md.ts` writes the same Markdown body to `/404.md` so the
 * recovery note exists as a plain static file on any host.
 */

/** A named entry point offered to a caller that landed nowhere. */
export type ProblemLink = { title: string; href: string; note: string };

/** One error, in the shape both renderers read. */
export type Problem = {
  status: number;
  /** Stable, matchable code — `not_found`, `method_not_allowed`, … */
  code: string;
  title: string;
  detail: string;
  /** The path that produced it. */
  instance: string;
  /** What to do next, most useful first. */
  hints: string[];
  links: ProblemLink[];
  /** Real URLs on this site that look like what was asked for. */
  suggestions: string[];
  /** Set on a 405 so the response can carry a matching `Allow` header. */
  allow?: string[];
};

/** Absolute URL for a site-relative path against the origin that served it. */
function at(origin: string, path: string): string {
  return `${origin.replace(/\/+$/, "")}${path}`;
}

/**
 * The entry points every error body offers. Ordered by how much ground each one
 * covers: the docs index for a reader, `llms.txt` for an agent mapping the
 * site, then the machine surfaces.
 */
export function entryPoints(origin: string): ProblemLink[] {
  return [
    {
      title: "Documentation",
      href: at(origin, "/docs"),
      note: "Every guide and chart page, with a `.md` twin at the same URL.",
    },
    {
      title: "llms.txt",
      href: at(origin, "/llms.txt"),
      note: "One-page index of this site, written for agents.",
    },
    {
      title: "llms-full.txt",
      href: at(origin, "/llms-full.txt"),
      note: "The whole documentation set as one Markdown file.",
    },
    {
      title: "catalog.json",
      href: at(origin, "/catalog.json"),
      note: "Every chart type as JSON: import path, props, data shape.",
    },
    {
      title: "openapi.json",
      href: at(origin, "/openapi.json"),
      note: "OpenAPI 3.1 description of every machine-readable endpoint here.",
    },
    {
      title: "sitemap.xml",
      href: at(origin, "/sitemap.xml"),
      note: "Every indexable URL, with last-modified dates.",
    },
  ];
}

/** The two ways to read any page as Markdown, stated the same way everywhere. */
export const MARKDOWN_HINT =
  "Add `.md` to any page URL, or send `Accept: text/markdown`, to read it as Markdown.";

const INDEX_HINT = "Fetch /llms.txt for a one-page index of every documented URL.";
const API_HINT = "Fetch /openapi.json for the machine-readable surface of this site.";

/**
 * 404 — the path resolves to nothing. `path` is `null` for the static
 * `/404.md` twin, which is written once and cannot name the URL that missed.
 */
export function notFound(input: {
  path: string | null;
  origin: string;
  suggestions?: string[];
}): Problem {
  const { path, origin, suggestions = [] } = input;
  return {
    status: 404,
    code: "not_found",
    title: "No page at this URL",
    detail: `microcharts.dev serves nothing at ${path ?? "the URL you requested"}. The path may be misspelled, or it may never have existed.`,
    instance: path ?? "",
    hints: [
      suggestions.length > 0
        ? "One of the suggested URLs below is probably the page you want."
        : INDEX_HINT,
      MARKDOWN_HINT,
      API_HINT,
    ],
    links: entryPoints(origin),
    suggestions,
  };
}

/** 405 — the path exists, the method does not. */
export function methodNotAllowed(input: {
  path: string;
  origin: string;
  method: string;
  allow?: string[];
}): Problem {
  const { path, origin, method, allow = ["GET", "HEAD"] } = input;
  return {
    status: 405,
    code: "method_not_allowed",
    title: "This endpoint is read-only",
    detail: `${method} is not supported at ${path}. microcharts.dev is a static site: every endpoint answers ${allow.join(" and ")} and nothing else.`,
    instance: path,
    hints: [
      `Retry with ${allow[0]}.`,
      "Nothing here accepts writes. To generate or render a chart, run the MCP server: `npx -y @microcharts/mcp`.",
      API_HINT,
    ],
    links: entryPoints(origin),
    suggestions: [],
    allow,
  };
}

/** 406 — the client accepts only a type this URL cannot produce. */
export function notAcceptable(input: { path: string; origin: string; accept: string }): Problem {
  const { path, origin, accept } = input;
  return {
    status: 406,
    code: "not_acceptable",
    title: "No representation matches your Accept header",
    detail: `${path} has no Markdown twin, and your request accepts nothing else (Accept: ${accept}).`,
    instance: path,
    hints: ["Retry with `Accept: text/html` or `Accept: */*`.", MARKDOWN_HINT, INDEX_HINT],
    links: entryPoints(origin),
    suggestions: [],
  };
}

/**
 * RFC 9457 problem details, plus the members an agent actually acts on.
 *
 * `type`/`title`/`status`/`detail`/`instance` are the registered members; RFC
 * 9457 §3.2 allows extensions, so `code`, `error`, `hints`, `links` and
 * `suggestions` ride along. `error` restates code and message under the shape
 * most SDKs reach for first.
 */
export function problemJson(problem: Problem, origin: string): string {
  const body = {
    type: at(origin, "/docs/ai#errors"),
    title: problem.title,
    status: problem.status,
    detail: problem.detail,
    instance: problem.instance,
    code: problem.code,
    error: { code: problem.code, message: problem.detail },
    hints: problem.hints,
    suggestions: problem.suggestions,
    links: problem.links.map((l) => ({ rel: "related", title: l.title, href: l.href })),
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

/** The same error as a short Markdown note: a heading, what happened, where to go. */
export function problemMarkdown(problem: Problem): string {
  const lines = [`# ${problem.status} — ${problem.title.toLowerCase()}`, "", problem.detail, ""];

  if (problem.suggestions.length > 0) {
    lines.push("## Closest matches", "");
    for (const url of problem.suggestions) lines.push(`- <${url}>`);
    lines.push("");
  }

  lines.push("## Where to look next", "");
  for (const link of problem.links) lines.push(`- [${link.title}](${link.href}) — ${link.note}`);
  lines.push("", "## Notes", "");
  for (const hint of problem.hints) lines.push(`- ${hint}`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Real URLs that look like the one that missed.
 *
 * Scores each candidate on the path segments it shares with the request, so
 * `/docs/chart/sparklines` finds `/docs/charts/sparkline` and a typo in the
 * last segment still matches its neighbours. Ties break toward the shorter
 * URL, which is the more general page.
 */
export function suggestRoutes(path: string, routes: readonly string[], limit = 3): string[] {
  const wanted = tokens(path);
  if (wanted.length === 0) return [];

  const scored: { url: string; score: number }[] = [];
  for (const url of routes) {
    const candidate = tokens(url);
    if (candidate.length === 0) continue;

    let score = 0;
    for (const token of wanted) {
      score += Math.max(...candidate.map((c) => closeness(c, token)));
    }
    // The last segment carries the intent; reward matching it directly.
    const tail = wanted[wanted.length - 1];
    score += closeness(candidate[candidate.length - 1], tail);

    // The section the missing page would have lived in is always worth
    // offering: `/docs/nothing-here` has no near match, but `/docs` lists
    // everything that is there. Worth less than a matching last segment, so
    // `/docs/charts/sparklines` still ranks the chart above its shelf.
    if (path.startsWith(`${url}/`)) score += 3;

    if (score >= MIN_SCORE) scored.push({ url, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.url.length - b.url.length || (a.url < b.url ? -1 : 1))
    .slice(0, limit)
    .map((s) => s.url);
}

/** Lowercase alphanumeric path segments, split on separators and case changes. */
function tokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .split(/[^a-z0-9]+/)
    .filter((s) => s.length > 1 && s !== "http" && s !== "https" && s !== "www");
}

/**
 * The score below which a candidate is noise rather than a suggestion. On the
 * scale in `closeness`, one shared segment cannot reach it and two can.
 * Offering three bad guesses is worse than offering none, because an agent will
 * follow them.
 */
const MIN_SCORE = 7;

/**
 * How alike two path segments are: 4 identical, 3 near-exact, 2 a shared stem,
 * 0 unrelated. Graded rather than boolean so a near-exact match outranks a
 * stem one — flat scoring put `sparkbar` above `sparkline` for `sparklines`.
 *
 * Four characters is the floor, because at three every short word is one edit
 * from every other: `not` matched `net-flow` and `does` matched `dot-plot`,
 * which is how a nonsense path came back with three confident suggestions.
 */
function closeness(a: string, b: string): number {
  if (a === b) return 4;
  if (a.length < 4 || b.length < 4) return 0;
  // A missing plural or a single typo: `sparkline` for `sparklines`.
  if (a.startsWith(b) || b.startsWith(a) || editDistanceAtMostOne(a, b)) return 3;
  // Only a shared stem: `sparkbar` for `sparklines`, `theming` for `theme`.
  // Worth offering, never worth ranking above a near-exact match.
  if (a.length >= 5 && b.length >= 5 && sharedPrefix(a, b) >= 4) return 2;
  return 0;
}

/** How many leading characters `a` and `b` have in common. */
function sharedPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
}

/** True when `a` and `b` are one insertion, deletion, or substitution apart. */
function editDistanceAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (short.length === long.length) i += 1;
    j += 1;
  }
  return edits + (long.length - j) + (short.length - i) <= 1;
}
