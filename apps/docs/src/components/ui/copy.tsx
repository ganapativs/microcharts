"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export function CopyButton({ text, className }: { text: string; className?: string }) {
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
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground",
        className,
      )}
    >
      {copied ? <Check className="size-4 text-fd-primary" /> : <Copy className="size-4" />}
    </button>
  );
}

/** The install command — mono, framed, one-click copy. `not-prose` so the inner
 * <code> never inherits the docs prose inline-code chip (the nested-pill bug). */
export function InstallCommand({ command = "pnpm add @microcharts/react" }: { command?: string }) {
  return (
    <div className="not-prose group flex items-center gap-2.5 rounded-lg border border-fd-border bg-fd-muted/40 py-2.5 pl-3.5 pr-2">
      <code className="min-w-0 flex-1 truncate font-mono text-sm leading-6 text-fd-foreground">
        <span aria-hidden className="mr-2 select-none text-fd-primary">
          $
        </span>
        {command}
      </code>
      <CopyButton text={command} className="shrink-0" />
    </div>
  );
}
