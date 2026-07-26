"use client";

import { useLayoutEffect, type ReactNode } from "react";

/**
 * Mute `[microcharts]` `devWarn` while rendering intentional edge-case demos.
 * Happy-path / playground warnings still surface — only opt-in mounts are quiet.
 *
 * Client component so hydrate/render (and LivePreview chart swaps) stay muted;
 * a render-phase push + microtask pop covers sync child work, and a layout
 * effect holds the mute for the mount lifetime (SSR has no effects — microtask
 * alone pairs the render push).
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

function push(): void {
  if (depth === 0) install();
  depth++;
}

function pop(): void {
  depth = Math.max(0, depth - 1);
  if (depth === 0) console.warn = rawWarn;
}

export function ExpectWarn({ children }: { children: ReactNode }): ReactNode {
  push();
  queueMicrotask(pop);

  useLayoutEffect(() => {
    push();
    return () => pop();
  }, []);

  return children;
}
