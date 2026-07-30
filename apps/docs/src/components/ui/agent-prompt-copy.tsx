"use client";

import { useRef, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { CopyLabel } from "@/components/ui/copy";
import { SITE } from "@/lib/site";
import { track } from "@/lib/analytics";

const SHORT_PROMPT = `Set up ${SITE.pkg} in this repo — follow ${SITE.url}/agent-setup.md and complete every step in order.`;

type Copied = "full" | "short" | null;

/** Full prompt from sibling code block; short = fetch pointer to /agent-setup.md. */
export function AgentPromptCopy() {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<Copied>(null);

  const copy = (text: string, which: Exclude<Copied, null>) => {
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => {
      track({ name: "copy", kind: "agent_setup" });
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
        <CopyLabel copied={copied === "full"} idle="Copy setup prompt" done="Copied" />
      </button>
      <button
        type="button"
        aria-label={copied === "short" ? "Copied short version" : "Copy short version"}
        title="One line that points a fetch-capable agent at the full prompt"
        className="agent-prompt-copy-alt"
        onClick={() => copy(SHORT_PROMPT, "short")}
      >
        {copied === "short" ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
        <CopyLabel copied={copied === "short"} idle="Copy short version" done="Copied" />
      </button>
    </div>
  );
}
