"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { CommandLine } from "@/components/ui/command-line";

/**
 * A one-line copyable command, tokenised.
 *
 * The command is rendered by the site's shared `<CommandLine>`, the same
 * component the current home page's install well uses: the binary at full
 * strength, the verb quiet, the package on the accent. It reads as a shell command
 * instead of as a string, and — because the package is the accent — it recolours
 * with the palette like everything else on the page.
 *
 * It carries no box. A bordered pill put a third outlined rectangle in a row that
 * already had two doors in it, and the command ended up looking like the most
 * important thing in the fold — the syntax colour is enough to say "this is a
 * shell command", which is the only job the border had.
 *
 * The button keeps its width when the label changes, so the row never reflows
 * under the reader's cursor, and `aria-live` sits on a separate node rather than
 * the button label: swapping the accessible name of the element you just activated
 * is announced as a different control, which reads as though the page moved.
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
