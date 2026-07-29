"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Names every code block's scroll region.
 *
 * Fumadocs makes each code block keyboard-scrollable by rendering its viewport
 * as `<div role="region" tabIndex={0}>` — correct for `scrollable-region-focusable`,
 * but it never gives that region an accessible name. A landmark with no name is
 * announced as a bare "region", so a page with five code samples puts five
 * identical, meaningless entries in a screen reader's landmark list
 * (axe: `landmark-unique`).
 *
 * The name has to be UNIQUE, not merely present — four blocks all called "Code
 * sample" fail the same rule for the same reason. The block's caption is the
 * name where it has one; everything else is numbered by document order. Nothing
 * else survives into the DOM: Fumadocs keeps no language attribute on the
 * rendered `<pre>`, and an untitled block has no `<figcaption>` at all.
 *
 * This cannot be done in the `pre` mapping: `CodeBlock` spreads `viewportProps`
 * and then sets `role` itself, and a server-rendered `pre` has no page-wide
 * counter to make the name unique with.
 *
 * The observer is the load-bearing part. Code blocks inside tabs, steps and
 * accordions mount after hydration and REPLACE their DOM nodes, so a one-shot
 * effect labels a few regions and then watches four of them get thrown away.
 */
export function LabelCodeRegions() {
  const path = usePathname();

  useEffect(() => {
    const SELECTOR = '[role="region"].fd-scroll-container';

    /** Relabels every region in document order, so a pass is idempotent. */
    const label = () => {
      const used = new Map<string, number>();
      const regions = document.querySelectorAll<HTMLElement>(SELECTOR);
      let n = 0;
      for (const el of regions) {
        n += 1;
        const caption = el.closest("figure")?.querySelector("figcaption")?.textContent?.trim();
        const base = caption || `Code sample ${n}`;
        const seen = (used.get(base) ?? 0) + 1;
        used.set(base, seen);
        const name = seen === 1 ? base : `${base} (${seen})`;
        if (el.getAttribute("aria-label") !== name) el.setAttribute("aria-label", name);
      }
    };

    // A pass is one rAF at most and writes to a handful of nodes, so both the
    // retries and the observer can be blunt. They cover different failure modes
    // and both are needed: code blocks inside tabs and steps mount in a LATER
    // commit than the one this effect runs after, and a re-render can reuse a
    // node while dropping the attribute we set outside React. The no-op guard
    // in `label()` is what stops the attribute watch from looping.
    let queued = 0;
    const schedule = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        label();
      });
    };

    label();
    const retries = [100, 400, 1200].map((ms) => window.setTimeout(label, ms));

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "class"],
    });

    return () => {
      cancelAnimationFrame(queued);
      for (const t of retries) clearTimeout(t);
      observer.disconnect();
    };
  }, [path]);

  return null;
}
