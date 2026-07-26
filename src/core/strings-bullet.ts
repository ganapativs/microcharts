// Bullet summary templates (bullet)
import type { SummaryStrings } from "./summary.js";

export type BulletStrings = Pick<SummaryStrings, "noData" | "bullet" | "bulletTarget">;

export const EN_BULLET: BulletStrings = {
  noData: "No data.",
  bullet: (value) => `${value}.`,
  bulletTarget: (value, target) => `${value} of ${target} target.`,
};
