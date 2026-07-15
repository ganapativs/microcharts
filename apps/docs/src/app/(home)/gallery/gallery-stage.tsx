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

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
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
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(host);
    return () => io.disconnect();
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
