import { userEvent } from "vitest/browser";

/**
 * Park pointer off-chart (bottom-right spacer). `userEvent.unhover` parks at the
 * viewport origin — charts render near top-left, so the cursor can re-enter and
 * double-fire edge-counted `onActive` (CI flake: expected 4 to be 2).
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
