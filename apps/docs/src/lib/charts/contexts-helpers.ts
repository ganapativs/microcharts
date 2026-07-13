/** Shared generators for Four homes placement rows — distinct data per label/meta. */

export function parseContextMeta(meta: string): number {
  const s = meta.replace(/−/g, "-").replace(/,/g, "").trim();
  if (s.endsWith("%")) return parseFloat(s) / 100;
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return 1;
  let v = parseFloat(m[0]!);
  if (/k/i.test(s)) v *= 1_000;
  if (/m/i.test(s) && !/ms/i.test(s)) v *= 1_000_000;
  return v;
}

export function trendSeries(end: number, len = 8): number[] {
  if (len < 2) return [end];
  const start = end <= 1 ? end * 0.82 : end * 0.72;
  return Array.from({ length: len }, (_, i) => {
    const v = start + ((end - start) * i) / (len - 1);
    return end <= 1 ? Math.round(v * 100) / 100 : Math.round(v);
  });
}

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

export function scaleSeries(base: readonly number[], target: number): number[] {
  if (!base.length) return trendSeries(target);
  const last = base[base.length - 1]!;
  if (!last) return [...base];
  const ratio = target / last;
  return base.map((v) => (v == null ? v : Math.round(v * ratio * 100) / 100)) as number[];
}
