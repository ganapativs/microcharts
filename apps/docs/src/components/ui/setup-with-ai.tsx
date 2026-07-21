import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

/** Canonical install door — package + stylesheet via the AI-first quickstart. */
export const SETUP_HREF = "/docs/quickstart#set-up-with-an-ai-agent";

const LABEL = "Set up with AI";

/**
 * One accent convert action site-wide. `button` = hero/CTA, `chip` = gallery
 * dock, `link` = Usage footnote / quiet strips.
 */
export function SetupWithAi({
  variant = "button",
  className,
  showArrow = variant === "button",
}: {
  variant?: "button" | "chip" | "link";
  className?: string;
  showArrow?: boolean;
}) {
  if (variant === "chip") {
    return (
      <Link
        prefetch={false}
        href={SETUP_HREF}
        className={cn("g2-setup-chip", className)}
        title={LABEL}
        aria-label={LABEL}
      >
        <Sparkles className="size-3.5 shrink-0" aria-hidden />
        <span className="g2-setup-chip-label">{LABEL}</span>
      </Link>
    );
  }

  if (variant === "link") {
    return (
      <Link
        prefetch={false}
        href={SETUP_HREF}
        className={cn(
          "group inline-flex items-center gap-1.5 text-xs font-medium text-fd-primary transition-colors hover:text-fd-foreground",
          className,
        )}
      >
        <Sparkles className="size-3.5 shrink-0" aria-hidden />
        {LABEL}
        <ArrowRight
          className="size-3 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    );
  }

  return (
    <Link
      prefetch={false}
      href={SETUP_HREF}
      className={cn(
        "cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <Sparkles className="size-4" aria-hidden />
      {LABEL}
      {showArrow ? (
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}
