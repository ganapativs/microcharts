"use client";

import { useRef, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { SITE } from "@/lib/site";

/** The compact, web-first alternative: one line that points a fetch-capable
 *  agent at the canonical prompt. The full prompt at `/agent-setup.md` is
 *  itself self-contained, so this path still ends at the robust instructions. */
const SHORT_PROMPT = `Set up ${SITE.pkg} in this repo — follow ${SITE.url}/agent-setup.md and complete every step in order.`;

type Copied = "full" | "short" | null;

/** Two-mode copy for the setup prompt. Primary copies the full, self-contained
 * block (works on any agent, offline included) — the default. Secondary copies
 * a one-line pointer to `/agent-setup.md` for agents that can fetch. The full
 * text is read from the sibling code block at click time, so there's no
 * duplicated prompt string to drift. */
export function AgentPromptCopy() {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<Copied>(null);

  const copy = (text: string, which: Exclude<Copied, null>) => {
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1600);
    });
  };

  return (
    <div ref={ref} className="agent-prompt-actions not-prose">
      <button
        type="button"
        aria-label={copied === "full" ? "Copied prompt" : "Copy prompt"}
        className="agent-prompt-copy"
        onClick={() => {
          const pre = ref.current?.closest(".agent-prompt")?.querySelector("pre");
          copy((pre as HTMLElement | null)?.innerText ?? "", "full");
        }}
      >
        {copied === "full" ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied === "full" ? "Copied" : "Copy setup prompt"}
      </button>
      <button
        type="button"
        aria-label={copied === "short" ? "Copied short version" : "Copy short version"}
        title="One line that points a fetch-capable agent at the full prompt"
        className="agent-prompt-copy-alt"
        onClick={() => copy(SHORT_PROMPT, "short")}
      >
        {copied === "short" ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
        {copied === "short" ? "Copied" : "Copy short version"}
      </button>
    </div>
  );
}
