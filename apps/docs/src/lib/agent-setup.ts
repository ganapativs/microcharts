/**
 * The agent-setup prompt has ONE source of truth: the fenced ```md block under
 * `## Set up with an AI agent` in `content/docs/quickstart.mdx`. That block is
 * what `<AgentPromptCopy>` copies (read from the DOM) and what the docs render
 * with syntax highlighting.
 *
 * This module extracts that same block so `/agent-setup.md` can serve it at a
 * canonical, fetchable URL — byte-identical to the page, no second copy to
 * drift. `agent-setup.test.ts` gates the extraction and cross-checks every URL
 * and shared-prop name the prompt names against the real surfaces.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Opener of the prompt fence in quickstart.mdx — matched verbatim so we can
 *  never grab a different code block by accident. */
const FENCE_OPEN = '```md title="Paste into your agent"';

/**
 * Pull the agent-setup prompt out of quickstart's MDX source. Pure — takes the
 * file text, returns the fenced block's contents (trimmed). Throws if the fence
 * is missing or not closed, so a rename of the block surfaces in CI, not in a
 * silently-empty `/agent-setup.md`.
 */
export function extractAgentSetupPrompt(mdxSource: string): string {
  const open = mdxSource.indexOf(FENCE_OPEN);
  if (open === -1)
    throw new Error(`agent-setup: fence \`${FENCE_OPEN}\` not found in quickstart.mdx`);
  const bodyStart = mdxSource.indexOf("\n", open) + 1;
  const close = mdxSource.indexOf("\n```", bodyStart);
  if (close === -1) throw new Error("agent-setup: prompt fence is never closed");
  return mdxSource.slice(bodyStart, close).trim();
}

/** Read the prompt from disk (build-time / test). cwd is `apps/docs`. */
export function getAgentSetupPrompt(): string {
  const src = readFileSync(resolve(process.cwd(), "content/docs/quickstart.mdx"), "utf8");
  return extractAgentSetupPrompt(src);
}
