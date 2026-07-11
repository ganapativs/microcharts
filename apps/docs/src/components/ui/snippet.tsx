import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { AI_SNIPPETS } from "@/lib/ai-snippets";

/**
 * Renders a named code sample from `ai-snippets.ts`. Keeping the code out of MDX
 * guarantees exact indentation (MDX strips leading whitespace from code strings
 * nested in components) and lets a test assert the snippets stay valid.
 */
export function Snippet({ id }: { id: keyof typeof AI_SNIPPETS }) {
  const s = AI_SNIPPETS[id];
  if (!s) return null;
  return <DynamicCodeBlock lang={s.lang} code={s.code} />;
}
