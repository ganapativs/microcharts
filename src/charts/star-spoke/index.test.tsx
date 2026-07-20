import { describe, it, expect, vi, afterEach } from "vitest";
import { StrictMode } from "react";
import { render } from "@testing-library/react";
import { StarSpoke, starSpokeSummary } from "./index.js";
import { EN_STAR_SPOKE } from "../../core/strings-star-spoke.js";
import { makeFormatter } from "../../core/format.js";
import { expectNoA11yViolations } from "../../test/a11y.js";
import { mappedEdgeSuite } from "../../test/edge-cases.js";

const draw = (ui: React.ReactNode) => render(<StrictMode>{ui}</StrictMode>);
const fmt = makeFormatter(undefined, undefined);

const PROFILE = [
  { label: "Speed", value: 0.9 },
  { label: "Power", value: 0.6 },
  { label: "Range", value: 0.5 },
  { label: "Cost", value: 0.3 },
  { label: "Ease", value: 0.7 },
];

afterEach(() => vi.restoreAllMocks());

describe("<StarSpoke>", () => {
  it("renders a value spoke path + a guide path summary", () => {
    const { container } = draw(<StarSpoke data={PROFILE} />);
    expect(container.querySelector('path[data-mc-ink="data"]')).not.toBeNull();
    expect(starSpokeSummary(PROFILE, EN_STAR_SPOKE, fmt)).toBe(
      "5 metrics; highest Speed (0.9), lowest Cost (0.3).",
    );
  });

  it("never renders a closed contour polygon", () => {
    const { container } = draw(<StarSpoke data={PROFILE} />);
    const paths = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d") || "");
    expect(paths.every((d) => !d.includes("Z"))).toBe(true);
  });

  it("a label that doesn't seat drops out cleanly instead of clamping into overlap", () => {
    const { container } = draw(
      <StarSpoke
        data={[
          { label: "Reliability", value: 0.9 },
          { label: "Throughput", value: 0.6 },
          { label: "Cost efficiency", value: 0.5 },
        ]}
        size={48}
      />,
    );
    const labels = [...container.querySelectorAll('text[data-mc-ink="label"]')].map(
      (t) => t.textContent,
    );
    // long labels at a small size don't all seat — none render squeezed/overlapping
    expect(labels.length).toBeLessThan(3);
  });

  it("dots render endpoint markers", () => {
    const { container } = draw(<StarSpoke data={PROFILE} dots="tips" size={64} />);
    expect(container.querySelector('path[style*="--mc-accent"]')).not.toBeNull();
  });

  it("compare draws a ghost baseline", () => {
    const { container } = draw(<StarSpoke data={PROFILE} compare={[0.5, 0.5, 0.5, 0.5, 0.5]} />);
    expect(container.querySelector('path[data-mc-ink="ghost"]')).not.toBeNull();
  });

  it("fewer than 3 metrics warns", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    draw(
      <StarSpoke
        data={[
          { label: "a", value: 0.5 },
          { label: "b", value: 0.8 },
        ]}
      />,
    );
    expect(warn).toHaveBeenCalled();
  });

  it("is axe-clean", async () => {
    const { container } = draw(<StarSpoke data={PROFILE} title="Product profile" />);
    await expectNoA11yViolations(container);
  });

  describe("degenerate values", () => {
    it("an unmeasured metric can't be an extreme, but still counts", () => {
      expect(
        starSpokeSummary(
          [{ label: "Speed", value: null as unknown as number }, ...PROFILE.slice(1)],
          EN_STAR_SPOKE,
          fmt,
        ),
      ).toBe("5 metrics; highest Ease (0.7), lowest Cost (0.3).");
    });

    it("nothing measured reads as no data, never as NaN or ∞", () => {
      expect(
        starSpokeSummary(
          PROFILE.map((d) => ({ ...d, value: null as unknown as number })),
          EN_STAR_SPOKE,
          fmt,
        ),
      ).toBe("No data.");
      expect(
        starSpokeSummary(
          PROFILE.map((d) => ({ ...d, value: Number.NaN })),
          EN_STAR_SPOKE,
          fmt,
        ),
      ).toBe("No data.");
    });

    it("all-unmeasured still draws the guide scaffold — empty is visible", () => {
      const { container } = draw(
        <StarSpoke data={PROFILE.map((d) => ({ ...d, value: null as unknown as number }))} />,
      );
      expect(container.querySelector('path[data-mc-ink="muted"]')!.getAttribute("d")).not.toBe("");
    });
  });
});

// `value` is typed `number`, but an unmeasured metric is a real state. The
// previous spelling of this suite laundered every gap into `value: 0` before the
// chart saw it, which hid the `toPrecision` crash and drew "no data" as zero.
mappedEdgeSuite(
  "StarSpoke",
  (v, i) => ({ label: `m${i}`, value: v as number }),
  (data) => <StarSpoke data={data} domain={[0, 1]} title="Edge" />,
);
