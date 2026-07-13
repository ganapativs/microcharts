// Deterministic seeded pseudo-random. Ghost paths, drawn
// strokes, celebrate particles, and constellation layout all need "random-
// looking" offsets that are byte-identical across server render, hydration,
// and visual-test runs — so the seed derives from the data and `Math.random`
// never appears. FNV-1a seeding + mulberry32 stream: tiny, portable, and
// spec-deterministic (String(number) is identical on every engine).
import { round2 } from "./types.js";

/** 32-bit FNV-1a over the string form of each part (NUL-separated so
 *  `("a", "b")` and `("ab")` hash apart). Always a non-negative int. */
export function hashSeed(...parts: readonly (number | string)[]): number {
  let h = 0x811c9dc5;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Seeded stream of floats in [0, 1) (mulberry32). Same seed → same sequence,
 * forever — the SSR/hydration determinism contract. Accepts a raw number, a
 * string, or the data itself as an array of parts (hashed via `hashSeed`).
 */
export function seeded(seed: number | string | readonly (number | string)[]): () => number {
  let a = Array.isArray(seed) ? hashSeed(...seed) : hashSeed(seed as number | string);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `count` deterministic offsets in [−amplitude, +amplitude], 2-dp (they feed
 * viewBox coordinates directly). Offsets are layout, never data — consuming
 * charts document that a jittered position encodes nothing. `count < 1` → [];
 * non-finite or ≤ 0 amplitude → zeros (marks sit on their true position).
 */
export function jitter(
  seed: number | string | readonly (number | string)[],
  count: number,
  amplitude: number,
): number[] {
  const n = Math.floor(count);
  if (n < 1) return [];
  if (!Number.isFinite(amplitude) || amplitude <= 0) return Array.from({ length: n }, () => 0);
  const rand = seeded(seed);
  return Array.from({ length: n }, () => round2((rand() * 2 - 1) * amplitude));
}
