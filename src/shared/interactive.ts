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

/**
 * Base style for a hit-testing interactive wrapper: an inline, positioned,
 * line-height-collapsed box that hugs the composed SVG (so absolute overlay
 * marks anchor to it and pointer→viewBox math stays exact).
 */
const WRAP: CSSProperties = { display: "inline-block", position: "relative", lineHeight: 0 };

/**
 * Compose the interactive wrapper's `className`/`style` from the chart's base
 * class and the consumer's overrides. Centralized so every `…/interactive`
 * entry costs one call instead of six inline lines (per-subpath size budgets):
 * spread the result onto the focusable `<span>`. Consumer `style` merges over
 * the base; `className` composes after the base class.
 */
export function wrap(
  base: string,
  className: string | undefined,
  style: CSSProperties | undefined,
): { className: string; style: CSSProperties } {
  return {
    className: className ? `${base} ${className}` : base,
    style: style ? { ...WRAP, ...style } : WRAP,
  };
}
