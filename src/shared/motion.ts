// Shared motion primitives for the animated ("motion IS the encoding") charts
// Client-only hooks: they
// touch matchMedia / IntersectionObserver only inside effects, so importing this
// from a client entry is SSR-safe. Every motion chart gates its WAAPI animation
// on BOTH signals below — reduced-motion off, and on-screen — so an off-viewport
// or reduced-motion reader gets the static frame, never a running loop.
import { useEffect, useRef, useState, type RefObject } from "react";

/** `true` when the user asked for reduced motion (live-updating). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (): void => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// One IntersectionObserver shared by every motion chart on the page (canon).
// Elements register a setter; the observer flips it as they enter/leave the
// viewport.
let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, (visible: boolean) => void>();

function observer(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) callbacks.get(e.target)?.(e.isIntersecting);
      },
      { threshold: 0 },
    );
  }
  return sharedObserver;
}

/**
 * Ref + on-screen flag via the shared observer. Starts `true` so the very first
 * paint (and any non-observing environment) animates; the observer corrects it.
 */
export function useInViewport<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = observer();
    callbacks.set(el, setInView);
    io.observe(el);
    return () => {
      io.unobserve(el);
      callbacks.delete(el);
    };
  }, []);
  return [ref, inView];
}
