"use client";
import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";
import { track, type CopyKind } from "@/lib/analytics";

/**
 * Idle and copied labels stacked in one grid cell, so the label box is always
 * the max of the two and confirming a copy never reflows the row. The hidden
 * half uses `visibility: hidden`, which also keeps it out of the a11y tree.
 *
 * Use this anywhere a copy control swaps its text. Icon-only controls need
 * nothing: `Copy` and `Check` share a box, and `pop-in` animates transform,
 * opacity, and blur, none of which lay out.
 */
export function CopyLabel({
  idle,
  done,
  copied,
  className,
}: {
  idle: ReactNode;
  done: ReactNode;
  copied: boolean;
  className?: string;
}) {
  return (
    <span className={cn("grid place-items-center", className)}>
      <span className={cn("col-start-1 row-start-1", copied && "invisible")}>{idle}</span>
      <span className={cn("col-start-1 row-start-1", !copied && "invisible")}>{done}</span>
    </span>
  );
}

// Literal size classes so Tailwind sees them (cnfast doesn't merge conflicts).
const SIZE = { 7: "size-7", 8: "size-8" } as const;

export function CopyButton({
  text,
  className,
  size = 8,
  analyticsKind = "code",
}: {
  text: string;
  className?: string;
  size?: 7 | 8;
  analyticsKind?: CopyKind;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          track({ name: "copy", kind: analyticsKind });
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      className={cn("ghost-ctrl", SIZE[size], className)}
    >
      {copied ? <Check className="size-4 text-fd-primary pop-in" /> : <Copy className="size-4" />}
    </button>
  );
}
