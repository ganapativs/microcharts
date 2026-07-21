"use client";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { useClickableCard } from "@/lib/use-clickable-card";

/**
 * Gallery plate: fully clickable (opens docs) and interactive (hover/scrub on
 * the mark). A short click navigates; a pointer scrub does not. No nested
 * `<a>` — the plate itself is the link surface.
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
    <div className="g2-card cursor-pointer" aria-label={`${name}: ${tagline}`} {...nav}>
      <span className="g2-spot" aria-hidden />
      <span className="g2-arrow" aria-hidden>
        <ArrowUpRight className="size-4" />
      </span>
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
