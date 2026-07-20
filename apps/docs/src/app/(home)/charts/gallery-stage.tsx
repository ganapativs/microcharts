"use client";
// The motion engine registers once (import-once side effect) and must be present
// before any interactive twin mounts — so it stays a static import (never
// dynamic-imported). It carries no chart code, so it doesn't weigh on the graph.
import "@microcharts/react/motion";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { PREVIEW_LIVE } from "@/lib/charts/preview-live.generated";
import { getGalleryMode, subscribeGalleryMode } from "./gallery-mode";

// ONE MediaQueryList and one shared IntersectionObserver for the whole plane.
// The gallery mounts a stage per card — 106 of them — so anything allocated in
// the component body is allocated 106 times. Both `subscribe` and `getSnapshot`
// must also be module-level constants: an inline arrow is a new identity every
// render, which makes React tear down and re-create all 106 subscriptions on
// every render pass.
const REDUCE_MQ =
  typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

function subscribeReduce(onStoreChange: () => void): () => void {
  REDUCE_MQ?.addEventListener("change", onStoreChange);
  return () => REDUCE_MQ?.removeEventListener("change", onStoreChange);
}
const getReduce = () => REDUCE_MQ?.matches ?? true;
const getReduceServer = () => true;

function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduce, getReduce, getReduceServer);
}

/** Shared "near the viewport" observer — one instance for all 106 cards. */
type SeenCb = () => void;
let sharedIO: IntersectionObserver | null = null;
const seenCallbacks = new WeakMap<Element, SeenCb>();

function observeOnce(el: Element, cb: SeenCb): () => void {
  if (typeof IntersectionObserver === "undefined") {
    cb();
    return () => {};
  }
  sharedIO ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const fn = seenCallbacks.get(e.target);
        if (!fn) continue;
        seenCallbacks.delete(e.target);
        sharedIO?.unobserve(e.target);
        fn();
      }
    },
    { rootMargin: "200px" },
  );
  seenCallbacks.set(el, cb);
  sharedIO.observe(el);
  return () => {
    seenCallbacks.delete(el);
    sharedIO?.unobserve(el);
  };
}

/**
 * Gallery card stage — live (interactive + animate) by default; static on toggle
 * or reduced motion. The static preview (`children`) is rendered on the SERVER as
 * pure SVG, so the gallery's initial client graph carries zero interactive/motion
 * chart code. When live mode is on, after mount, the matching interactive preview
 * streams in as its own chunk (per-slug lazy `import()`) and swaps in over the
 * identical box — the entrance animates once, with no layout shift. Toggling back
 * to static drops to `children`; reduced motion never upgrades.
 */
export function GalleryStage({ slug, children }: { slug: string; children: ReactNode }) {
  const [Live, setLive] = useState<ComponentType | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  const mode = useSyncExternalStore(subscribeGalleryMode, getGalleryMode, () => "live" as const);
  const reduce = useReducedMotion();
  const wantLive = mode === "live" && !reduce;

  // Upgrade only once the card has been near the viewport — 106 tiles fetching
  // their interactive twins at mount would flood the load window; offscreen
  // cards stay pure server SVG until scrolled toward.
  useEffect(() => {
    if (!host || seen) return;
    return observeOnce(host, () => setSeen(true));
  }, [host, seen]);

  useEffect(() => {
    if (!wantLive || !seen || Live) return;
    const load = PREVIEW_LIVE[slug];
    if (!load) return;
    let cancelled = false;
    // The interactive twin streams in AFTER the card is visible, per-chart — the
    // server has already painted the static preview, so nothing blocks paint.
    void load().then((m) => {
      if (!cancelled) setLive(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, [wantLive, seen, Live, slug]);

  // Hold the server-rendered static preview through SSR + first paint (so
  // hydration matches) and whenever live is off; mount the live twin only once
  // it has streamed in, so its entrance animates on mount. The zero-size
  // sentinel is the IntersectionObserver target (the stage itself has no
  // single wrapper box).
  return (
    <>
      <span ref={setHost} aria-hidden />
      {wantLive && Live ? <Live /> : children}
    </>
  );
}
