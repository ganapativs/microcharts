/** Shared OG canvas tokens — keep `/og/default.png` and `/og/docs/*` in lockstep. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG = {
  ink: "#191712",
  muted: "#6b6659",
  paper: "#faf7f1",
  card: "#fffdf8",
  rule: "#e4ddd0",
  accent: "#2f52d4",
} as const;

export const OG_GRID_V = Array.from({ length: 25 }, (_, i) => i);
export const OG_GRID_H = Array.from({ length: 14 }, (_, i) => i);
