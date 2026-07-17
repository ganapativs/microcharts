import { getAgentSetupPrompt } from "@/lib/agent-setup";

export const revalidate = false;
export const dynamic = "force-static";

/**
 * `/agent-setup.md` — the agent-setup prompt at a canonical, fetchable URL, so
 * it can be pasted-and-fetched, quoted in READMEs, or pointed at by a tool. The
 * body is extracted verbatim from quickstart.mdx (single source of truth), so
 * this never drifts from what the page shows and `<AgentPromptCopy>` copies.
 */
export function GET() {
  return new Response(`${getAgentSetupPrompt()}\n`, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
