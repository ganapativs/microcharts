// Waveform summary templates (waveform) — its OWN module. The peak is always
// disclosed (honest peak-normalization); silence is a real state, not blank.
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type WaveformStrings = Pick<
  SummaryStrings,
  "noData" | "waveform" | "waveformSilent" | "waveformAt"
>;

export const EN_WAVEFORM: WaveformStrings = {
  noData: "No data.",
  waveform: (peak, pct, n) => `Peak ${peak} at ${pct} through ${n} samples.`,
  waveformSilent: "Silent.",
  waveformAt: (pct, value) => `${pct} through, peak ${value}.`,
};
