/** Deterministic playground series (SSR-stable, never Math.random). */
export function wave(seed: number): number[] {
  return Array.from(
    { length: 12 },
    (_, i) => 6 + Math.round(Math.sin(i * 0.9 + seed) * 5 + i * 1.4 + ((i + seed) % 3) * 3),
  );
}
