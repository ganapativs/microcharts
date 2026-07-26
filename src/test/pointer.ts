import { userEvent } from "vitest/browser";

/**
 * Park the pointer somewhere that is definitely NOT a chart.
 *
 * `userEvent.unhover(el)` doesn't move the cursor to a place of your choosing —
 * it parks it at the viewport origin. Charts in these tests render at the
 * top-left of the page, a couple of pixels below that origin, and how many
 * pixels depends on the run: whether the file imports `styles.css`, the
 * headless viewport, device pixel ratio. When the gap rounds to zero the parked
 * cursor lands back INSIDE the chart, `pointerenter` fires again, and every
 * edge-counted assertion (`onActive` reports once, then null) sees two extra
 * events. That is a flake in the harness, not in the contract — it surfaced as
 * a CI-only `expected 4 to be 2` on Bullet.
 *
 * So park on a fixed spacer pinned to the bottom-right corner instead. Leaving
 * a chart is then a real pointer move to a known element, and it can never
 * re-enter the thing it just left.
 */
export async function pointerAway(): Promise<void> {
  let spacer = document.querySelector<HTMLElement>("[data-pointer-park]");
  if (!spacer) {
    spacer = document.createElement("div");
    spacer.setAttribute("data-pointer-park", "");
    spacer.style.cssText =
      "position:fixed;right:0;bottom:0;width:48px;height:48px;z-index:2147483647";
    document.body.append(spacer);
  }
  await userEvent.hover(spacer);
}
