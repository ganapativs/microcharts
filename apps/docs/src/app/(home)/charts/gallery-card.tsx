"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { useClickableCard } from "@/lib/use-clickable-card";

/**
 * A catalog card: fully clickable (opens the chart's page) and interactive
 * (hover/scrub on the mark).
 *
 * The link is a real `<a>` overlay (`.g2-cover`) — crawlable for SEO, shows the
 * URL in the status bar, and supports right-click "Open in new tab" / "Copy
 * link". By z-index it sits above the meta shelf but BELOW the chart stage, so
 * the interactive mark still gets hover/scrub and the cover never nests the
 * focusable chart inside the `<a>`. Clicks that land on the stage (which the
 * cover doesn't sit over) are handled by `useClickableCard`: a short click
 * navigates, a pointer scrub does not.
 *
 * The card carries no arrow, no spotlight and no rim: the surface's grammar for
 * "this is a link" is the name taking the accent, and 106 hover ornaments on one
 * page is the page.
 */
export function GalleryCard({
  href,
  name,
  collection,
  tagline,
  children,
}: {
  href: string;
  name: string;
  collection: string;
  tagline: string;
  children: ReactNode;
}) {
  const nav = useClickableCard(href);

  return (
    <div className="g2-card cursor-pointer" {...nav}>
      <Link prefetch={false} href={href} className="g2-cover" aria-label={`${name}: ${tagline}`} />
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
