"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";
import { track } from "@/lib/analytics";

function fetchPrompt() {
  return fetch("/agent-setup.md").then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.text();
  });
}

/**
 * One-click "copy the agent prompt" — fetches the canonical `/agent-setup.md`
 * (the single source of truth extracted from quickstart.mdx) and puts it on the
 * clipboard, so the highest-intent action for an AI-tooling visitor is a click,
 * not a URL they have to know exists.
 *
 * Safari revokes clipboard permission when the write happens after an `await`,
 * so when `ClipboardItem` accepts a Promise we hand it the in-flight fetch and
 * let the browser resolve it inside the user gesture. Older engines fall back
 * to text() + writeText (fine in Chromium/Firefox). If everything fails we
 * open the file itself — the reader still lands on the prompt.
 */
export function CopyAgentSetup({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        const blob = fetchPrompt().then((t) => new Blob([t], { type: "text/plain" }));
        await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      } else {
        await navigator.clipboard.writeText(await fetchPrompt());
      }
      track({ name: "copy", kind: "agent_setup" });
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.assign("/agent-setup.md");
    }
  };

  return (
    <button
      type="button"
      aria-label={copied ? "Copied the setup prompt" : "Copy the setup prompt"}
      className={cn("agent-prompt-copy", className)}
      onClick={() => void copy()}
    >
      {copied ? <Check className="size-4 pop-in" /> : <Copy className="size-4" />}
      {copied ? "Copied to clipboard" : "Copy setup prompt"}
    </button>
  );
}
