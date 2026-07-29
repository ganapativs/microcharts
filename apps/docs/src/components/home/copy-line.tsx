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
 * The button keeps its width when the label changes so the row never reflows, and
 * `aria-live` sits on a separate node: swapping the accessible name of the
 * control you just activated is announced as a different control.
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
      <span aria-live="polite" className="mono-s" style={{ color: "var(--ink-3)" }}>
        {copied ? "copied" : ""}
      </span>
    </span>
  );
}
