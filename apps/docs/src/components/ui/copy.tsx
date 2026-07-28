"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

// Literal size classes so Tailwind sees them (cnfast doesn't merge conflicts).
const SIZE = { 7: "size-7", 8: "size-8" } as const;

export function CopyButton({
  text,
  className,
  size = 8,
}: {
  text: string;
  className?: string;
  size?: 7 | 8;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
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
