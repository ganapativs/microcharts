import type { ReactNode } from "react";

/**
 * Once a scroll-into-view fade, now a plain wrapper element: sections render at
 * rest, server HTML is the finished page (2026-07 de-slop pass — entrance
 * choreography read as generated, not crafted).
 *
 * Nothing here hides anything, ever, and it is deliberately NOT a client
 * component: a wrapper that waits for hydration to become visible gates first
 * paint on the JS download. The last holdout was the hero's stream panel
 * (`deferred`), removed 2026-07-26 — its server markup is the panel frame at
 * its final size, which is worth painting immediately even though the reply
 * types in after hydration.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Kept for call-site compatibility; entrance delays no longer exist. */
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  return <Tag className={className}>{children}</Tag>;
}
