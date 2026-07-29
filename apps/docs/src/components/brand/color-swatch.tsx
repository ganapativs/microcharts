"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";

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
          track({ name: "copy", kind: "brand" });
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      aria-label={`Copy ${name} ${hex}`}
      className="field-cell flex items-center gap-3 p-2.5 text-left"
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
        {role && <span className="kicker block">{role}</span>}
        <span
          className="mt-1.5 block truncate font-mono text-[13px] font-medium tracking-[-0.03em]"
          style={{ color: "var(--ink)" }}
        >
          {name}
        </span>
        <span className="mono-s block uppercase tabular-nums" style={{ color: "var(--ink-3)" }}>
          {copied ? "copied" : hex}
        </span>
      </span>
    </button>
  );
}
