import type { ReactNode } from "react";
import Link from "next/link";
import type { TrustPage } from "@/lib/trust-pages";
import { SITE } from "@/lib/site";

/**
 * Renders a `TrustPage` — `/contact` and `/privacy`.
 *
 * The copy lives in `lib/trust-pages.ts` because the Markdown twins serialize
 * from the same structures. That means the prose arrives as text with a small
 * Markdown subset in it, and this file is the renderer for that subset:
 * `[label](href)`, `` `code` ``, and `**bold**`. Nothing else is supported, and
 * anything unmatched renders as the literal text it is.
 */

/** One `[label](href)`, `` `code` `` or `**bold**` run, and the text between. */
const INLINE = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;

/** A link to this site renders as a client-side navigation; anything else opens out. */
function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  const internal = href.startsWith("/")
    ? href
    : href.startsWith(SITE.url)
      ? href.slice(SITE.url.length) || "/"
      : null;

  if (internal) {
    return (
      <Link prefetch={false} href={internal} className="ulink">
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="ulink">
      {children}
    </a>
  );
}

export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE)) {
    const index = match.index;
    if (index > last) nodes.push(text.slice(last, index));

    const [raw, label, href, code, bold] = match;
    if (label && href) {
      nodes.push(
        <InlineLink key={(key += 1)} href={href}>
          {label}
        </InlineLink>,
      );
    } else if (code) {
      nodes.push(
        <code key={(key += 1)} className="font-mono text-[0.86em] text-[var(--ink)]">
          {code}
        </code>,
      );
    } else if (bold) {
      nodes.push(<strong key={(key += 1)}>{bold}</strong>);
    }
    last = index + raw.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function ProseDoc({ page }: { page: TrustPage }) {
  return (
    <div className="act act-open">
      <div className="shell grid gap-10">
        <header className="grid gap-4">
          <h1 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
            {page.title}
          </h1>
          <p className="lead u-lede" style={{ maxWidth: "var(--m-lead)" }}>
            {page.intro}
          </p>
        </header>

        {page.sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id} className="grid gap-3">
            <h2 id={section.id} className="h3" style={{ maxWidth: "var(--m-head)" }}>
              {section.heading}
            </h2>
            {section.blocks.map((block) =>
              "p" in block ? (
                <p key={block.p} className="prose" style={{ maxWidth: "var(--m-prose)" }}>
                  {renderInline(block.p)}
                </p>
              ) : (
                <ul
                  key={block.list[0]}
                  className="grid list-disc gap-2 pl-5"
                  style={{ maxWidth: "var(--m-prose)" }}
                >
                  {block.list.map((item) => (
                    <li key={item} className="prose">
                      {renderInline(item)}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
