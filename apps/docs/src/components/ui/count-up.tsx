"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count a number up from zero when it enters view. SSR (and any no-JS or
 * reduced-motion load) renders the final value, so the number is always correct
 * and correct-first — the animation is a pure enhancement that plays once.
 *
 * If the number sits inside a `<Reveal>` (has a `[data-reveal]` ancestor), it
 * rides that same signal instead of its own observer — so a number and, say, a
 * bar wipe in the same panel are one gesture, and the cold-load "already static"
 * case shows the final value at once (matching a wipe that doesn't animate then)
 * rather than counting from zero under a static sibling.
 */
export function CountUp({
  to,
  decimals = 0,
  suffix = "",
  durationMs = 950,
  startDelayMs = 0,
  className,
}: {
  to: number;
  decimals?: number;
  suffix?: string;
  durationMs?: number;
  startDelayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Final value first: SSR-safe, and the honest resting state.
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // keep the final value, no motion
    }

    let raf = 0;
    let delay = 0;
    const animate = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        // easeOutExpo — fast then settling, so the final value reads clearly.
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setValue(to * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
        else setValue(to);
      };
      setValue(0);
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (startDelayMs > 0) delay = window.setTimeout(animate, startDelayMs);
      else animate();
    };

    // Ride a Reveal ancestor's signal when present, so number + siblings are
    // one gesture. "in" → animate; "static" (cold, already shown) → stay final.
    const host = el.closest<HTMLElement>("[data-reveal]");
    if (host) {
      const state = host.dataset.reveal;
      if (state === "in") {
        run();
        return () => {
          clearTimeout(delay);
          cancelAnimationFrame(raf);
        };
      }
      if (state === "static") return; // already visible without motion → final
      const mo = new MutationObserver(() => {
        const s = host.dataset.reveal;
        if (s === "in") {
          mo.disconnect();
          run();
        } else if (s === "static") {
          mo.disconnect();
        }
      });
      mo.observe(host, { attributes: true, attributeFilter: ["data-reveal"] });
      return () => {
        mo.disconnect();
        clearTimeout(delay);
        cancelAnimationFrame(raf);
      };
    }

    // No Reveal ancestor: own observer.
    if (typeof IntersectionObserver === "undefined") return;
    let ran = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || ran) return;
        ran = true;
        io.disconnect();
        run();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, [to, durationMs, startDelayMs]);

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
