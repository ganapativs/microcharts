import { describe, expect, it } from "vitest";
import { CHARTS as LIVE } from "./registry";
import generated from "./entries.generated.json";

/** `entries.generated.json` is a pure-data snapshot of the registry entries,
 *  consumed by `entries.ts` so catalog metadata never pulls the component graph.
 *  It is checked in; regenerate with `pnpm gen:entries` when entries change.
 *  This guard fails if the snapshot drifts from the live registry. */
describe("generated chart entries snapshot", () => {
  it("matches the live registry exactly (run `pnpm gen:entries` if this fails)", () => {
    expect(generated).toEqual(JSON.parse(JSON.stringify(LIVE)));
  });
});
