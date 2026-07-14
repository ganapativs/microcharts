"use client";
import type { ChartCollection } from "@/lib/charts/types";
import { GalleryDockBar } from "./gallery-dock-bar";

/**
 * Floating command dock for the gallery — filters, search, density, and sort.
 * See gallery-dock-bar.tsx and use-gallery-dock.ts for implementation.
 */
export function GalleryDock({
  counts,
  collections,
}: {
  counts: Record<string, number>;
  collections: { key: ChartCollection; label: string }[];
}) {
  return <GalleryDockBar counts={counts} collections={collections} />;
}
