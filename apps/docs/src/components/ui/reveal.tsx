"use client";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Once a scroll-into-view fade, now a passthrough: sections render at rest,
 * server HTML is the finished page (2026-07 de-slop pass — entrance
 * choreography read as generated, not crafted).
 *
 * The one behavior kept is `deferred`, for a subtree whose content arrives
 * with JS (a client component that server-renders an empty shell). Painting
 * that shell instantly buys the reader nothing and then visibly pops when
 * hydration fills it, so a short opacity fade *covers* the arrival instead of
 * delaying content. Opt in only when the server markup is not worth reading.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  deferred = false,
}: {
  children: ReactNode;
  className?: string;
  /** Kept for call-site compatibility; entrance delays no longer exist. */
  delay?: number;
  as?: "div" | "li" | "section";
  deferred?: boolean;
}) {
  // "pending" is server-rendered only for deferred subtrees; everything else
  // is born visible with no reveal state at all.
  const [state, setState] = useState<"pending" | "in" | null>(deferred ? "pending" : null);

  useEffect(() => {
    if (deferred) setState("in");
  }, [deferred]);

  return (
    <Tag data-reveal={state ?? undefined} className={className}>
      {children}
    </Tag>
  );
}
