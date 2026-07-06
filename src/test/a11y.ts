// Shared axe-core harness for the node/jsdom Vitest project.
// Every chart's DoD includes "axe clean" (plan/08, plan/09) — tests call
// `expectNoA11yViolations(container)` after rendering. Rules needing real
// layout/contrast belong in the browser project or Playwright + @axe-core.
import axe, { type AxeResults, type RunOptions } from "axe-core";

const DEFAULT_OPTIONS: RunOptions = {
  // jsdom has no layout/color info; keep to structure/semantics rules here.
  resultTypes: ["violations"],
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
};

export async function runA11y(
  node: Element | Document,
  options: RunOptions = {},
): Promise<AxeResults> {
  return axe.run(node, { ...DEFAULT_OPTIONS, ...options });
}

/** Throws with a readable summary if axe finds any violation. */
export async function expectNoA11yViolations(
  node: Element | Document,
  options: RunOptions = {},
): Promise<void> {
  const { violations } = await runA11y(node, options);
  if (violations.length === 0) return;
  const summary = violations
    .map((v) => `  [${v.impact ?? "n/a"}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
    .join("\n");
  throw new Error(`axe found ${violations.length} violation(s):\n${summary}`);
}
