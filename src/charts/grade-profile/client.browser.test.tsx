import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-react";
import type { GradeProfileStrings } from "../../core/strings-grade-profile.js";
import { GradeProfile } from "./client.js";

const TRAIL = [
  { d: 0, elev: 800 },
  { d: 100, elev: 809 },
  { d: 250, elev: 812 },
  { d: 500, elev: 835 },
  { d: 900, elev: 865 },
];

// A non-finite elevation drops BOTH segments touching it, leaving a real hole
// in x: segments run 1→50.5 and 149.5→199 at width 200, with 50.5→149.5 empty.
const HOLED = [
  { d: 0, elev: 100 },
  { d: 200, elev: 120 },
  { d: 400, elev: NaN },
  { d: 600, elev: 150 },
  { d: 800, elev: 160 },
];

const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("interactive <GradeProfile>", () => {
  it("→ roves segments; announces the true grade + cumulative climb", async () => {
    const screen = await render(
      <GradeProfile data={TRAIL} format={(n) => `${n} m`} title="Route" width={200} height={40} />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    const live = document.querySelector('[aria-live="polite"]')!;
    // first arrow lands on segment 1 (index 0): 0→100, grade 9%, cumulative climb 9 m
    await expect.poll(() => live.textContent).toBe("100 m: 9%, 9 m gained.");
    key(wrap, "ArrowRight");
    // segment 2 (index 1): 100→250, grade 2%, cumulative climb 9 + 3 = 12 m
    await expect.poll(() => live.textContent).toBe("250 m: 2%, 12 m gained.");
  });

  it("onActive reports the focused segment; null on Escape", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <GradeProfile data={TRAIL} width={200} height={40} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    expect(seen.at(-1)).toMatchObject({ index: 0, value: 9 });
    key(wrap, "Escape");
    expect(seen.at(-1)).toBeNull();
  });

  it("Enter selects the active segment: fires onSelect + pins the chord", async () => {
    const picks: unknown[] = [];
    const screen = await render(
      <GradeProfile data={TRAIL} width={200} height={40} onSelect={(d) => picks.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    key(wrap, "Enter");
    expect(picks.at(-1)).toMatchObject({ index: 0, value: 9 });
    // Pin survives blur (it is selection, not hover).
    wrap.blur();
    await expect
      .poll(() => screen.container.querySelector('line[data-mc-w="tick"]'))
      .not.toBeNull();
  });

  it("hovering a gap lands on the NEAREST segment, not the last one", async () => {
    const seen: unknown[] = [];
    const screen = await render(
      <GradeProfile data={HOLED} width={200} height={40} onActive={(d) => seen.push(d)} />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    const r = wrap.getBoundingClientRect();
    // x ≈ 90: inside the hole, and closer to segment 0's right edge (50.5) than
    // to segment 1's left edge (149.5).
    wrap.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: r.left + r.width * (90 / 200),
        clientY: r.top + r.height / 2,
      }),
    );
    await expect.poll(() => seen.at(-1)).toMatchObject({ index: 0, value: 10 });
  });

  it("datum.formatted is the localized chip text, not hand-composed English", async () => {
    // `formatted` used to be built a second time with a literal " gained", so a
    // KPI card fed from onActive read English while the chip beside it read the
    // translation.
    const strings: GradeProfileStrings = {
      noData: "Aucune donnée.",
      gradeProfile: (d, g, p, a) => `${d}, ${g} ; max ${p} à ${a}.`,
      gradeProfileFlat: (d) => `${d}, plat.`,
      gradeProfileAt: (at, grade, gain) => `${at} : ${grade}, ${gain} de dénivelé.`,
      gradeMax: (g) => `${g} max`,
    };
    const seen: { formatted?: string | undefined }[] = [];
    const screen = await render(
      <GradeProfile
        data={TRAIL}
        strings={strings}
        width={200}
        height={40}
        onActive={(d) => {
          if (d) seen.push(d);
        }}
      />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    key(wrap, "ArrowRight");
    await expect
      .poll(() => screen.container.querySelector(".mc-spark-readout")?.textContent)
      .toBe("100 : 9%, 9 de dénivelé");
    expect(seen.at(-1)!.formatted).toBe("100 : 9%, 9 de dénivelé");
  });

  it("controlled selectedIndex pins the chord without focus", async () => {
    const screen = await render(
      <GradeProfile data={TRAIL} width={200} height={40} selectedIndex={2} />,
    );
    expect(screen.container.querySelector('line[data-mc-w="tick"]')).not.toBeNull();
  });
});

// A pitch over a subnormal run overflows to Infinity, and Intl renders that as
// "∞%" rather than throwing — it reached the chip, the live region and the
// onActive payload while the summary path had gated it all along.
describe("interactive <GradeProfile> on an unrepresentable pitch", () => {
  const WALL = [
    { d: 0, elev: 0 },
    { d: Number.MIN_VALUE, elev: 1 },
    { d: 100, elev: 0 },
    { d: 200, elev: 10 },
  ];

  it("never announces or emits a non-finite grade", async () => {
    const seen: { value?: number | null }[] = [];
    const screen = await render(
      <GradeProfile
        data={WALL}
        width={200}
        height={40}
        onActive={(d) => {
          if (d) seen.push(d as { value?: number | null });
        }}
      />,
    );
    const wrap = screen.container.querySelector(".mc-grade-live") as HTMLElement;
    wrap.focus();
    wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const live = document.querySelector('[aria-live="polite"]')!;
    await expect.poll(() => live.textContent).not.toBe("");
    expect(live.textContent).not.toContain("∞");
    expect(screen.container.querySelector(".mc-spark-readout")?.textContent).not.toContain("∞");
    expect(seen.at(-1)?.value).toBeNull();
  });
});
