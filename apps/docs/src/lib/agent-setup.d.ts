/**
 * Pull the agent-setup prompt out of quickstart's MDX source. Pure — takes the
 * file text, returns the fenced block's contents (trimmed). Throws if the fence
 * is missing or not closed, so a rename of the block surfaces in CI, not in a
 * silently-empty `/agent-setup.md`.
 */
export declare function extractAgentSetupPrompt(mdxSource: string): string;
/** Read the prompt from disk (build-time / test). cwd is `apps/docs`. */
export declare function getAgentSetupPrompt(): string;
