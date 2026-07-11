import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "@/lib/charts/registry";
import { CHOOSER_JOBS } from "./chooser";

/** The chooser must be a TOTAL partition of the catalog: every stable chart filed
 *  under exactly one question — no chart missing, none listed twice. */
describe("chart chooser taxonomy", () => {
  const filed = CHOOSER_JOBS.flatMap((j) => j.slugs);
  const catalog = STABLE_CHARTS.map((c) => c.slug);

  it("files every chart exactly once (no duplicates)", () => {
    const seen = new Set<string>();
    const dupes = filed.filter((s) => (seen.has(s) ? true : (seen.add(s), false)));
    expect(dupes, `duplicated: ${dupes.join(", ")}`).toEqual([]);
  });

  it("leaves no chart unfiled", () => {
    const filedSet = new Set(filed);
    const missing = catalog.filter((s) => !filedSet.has(s));
    expect(missing, `unfiled: ${missing.join(", ")}`).toEqual([]);
  });

  it("files no phantom slug", () => {
    const catalogSet = new Set(catalog);
    const phantom = filed.filter((s) => !catalogSet.has(s));
    expect(phantom, `not in catalog: ${phantom.join(", ")}`).toEqual([]);
  });
});
