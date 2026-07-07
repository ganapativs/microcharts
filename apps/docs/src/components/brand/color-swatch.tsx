"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A copyable colour chip for the brand page. The whole tile is the button —
 * click anywhere to copy the hex; a check flashes over the swatch. `ring` draws
 * a hairline for near-white/near-black fills that would vanish on the tile.
 */
export function ColorSwatch({
  hex,
  name,
  role,
  ring,
}: {
  hex: string;
  name: string;
  role?: string;
  ring?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(hex).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      aria-label={`Copy ${name} ${hex}`}
      className="group/sw glass glass-lift flex items-center gap-3 p-2.5 text-left"
    >
      <span
        className={cn(
          "relative grid size-11 shrink-0 place-items-center rounded-[9px]",
          ring && "ring-1 ring-inset ring-fd-border",
        )}
        style={{ background: hex }}
      >
        <Check
          className={cn(
            "size-4 text-white mix-blend-difference transition-opacity",
            copied ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
      <span className="min-w-0">
        {role && <span className="mono-label block leading-tight opacity-70">{role}</span>}
        <span className="block truncate text-sm font-medium text-fd-foreground">{name}</span>
        <span className="block font-mono text-xs uppercase tabular-nums text-fd-muted-foreground">
          {copied ? "copied" : hex}
        </span>
      </span>
    </button>
  );
}
