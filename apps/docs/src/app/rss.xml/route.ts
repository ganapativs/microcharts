import { SITE, abs } from "@/lib/site";
import { releases } from "@/lib/releases";

export const dynamic = "force-static";

/** XML-escape text content. */
function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Canonical npm page for a published version. */
function versionUrl(version: string): string {
  return `${SITE.npm}/v/${version}`;
}

/**
 * Atom feed of releases, sourced from `CHANGELOG.md` (see `lib/releases.ts`).
 * Autodiscoverable via `<link rel="alternate" type="application/atom+xml">` in
 * the root layout. Notes ship as `text` (raw changelog markdown) — semantically
 * honest and reader-safe without an HTML conversion step.
 */
export function GET(): Response {
  const items = releases();
  // Feed-level timestamp = newest release; fixed fallback avoids per-build churn.
  const updated = items[0]?.date ?? "2026-07-07";
  const feedUrl = abs("/rss.xml");

  const entries = items
    .map(
      (r) => `  <entry>
    <title>${esc(`${SITE.name} ${r.version}`)}</title>
    <id>${esc(versionUrl(r.version))}</id>
    <link rel="alternate" href="${esc(versionUrl(r.version))}"/>
    <updated>${esc(r.date)}</updated>
    <content type="text">${esc(r.notes)}</content>
    <author><name>${esc(SITE.author)}</name></author>
  </entry>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(`${SITE.name} — releases`)}</title>
  <subtitle>${esc(SITE.tagline)}</subtitle>
  <id>${esc(feedUrl)}</id>
  <link rel="self" href="${esc(feedUrl)}"/>
  <link rel="alternate" href="${esc(SITE.url)}"/>
  <updated>${esc(updated)}</updated>
  <author><name>${esc(SITE.author)}</name><uri>${esc(SITE.authorUrl)}</uri></author>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
