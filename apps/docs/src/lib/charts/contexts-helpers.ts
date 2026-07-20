/** Shared generators for Four homes placement rows — distinct data per label/meta. */

export function budgetRemainingCurve(remaining: number, steps = 12): number[] {
  return Array.from(
    { length: steps },
    (_, i) => Math.round((1 - ((1 - remaining) * i) / (steps - 1)) * 100) / 100,
  );
}

export function calibrationBins(score: number) {
  const err = (1 - score) * 0.4;
  const counts = [100, 90, 80, 70, 60, 50, 40, 30, 8, 5];
  return counts.map((count, i) => {
    const predicted = Math.round((0.05 + i * 0.1) * 100) / 100;
    const bump = i === 7 ? err * 2.2 : err * (i % 2 ? 0.03 : -0.015);
    const observed = Math.max(0, Math.min(1, Math.round((predicted + bump) * 100) / 100));
    return { predicted, observed, count };
  });
}

export function confusionMatrix(accuracy: number, labels: [string, string] = ["A", "B"]) {
  const err = Math.round((1 - accuracy) * 100);
  const hit = Math.round(accuracy * 100);
  return {
    labels,
    counts: [
      [hit, err],
      [Math.max(4, err - 2), hit - 5],
    ],
  };
}

export function abArmsFromDelta(deltaMs: number, n = 80) {
  const base = 130;
  const a = Array.from({ length: n }, (_, i) => base + ((i * 13) % 44) - 22);
  const b = a.map((v) => v - deltaMs);
  return { a, b };
}

export function shiftHistogramFromDelta(deltaMs: number, n = 100) {
  const before = Array.from({ length: n }, (_, i) => 120 + (i % 40) - 20);
  const after = before.map((v) => v + deltaMs);
  return { before, after };
}

export function burnFromStatus(status: "on track" | "slipped" | "early") {
  const plan = [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0];
  if (status === "on track") return { plan, actual: [40, 35, 31, 27, 24, 21] };
  if (status === "slipped") return { plan, actual: [40, 38, 36, 34, 32, 30, 28] };
  return { plan, actual: [40, 32, 24, 16, 8] };
}

export function biasPairsFromDrift(drift: number, n = 20) {
  return Array.from({ length: n }, (_, i) => ({
    a: i + drift + (i % 3) * 0.3 - 0.4,
    b: i,
  }));
}
