"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Fades + rises its children once when scrolled into view. Motion is gated on
 * prefers-reduced-motion by the `.reveal` keyframe; here we just toggle it.
 *
 * All <Reveal>s share ONE IntersectionObserver (a page can hold dozens — the
 * gallery, the brand page — and an observer-per-element is needless overhead).
 * Each element registers a one-shot callback and is unobserved on first hit.
 */
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
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
  );
  return sharedIO;
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getSharedIO();
    if (!io) {
      setShown(true); // no IntersectionObserver → reveal immediately
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
      className={cn(className, shown && "reveal")}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
