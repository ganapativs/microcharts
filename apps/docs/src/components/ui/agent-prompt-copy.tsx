"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Floating "copy prompt" button. Reads the sibling code block's text at click
 * time (single source of truth — no duplicated prompt string to drift). */
export function AgentPromptCopy() {
  const ref = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={copied ? "Copied prompt" : "Copy prompt"}
      className="agent-prompt-copy not-prose"
      onClick={() => {
        const pre = ref.current?.closest(".agent-prompt")?.querySelector("pre");
        const text = (pre as HTMLElement | null)?.innerText ?? "";
        if (!text) return;
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy setup prompt"}
    </button>
  );
}
