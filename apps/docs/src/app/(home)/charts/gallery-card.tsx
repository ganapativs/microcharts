"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useClickableCard } from "@/lib/use-clickable-card";
import { CopyButton } from "@/components/ui/copy";

/**
 * Gallery plate: fully clickable (opens docs) and interactive (hover/scrub on
 * the mark).
 *
 * The link is a real `<a>` overlay (`.g2-cover`) — crawlable for SEO, shows the
 * URL in the status bar, and supports right-click "Open in new tab" / "Copy
 * link". By z-index it sits above the meta + dead plate but BELOW the raised
 * chart stage, so the interactive mark still gets hover/scrub and the cover
 * never nests the focusable chart inside the `<a>`. Clicks that land on the
 * raised stage (which the cover doesn't sit over) are handled by
 * `useClickableCard`: a short click navigates, a pointer scrub does not.
 */
export function GalleryCard({
  href,
  name,
  collection,
  tagline,
  copyText,
  children,
}: {
  href: string;
  name: string;
  collection: string;
  tagline: string;
  /** Runnable snippet (import + sample data + JSX) — collapses discovery and
   *  adoption into one trip: hover a tile, copy working code. */
  copyText?: string;
  children: ReactNode;
}) {
  const nav = useClickableCard(href);

  return (
    <div className="g2-card cursor-pointer" {...nav}>
      <Link prefetch={false} href={href} className="g2-cover" aria-label={`${name}: ${tagline}`} />
      <span className="g2-spot" aria-hidden />
      <span className="g2-arrow" aria-hidden>
        <ArrowUpRight className="size-4" />
      </span>
      {copyText ? (
        // z above the cover anchor; swallow pointer events so a copy is never
        // also a navigation (the card's clickable-area handler sees no click).
        <span
          className="g2-copy"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <CopyButton text={copyText} size={7} className="bg-fd-background/70" />
        </span>
      ) : null}
      <div className="g2-stage">{children}</div>
      <div className="g2-meta">
        <span className="g2-name">{name}</span>
        <div className="g2-subrow">
          <p className="g2-tag">{tagline}</p>
          <span className="g2-coll">{collection}</span>
        </div>
      </div>
    </div>
  );
}
