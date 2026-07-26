// OrbitStatus summary templates (orbit-status) — its OWN module. Two live ambient
// variables (latency = orbit radius, rate = orbit dash density / angular speed);
// both are LOW-precision ordinal channels, so the docs steer exact reads to
// Sparkline (latency) + Delta/MiniBar (rate). Units live here (canon). Aggregate:
// core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type OrbitStatusStrings = Pick<
  SummaryStrings,
  "orbitStatus" | "orbitAlert" | "orbitUnknown" | "orbitLatency"
>;

export const EN_ORBIT_STATUS: OrbitStatusStrings = {
  // The unit belongs to this module like every other word does — the chip, the
  // in-chart label and `datum.formatted` were each pasting "ms" on inline.
  orbitLatency: (latency) => `${latency}ms`,
  orbitStatus: (latency, rate, alerted) =>
    `${latency}ms latency at ${rate} calls/s${alerted ? " — above alert threshold" : ""}.`,
  orbitAlert: (latency) => `Latency high — ${latency}ms.`,
  orbitUnknown: "Latency unknown.",
};
