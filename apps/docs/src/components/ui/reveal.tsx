import type { ReactNode } from "react";

/** Plain SSR wrapper — no client entrance (keeps first paint ungated on JS). */
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
