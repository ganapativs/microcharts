import { describe, it, expect } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { HeartbeatBlip, heartbeatSummary } from "./index.js";
import { expectNoA11yViolations } from "../../test/a11y.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);

const EVENTS = [97_000, 90_000, 80_000];

describe("<HeartbeatBlip> (plan/24 #20)", () => {
  it("summary states count, window, and time since last", () => {
    const { container } = draw(<HeartbeatBlip data={EVENTS} now={100_000} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "3 events in the last minute; last 3s ago.",
    );
  });

  it("no events → the flat (down) summary — distinct from no-data", () => {
    expect(heartbeatSummary([], { now: 100_000 })).toBe("No events in the last minute.");
  });

  it("renders a spike per event + the now dot", () => {
    const { container } = draw(<HeartbeatBlip data={EVENTS} now={100_000} />);
    expect(container.querySelector(".mc-heartbeat-spikes")).not.toBeNull();
    expect(container.querySelector(".mc-heartbeat-now")).not.toBeNull();
  });

  it("flat window renders the 'no events' shape, not a spike path", () => {
    const { container } = draw(<HeartbeatBlip data={[]} now={100_000} />);
    expect(container.querySelector(".mc-heartbeat-spikes")).toBeNull();
    expect(container.querySelector('text[data-mc-ink="muted"]')!.textContent).toBe("no events");
  });

  it('label="count" prints the event count', () => {
    const { container } = draw(<HeartbeatBlip data={EVENTS} now={100_000} label="count" />);
    expect(container.querySelector('text[data-mc-ink="label"]')!.textContent).toBe("3");
  });

  it("now defaults to the latest event", () => {
    const { container } = draw(<HeartbeatBlip data={[97_000, 90_000]} />);
    // latest = 97_000, so last-ago is 0
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBe(
      "2 events in the last minute; last 0s ago.",
    );
  });

  it("summary={false} hides it", () => {
    const { container } = draw(<HeartbeatBlip data={EVENTS} now={100_000} summary={false} />);
    expect(container.querySelector("svg")!.getAttribute("aria-label")).toBeNull();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<HeartbeatBlip data={EVENTS} now={100_000} title="Requests" />);
    await expectNoA11yViolations(container);
  });
});
