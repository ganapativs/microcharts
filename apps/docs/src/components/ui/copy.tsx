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

/** The install command — mono, framed, one-click copy. */
export function InstallCommand({ command = "pnpm add @microcharts/react" }: { command?: string }) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-fd-border bg-fd-card/70 px-4 py-2.5 backdrop-blur">
      <span aria-hidden className="mono-label text-fd-primary">
        $
      </span>
      <code className="font-mono text-sm text-fd-foreground">{command}</code>
      <CopyButton text={command} className="ml-auto -mr-1.5" />
    </div>
  );
}
