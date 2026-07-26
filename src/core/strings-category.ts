// S2 categorical summary templates
import type { SummaryStrings } from "./summary.js";

// Duplicated in strings-dist/strings-quantile by design — each string module is
// its own chunk, so sharing a helper would tax every consumer's bundle.
const ordinal = (n: number): string => {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
};

export type CategoryStrings = Pick<SummaryStrings, "noData" | "categories" | "category">;

export const EN_CATEGORY: CategoryStrings = {
  noData: "No data.",
  categories: (count, maxLabel, maxValue, minLabel, minValue) =>
    `${count} ${count === 1 ? "category" : "categories"}. Highest ${maxLabel} ${maxValue}, lowest ${minLabel} ${minValue}.`,
  category: (label, value, rank, count) => `${label}: ${value} — ${ordinal(rank)} of ${count}.`,
};
