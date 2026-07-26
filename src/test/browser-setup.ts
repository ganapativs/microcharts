import { beforeEach } from "vitest";
import { pointerAway } from "./pointer.js";

// Chromium re-hit-tests under a STATIONARY cursor when the DOM changes: a chart
// mounted at the viewport origin — where the pointer sits before any test moves
// it — receives a pointerenter nobody dispatched. Hover readouts were therefore
// open before a test hovered anything (CI, React 18 only: eta-bar's chip read
// "64%" where the test expected undefined). Park the cursor off-chart before
// every browser test so the enter edge is only ever the one the test asks for.
beforeEach(async () => {
  await pointerAway();
});
