import { describe, expect, it } from "vitest";
import { expandComponents } from "./md-transform";
import { AI_SNIPPETS } from "./ai-snippets";

describe("expandComponents", () => {
  it("expands <Snippet> to the real code block", () => {
    const out = expandComponents(`<Snippet id="parse" />`);
    expect(out).toContain("```ts");
    expect(out).toContain(AI_SNIPPETS.parse.code.split("\n")[0]);
    expect(out).not.toContain("<Snippet");
  });

  it("expands <GrammarExplorer> into a text grammar reference", () => {
    const out = expandComponents(`<GrammarExplorer />`);
    expect(out).toContain("```microchart sparkline");
    expect(out).toContain("Equivalent React");
    expect(out).not.toContain("<GrammarExplorer");
  });

  it("turns <Callout> into a blockquote and drops visual-only components", () => {
    const out = expandComponents(
      `<Callout type="warn">Never ship a pie.</Callout>\n<StreamDemo />`,
    );
    expect(out).toContain("> Never ship a pie.");
    expect(out).not.toContain("<Callout");
    expect(out).not.toContain("<StreamDemo");
  });

  it("expands a <LiveDemo> code prop to a fenced block", () => {
    const out = expandComponents(
      '<LiveDemo label="x" code={`<Sparkline data={[1,2,3]} />`}>\n  <Sparkline />\n</LiveDemo>',
    );
    expect(out).toContain("```tsx");
    expect(out).toContain("<Sparkline data={[1,2,3]} />");
    expect(out).not.toContain("<LiveDemo");
  });

  const chart = {
    props: [
      { name: "value", type: "number", required: true, description: "The change." },
      { name: "positive", type: '"up" | "down"', description: "Which direction is good." },
    ],
    interactiveImport: "@microcharts/react/delta/interactive",
    example: { code: "<Delta value={0.12} />" },
  };
  const resolve = (slug: string) => (slug === "delta" ? chart : undefined);

  it("expands <PropTable> to a GFM table with escaped pipes and an animate row", () => {
    const out = expandComponents(`## Props\n\n<PropTable slug="delta" />`, resolve);
    expect(out).toContain("| Prop | Type | Description |");
    expect(out).toContain("| `value` (required) | `number` | The change. |");
    expect(out).toContain('`"up" \\| "down"`'); // pipe escaped for the table
    expect(out).toContain("| `animate` | `boolean` |"); // interactive → animate row
    expect(out).toContain("the shared grammar");
    expect(out).not.toContain("<PropTable");
  });

  it("drops <PropTable> (not the heading's neighbours) when unresolved", () => {
    const out = expandComponents(`<PropTable slug="delta" />`); // no resolver
    expect(out).not.toContain("<PropTable");
    expect(out).toBe("");
  });

  it("expands <Usage> to the import/usage snippet plus full setup", () => {
    const out = expandComponents(`## Install\n\n<Usage chart="delta" />`, resolve);
    expect(out).toContain("```tsx");
    expect(out).toContain("<Delta value={0.12} />");
    expect(out).toContain("/docs/quickstart#set-up-with-an-ai-agent");
    expect(out).toContain("/agent-setup.md");
    expect(out).not.toContain("<Usage");
  });

  it("expands a code-less <LiveDemo> (the hero) from its JSX children", () => {
    const out = expandComponents(
      '<LiveDemo label="Delta" sizeOf="delta">\n  <Delta value={0.12} />\n</LiveDemo>',
    );
    expect(out).toContain("```tsx\n<Delta value={0.12} />\n```");
    expect(out).not.toContain("<LiveDemo");
  });

  it("drops a heading emptied by a stripped visual, keeps deeper subsections", () => {
    const out = expandComponents(
      `## Try it\n\n<Playground chart="delta" />\n\n## When to use it\n\nProse.`,
    );
    expect(out).not.toContain("## Try it"); // emptied → removed
    expect(out).toContain("## When to use it");
    // a heading followed by a deeper subheading is preserved
    const nested = expandComponents(`## Section\n\n### Sub\n\nBody.`);
    expect(nested).toContain("## Section");
    expect(nested).toContain("### Sub");
  });

  it("leaves no known component tags behind on the real AI page shape", () => {
    const src = `<StreamDemo />\n<Callout type="info">hi</Callout>\n<GrammarExplorer />\n<Snippet id="map" />\n<ProviderWall />\n<SurfaceCards />`;
    const out = expandComponents(src);
    expect(out).not.toMatch(
      /<(StreamDemo|Callout|GrammarExplorer|Snippet|ProviderWall|SurfaceCards)\b/,
    );
  });
});
