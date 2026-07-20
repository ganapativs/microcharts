"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Scroll-into-view fade. All instances share one IntersectionObserver. */
type RevealCb = () => void;
let sharedIO: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, RevealCb>();

function getSharedIO(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  sharedIO ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const cb = callbacks.get(e.target);
        if (cb) {
          callbacks.delete(e.target);
          sharedIO?.unobserve(e.target);
          cb();
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
  );
  return sharedIO;
}

/**
 * In the visible viewport, widened by `pad` extra viewport-heights each way.
 * Answers `true` when the viewport can't be measured (background tab, zero-box
 * harness) — the honest failure mode is "assume it's on screen, leave it
 * visible", never "hide the page because the ruler read zero".
 */
function isNear(el: Element, pad: number): boolean {
  const vh = window.innerHeight;
  if (!vh) return true;
  const r = el.getBoundingClientRect();
  return r.bottom > -vh * pad && r.top < vh * (1 + pad);
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  deferred = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section";
  /**
   * This subtree's content arrives with JS, not with the HTML (a client
   * component that server-renders an empty or placeholder shell). Painting
   * that shell instantly buys the reader nothing and then visibly pops when
   * hydration fills it, so here the entrance is free: it *covers* the arrival
   * instead of delaying content. Opt in only when the server markup is not
   * worth reading — measure before assuming, most subtrees are fully rendered.
   */
  deferred?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  // "static" is the server-rendered rest state: fully visible, no animation.
  // First paint is therefore never gated on JS — a cold load shows content the
  // moment the HTML arrives, however slow the bundle is. The hidden "pending"
  // state is only ever applied by the client, and only where it can't be seen
  // — except for `deferred`, which has nothing worth showing until JS lands.
  const [state, setState] = useState<"static" | "pending" | "in">(deferred ? "pending" : "static");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getSharedIO();
    // No observer → fail open. Nothing is ever left hidden with no way back.
    if (!io) {
      setState("static");
      return;
    }

    const cold = document.documentElement.dataset.boot !== "warm";
    // Cold boot: the HTML has already painted. Anything on screen — or within a
    // screen's reach, in case the reader scrolled before hydration — stays
    // exactly as painted, so nothing ever visibly un-paints. Only safely
    // offscreen nodes are re-armed, which keeps the scroll reveal alive on the
    // first page without costing a millisecond of LCP.
    // Warm (SPA nav) and `deferred`: nothing readable has painted, so in-view
    // nodes animate in.
    const settled = cold && !deferred;
    if (isNear(el, settled ? 1.25 : 0)) {
      if (!settled) setState("in");
      return;
    }
    // Runs before paint, so pending→in never shows an intermediate frame.
    setState("pending");
    callbacks.set(el, () => setState("in"));
    io.observe(el);
    return () => {
      callbacks.delete(el);
      io.unobserve(el);
    };
  }, [deferred]);

  return (
    <Tag
      // @ts-expect-error polymorphic ref across the small tag union
      ref={ref}
      // See [data-reveal] rules in global.css.
      data-reveal={state}
      className={className}
      style={state === "in" && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
