import type { ReactNode } from "react";

/**
 * Mute `[microcharts]` `devWarn` while rendering intentional edge-case demos.
 * Happy-path / playground warnings still surface — only opt-in mounts are quiet.
 *
 * Unmute is deferred to a microtask so React can finish rendering `children`
 * (function components complete — including `finally` — before child work).
 */
let depth = 0;
const rawWarn = console.warn.bind(console);

function install(): void {
  console.warn = (...args: unknown[]) => {
    if (depth > 0 && typeof args[0] === "string" && args[0].startsWith("[microcharts]")) {
      return;
    }
    rawWarn(...(args as Parameters<typeof console.warn>));
  };
}

function release(): void {
  depth = Math.max(0, depth - 1);
  if (depth === 0) console.warn = rawWarn;
}

export function ExpectWarn({ children }: { children: ReactNode }): ReactNode {
  if (depth === 0) install();
  depth++;
  queueMicrotask(release);
  return children;
}
