// Shared motion primitives for the animated ("motion IS the encoding") charts
// Client-only hooks: they
// touch matchMedia / IntersectionObserver only inside effects, so importing this
// from a client entry is SSR-safe. Every motion chart gates its WAAPI animation
// on BOTH signals below — reduced-motion off, and on-screen — so an off-viewport
// or reduced-motion reader gets the static frame, never a running loop.
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * `true` when the user asked for reduced motion (live-updating).
 *
 * `matchMedia` is an external store, so it is read as one. Seeding `false` and
 * correcting it in a mount effect meant a reader who asked for reduced motion
 * still got one committed frame of the animated state before the correction
 * landed — and it is the cascading render `set-state-in-effect` names. The
 * server snapshot stays `false`: there is no media query to ask.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
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

/**
 * `true` for `ms` after `key` changes — the one-shot "the value just moved"
 * flash (Delta's numeral, TrendArrow's glyph), off on mount and off again once
 * the window passes.
 *
 * The obvious shape is an effect that watches `key` and calls `setPulse(true)`,
 * and that is a cascading render: the pulse is DERIVED from "has the beat this
 * render been cleared yet", so it is derived during render. The only state the
 * effect owns is the expiry, which it sets from inside the timeout — after the
 * frame, not during it.
 */
export function usePulseOnChange(key: unknown, live: boolean, ms = 450): boolean {
  const [beat, setBeat] = useState(0);
  const [seen, setSeen] = useState(key);
  const [cleared, setCleared] = useState(0);
  if (!Object.is(seen, key)) {
    setSeen(key);
    if (live) setBeat((b) => b + 1);
  }
  useEffect(() => {
    if (beat === cleared) return;
    const t = setTimeout(() => setCleared(beat), ms);
    return () => clearTimeout(t);
  }, [beat, cleared, ms]);
  return beat !== cleared;
}
