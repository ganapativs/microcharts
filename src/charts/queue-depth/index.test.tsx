import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { QueueDepth } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { seriesEdgeSuite } from "../../test/edge-cases.js";
import { expectHostsAnnotations } from "../../test/annotation-host.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const DATA = [42, 55, 70, 88, 96, 120, 150, 182, 214];
const CAP = 100;

describe("<QueueDepth>", () => {
  it("summary states depth, breach ratio, and the last-quarter trend — the real string", () => {
    const { container } = draw(<QueueDepth data={DATA} capacity={CAP} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "214 queued, 2.1× capacity, growing over the last quarter.",
    );
  });

  it("without capacity the summary drops the capacity clause", () => {
    const { container } = draw(<QueueDepth data={DATA} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "214 queued, growing over the last quarter.",
    );
  });

  it("within capacity → 'within capacity' + draining", () => {
    const { container } = draw(<QueueDepth data={[90, 70, 50, 30]} capacity={CAP} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "30 queued, within capacity, draining over the last quarter.",
    );
  });

  it("area + capacity hairline + accent top edge + negative breach spans", () => {
    const { container } = draw(<QueueDepth data={DATA} capacity={CAP} />);
    const cap = container.querySelector('line[data-mc-ink="muted"]')!;
    expect(cap.getAttribute("data-mc-w")).toBe("hair");
    expect(cap.getAttribute("stroke-dasharray")).toBe("2.5 2.5");
    const edge = container.querySelector('path[data-mc-ink="accent"]')!;
    expect(edge.getAttribute("data-mc-w")).toBe("support");
    const breach = container.querySelector('path[data-mc-ink="negative"]')!;
    expect(breach.getAttribute("data-mc-w")).toBe("full");
    // the breached endpoint dot flips to negative too
    expect(container.querySelector('circle[data-mc-ink="negative"]')).not.toBeNull();
  });

  it("label='last' shows the value + trend glyph; 'none' shows the capacity value", () => {
    const last = draw(<QueueDepth data={DATA} capacity={CAP} />).container;
    expect(last.querySelector("text")!.textContent).toBe("214▴");
    // label='none' drops the endpoint label; the capacity value takes the gutter
    const none = draw(<QueueDepth data={DATA} capacity={CAP} label="none" />).container;
    const texts = [...none.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toEqual(["100"]);
  });

  it("no capacity + label='none' → no text at all", () => {
    const { container } = draw(<QueueDepth data={DATA} label="none" />);
    expect(container.querySelector("text")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<QueueDepth data={DATA} capacity={CAP} title="Support queue" />);
    await expectNoA11yViolations(container);
  });

  it("empty data → renders the empty frame, no crash", () => {
    const { container } = draw(<QueueDepth data={[]} title="Empty" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("hosts annotations (marks drawn + clamped in frame)", () => {
    // label="none" + no capacity keeps totalWidth == width, so the containment
    // frame matches the viewBox (value labels legitimately live in a gutter).
    expectHostsAnnotations(
      (children) => (
        <QueueDepth data={DATA} label="none" width={80} height={20} summary={false}>
          {children}
        </QueueDepth>
      ),
      80,
      20,
    );
  });
});

seriesEdgeSuite("QueueDepth", (data) => <QueueDepth data={data} capacity={50} title="Queue" />);
