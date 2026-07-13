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

/** True when any part of the box is in the visible viewport (generous). */
function isInView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  return r.bottom > 0 && r.top < vh;
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  // useLayoutEffect so above-fold nodes flip pending→in before paint when
  // possible — avoids a blank hero sitting on the field gradient during the
  // route-fade + IO microtask race.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isInView(el)) {
      setShown(true);
      return;
    }
    const io = getSharedIO();
    if (!io) {
      setShown(true);
      return;
    }
    callbacks.set(el, () => setShown(true));
    io.observe(el);
    return () => {
      callbacks.delete(el);
      io.unobserve(el);
    };
  }, []);

  return (
    <Tag
      // @ts-expect-error polymorphic ref across the small tag union
      ref={ref}
      // Rendered hidden by default (SSR + first client paint) so the element
      // NEVER paints visible-then-hides — that one visible frame was the
      // "appears, gets removed, fades in" flicker. It transitions pending→in
      // only when scrolled into view. See [data-reveal] rules in global.css.
      data-reveal={shown ? "in" : "pending"}
      className={className}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
