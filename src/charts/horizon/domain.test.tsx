// Regression: `domain` is shared grammar — it must reach the geometry (it was
// silently dropped by the static entry once).
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Horizon } from "./index.js";

describe("Horizon domain prop", () => {
  it("changes the fold scaling", () => {
    const data = [2, 8, 4, 6];
    const free = renderToStaticMarkup(<Horizon data={data} summary={false} />);
    const fixed = renderToStaticMarkup(<Horizon data={data} domain={[0, 100]} summary={false} />);
    expect(fixed).not.toEqual(free);
  });
});
