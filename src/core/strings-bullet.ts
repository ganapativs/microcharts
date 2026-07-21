// Bullet summary templates (bullet) — its OWN module. English lives only in
// core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type BulletStrings = Pick<SummaryStrings, "noData" | "bullet" | "bulletTarget">;

export const EN_BULLET: BulletStrings = {
  noData: "No data.",
  bullet: (value) => `${value}.`,
  bulletTarget: (value, target) => `${value} of ${target} target.`,
};
