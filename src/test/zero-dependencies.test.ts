// "Zero runtime dependencies, CI-enforced" is a promise the README, the
// homepage receipts strip and the quickstart all make. Nothing asserted it —
// the rule lived in a contributor guide, which is exactly the kind of promise
// that rots the first time someone reaches for a helper package. This makes it
// mechanical: `dependencies` must not exist, and React stays a peer.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../package.json"), "utf8"),
) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

describe("the package has zero runtime dependencies", () => {
  it("declares no `dependencies` key at all", () => {
    expect(pkg.dependencies).toBeUndefined();
  });

  it("keeps React a peer, never a dependency", () => {
    expect(Object.keys(pkg.peerDependencies ?? {})).toEqual(["react"]);
  });
});
