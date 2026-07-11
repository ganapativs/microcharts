import { describe, expect, it } from "vitest";
import { tokenizeCommand, type CommandToken } from "./command-line";

const kinds = (toks: CommandToken[]) => toks.filter((t) => t.kind !== "space").map((t) => t.kind);
const rebuild = (toks: CommandToken[]) => toks.map((t) => t.value).join("");

describe("tokenizeCommand", () => {
  it("classifies binary, verb, and package for every manager", () => {
    expect(kinds(tokenizeCommand("pnpm add @microcharts/react"))).toEqual(["bin", "verb", "pkg"]);
    expect(kinds(tokenizeCommand("npm install @microcharts/react"))).toEqual([
      "bin",
      "verb",
      "pkg",
    ]);
    expect(kinds(tokenizeCommand("yarn add @microcharts/react"))).toEqual(["bin", "verb", "pkg"]);
    expect(kinds(tokenizeCommand("bun add @microcharts/react"))).toEqual(["bin", "verb", "pkg"]);
  });

  it("classifies flags", () => {
    expect(kinds(tokenizeCommand("pnpm add -D @microcharts/react"))).toEqual([
      "bin",
      "verb",
      "flag",
      "pkg",
    ]);
  });

  it("preserves exact spacing round-trip (no lost or added whitespace)", () => {
    for (const cmd of [
      "pnpm add @microcharts/react",
      "npm  install   @microcharts/react",
      "bun add @microcharts/react",
    ]) {
      expect(rebuild(tokenizeCommand(cmd))).toBe(cmd);
    }
  });

  it("drops empty parts (no zero-width tokens)", () => {
    expect(tokenizeCommand("").length).toBe(0);
    expect(tokenizeCommand("pnpm add @microcharts/react").every((t) => t.value.length > 0)).toBe(
      true,
    );
  });
});
