import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { TokenConfidence } from "./client.js";

const SENT = [
  { token: "The", confidence: 0.98 },
  { token: " Paris", confidence: 0.62 },
  { token: " guess", confidence: 0.22 },
];

describe("interactive <TokenConfidence>", () => {
  it("→ roves flagged tokens (skips confident); announces tier + confidence", async () => {
    const screen = await render(<TokenConfidence data={SENT} title="Answer" />);
    const host = screen.container.querySelector(".mc-tc-live") as HTMLElement;
    const first = host.querySelector('[tabindex="0"]') as HTMLElement;
    first.focus();
    host.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = host.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).toBe("guess: guessing, 0.22.");
  });
});

describe("interactive <TokenConfidence> children", () => {
  it("renders consumer children (the static does — the client must not drop them)", async () => {
    const screen = await render(
      <TokenConfidence data={SENT}>
        <span data-testid="annotation">note</span>
      </TokenConfidence>,
    );
    const host = screen.container.querySelector(".mc-tc-live") as HTMLElement;
    expect(host.querySelector('[data-testid="annotation"]')).not.toBeNull();
  });

  it("hover floats the tier + confidence the underline only hints at", async () => {
    const screen = await render(<TokenConfidence data={SENT} title="Answer" />);
    const host = screen.container.querySelector(".mc-tc-live") as HTMLElement;
    const guessing = host.querySelector(".mc-tc-guessing") as HTMLElement;
    const chip = () => host.querySelector(".mc-spark-readout")?.textContent;
    expect(chip()).toBeUndefined();
    await userEvent.hover(guessing);
    await expect.poll(chip).toBe("guessing 0.22");
    await userEvent.unhover(guessing);
    // leaving the host clears it
    host.dispatchEvent(new PointerEvent("pointerleave", { bubbles: false }));
    await expect.poll(chip).toBeUndefined();
  });

  it("moving onto ordinary prose clears the chip, not just leaving the host", async () => {
    // The host is a paragraph: the pointer leaves a flagged token onto plain
    // text long before it leaves the host, so clearing only on `pointerleave`
    // left the chip parked over words it was not describing.
    const screen = await render(<TokenConfidence data={SENT} title="Answer" />);
    const host = screen.container.querySelector(".mc-tc-live") as HTMLElement;
    const chip = (): string | undefined => host.querySelector(".mc-spark-readout")?.textContent;
    await userEvent.hover(host.querySelector(".mc-tc-guessing") as HTMLElement);
    await expect.poll(chip).toBe("guessing 0.22");
    // a confident token carries no `data-mc-token` — the same as bare prose
    await userEvent.hover(host.querySelector("span:not([data-mc-token])") as HTMLElement);
    await expect.poll(chip).toBeUndefined();
  });

  it("focus shows the same chip; readout={false} drops it", async () => {
    const shown = await render(<TokenConfidence data={SENT} />);
    const shownHost = shown.container.querySelector(".mc-tc-live") as HTMLElement;
    (shownHost.querySelector('[tabindex="0"]') as HTMLElement).focus();
    await expect
      .poll(() => shownHost.querySelector(".mc-spark-readout")?.textContent)
      .toBe("unsure 0.62");

    const screen = await render(<TokenConfidence data={SENT} readout={false} />);
    const host = screen.container.querySelector(".mc-tc-live") as HTMLElement;
    (host.querySelector('[tabindex="0"]') as HTMLElement).focus();
    expect(host.querySelector(".mc-spark-readout")).toBeNull();
  });

  // Decorative opt-out: the static entry already honoured `summary={false}` with
  // no title; the client named itself anyway and kept roving tab stops inside
  // what should be an ignored subtree.
  it("summary={false} with no title is decorative — no name, no tab stops", async () => {
    const screen = await render(<TokenConfidence data={SENT} summary={false} />);
    const host = screen.container.querySelector(".mc-tc-live") as HTMLElement;
    expect(host.getAttribute("aria-hidden")).toBe("true");
    expect(host.getAttribute("role")).toBeNull();
    expect(host.getAttribute("aria-label")).toBeNull();
    expect(host.querySelector("[tabindex]")).toBeNull();
    // …and a title (or an explicit summary) puts the name back.
    const named = await render(<TokenConfidence data={SENT} summary={false} title="Answer" />);
    const namedHost = named.container.querySelector(".mc-tc-live") as HTMLElement;
    expect(namedHost.getAttribute("role")).toBe("img");
    expect(namedHost.getAttribute("aria-label")).toBe("Answer");
    expect(namedHost.querySelector('[tabindex="0"]')).not.toBeNull();
  });

  // Handlers live on the host, not on every token: a streamed reply re-renders
  // once per token, so per-token bindings scale quadratically.
  it("binds no per-token listeners — focus and hover are delegated", async () => {
    const screen = await render(<TokenConfidence data={SENT} title="Answer" />);
    const host = screen.container.querySelector(".mc-tc-live") as HTMLElement;
    const flaggedTokens = [...host.querySelectorAll("[data-mc-token]")];
    expect(flaggedTokens.length).toBe(2);
    // React attaches at the root, so the props themselves are the evidence:
    // the token spans carry only identity attributes.
    for (const el of flaggedTokens) {
      const attrs = [...el.attributes].map((a) => a.name).sort();
      expect(attrs).toEqual(["data-mc-token", "id", "tabindex"]);
    }
    // Delegation still drives both paths.
    const guessing = host.querySelector(".mc-tc-guessing") as HTMLElement;
    await userEvent.hover(guessing);
    await expect
      .poll(() => host.querySelector(".mc-spark-readout")?.textContent)
      .toBe("guessing 0.22");
  });
});
