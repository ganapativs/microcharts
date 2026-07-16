"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";
import { CommandLine } from "./command-line";

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
      {copied ? (
        // The check pops in on success — a small, satisfying beat on the page's
        // most-copied moment (the install command). .pop-in is reduced-motion gated.
        <Check className="size-4 text-fd-primary pop-in" />
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}

/** The install command — mono, framed, one-click copy. `not-prose` so the inner
 * <code> never inherits the docs prose inline-code chip (the nested-pill bug). */
export function InstallCommand({ command = "pnpm add @microcharts/react" }: { command?: string }) {
  return (
    <div className="command-well not-prose group flex h-10 items-center gap-2.5 pl-3.5 pr-1.5">
      <CommandLine command={command} className="min-w-0 flex-1 truncate text-sm" />
      <CopyButton text={command} size={7} className="shrink-0" />
    </div>
  );
}
