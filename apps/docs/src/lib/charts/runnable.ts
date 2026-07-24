import type { SampleData } from "./types";

/**
 * Sample-data definitions a registry snippet references but doesn't define —
 * the code a copy affordance (docs code blocks) prepends so "runnable" always
 * means the same thing.
 */
export function usedSampleData(code: string, sampleData?: SampleData[]): SampleData[] {
  return (sampleData ?? []).filter(
    (s) =>
      new RegExp(`\\b${s.name}\\b`).test(code) &&
      !new RegExp(`\\b(?:const|let|var)\\s+${s.name}\\b`).test(code),
  );
}
