import type { SampleData } from "./types";

/**
 * Resolve a registry snippet into copy-runnable code: prepend the sample-data
 * definitions the snippet references but doesn't define. One implementation for
 * every copy affordance (docs code blocks, gallery tiles) so "runnable" always
 * means the same thing.
 */
export function usedSampleData(code: string, sampleData?: SampleData[]): SampleData[] {
  return (sampleData ?? []).filter(
    (s) =>
      new RegExp(`\\b${s.name}\\b`).test(code) &&
      !new RegExp(`\\b(?:const|let|var)\\s+${s.name}\\b`).test(code),
  );
}

export function resolveRunnable(code: string, sampleData?: SampleData[]): string {
  const defs = usedSampleData(code, sampleData)
    .map((s) => s.code)
    .join("\n\n");
  return defs ? `${defs}\n\n${code}` : code;
}
