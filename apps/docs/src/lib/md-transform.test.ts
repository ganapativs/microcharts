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
    expect(out).toContain("```chart sparkline");
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

  it("leaves no known component tags behind on the real AI page shape", () => {
    const src = `<StreamDemo />\n<Callout type="info">hi</Callout>\n<GrammarExplorer />\n<Snippet id="map" />\n<ProviderWall />\n<SurfaceCards />`;
    const out = expandComponents(src);
    expect(out).not.toMatch(
      /<(StreamDemo|Callout|GrammarExplorer|Snippet|ProviderWall|SurfaceCards)\b/,
    );
  });
});
