// Shared helpers for the `…/interactive` client entries. This module is consumed
// by client files (which carry the 'use client' directive); like shared/motion.ts
// it doesn't declare it itself.
import type { CSSProperties } from "react";

/**
 * The composed static SVG must fill the focusable wrapper so the wrapper's box
 * and the SVG's box coincide — pointer→viewBox math and overlay marks stay
 * exact, and the chart scales fluidly with its container. Every interactive
 * entry that hit-tests against the wrapper spreads this on its inner `<svg>`.
 */
export const FILL: CSSProperties = { display: "block", width: "100%", height: "auto" };
