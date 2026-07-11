// Server half of the motion matrix (plan/04 §8.1 amendment): `animate` is
// inert on the server — SSR output is byte-identical with and without it,
// even when the motion engine module has been imported.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { Sparkline } from "../charts/sparkline/client.js";
import "./motion-engine.js";

const D = [4, 6, 5, 9, 7, 8, 11, 9, 13, 12];

describe("animate on the server", () => {
  it("renderToString: animate emits zero artifacts", () => {
    expect(renderToString(<Sparkline data={D} title="Rev" animate />)).toBe(
      renderToString(<Sparkline data={D} title="Rev" />),
    );
  });

  it("renderToStaticMarkup: animate emits zero artifacts", () => {
    expect(renderToStaticMarkup(<Sparkline data={D} title="Rev" animate />)).toBe(
      renderToStaticMarkup(<Sparkline data={D} title="Rev" />),
    );
  });
});
