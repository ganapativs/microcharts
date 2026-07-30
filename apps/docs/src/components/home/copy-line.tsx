"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { CommandLine } from "@/components/ui/command-line";
import { track } from "@/lib/analytics";

/**
 * A one-line copyable command, tokenised by the site's shared `<CommandLine>`:
 * binary at full strength, verb quiet, package on the accent, so it recolours
 * with the palette. No box — the syntax colour already says "shell command".
 *
 * The row reserves the confirmation's box before it is shown, so clicking copy
 * moves nothing. `aria-live` sits on a separate visually-hidden node: swapping
 * the accessible name of the control you just activated is announced as a
 * different control.
 */
export function CopyLine({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard denied (insecure context, permission): the command is on
      // screen and selectable, so there is nothing to recover.
    }
    track({ name: "copy", kind: "install" });
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className={className ?? "cmd"}
        aria-label={`Copy ${text}`}
      >
        {children ?? <CommandLine command={text} className="leading-none" />}
        {copied ? (
          <Check aria-hidden className="size-3.5" style={{ color: "var(--mc-accent)" }} />
        ) : (
          <Copy aria-hidden className="size-3.5" style={{ color: "var(--ink-3)" }} />
        )}
      </button>
      {/* The confirmation reserves its box up front — width from the word, height
          pinned by `leading-none` — so the row never grows when it appears. */}
      <span
        aria-hidden
        className="mono-s leading-none transition-opacity duration-150"
        style={{ color: "var(--ink-3)", opacity: copied ? 1 : 0 }}
      >
        copied
      </span>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}
