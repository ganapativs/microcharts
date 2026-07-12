"use client";
import "@microcharts/react/motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CHART_MODULES } from "@/lib/charts/registry";
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

/** Gallery card stage — live (interactive + animate) by default; static on toggle / reduced-motion. */
export function GalleryStage({ slug }: { slug: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const mode = useSyncExternalStore(subscribeGalleryMode, getGalleryMode, () => "live" as const);
  const reduce = useReducedMotion();
  const mod = CHART_MODULES[slug];
  if (!mod) return null;
  // Hold static through SSR + first paint so hydration matches; then flip live
  // so entrance animates once (same idea as the homepage living catalog).
  const live = ready && mode === "live" && !reduce;
  const Preview = live && mod.PreviewLive ? mod.PreviewLive : mod.Preview;
  return <Preview />;
}
