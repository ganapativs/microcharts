"use client";
import { usePathname } from "next/navigation";
import type { ChartCollection } from "@/lib/charts/types";
import { isChartCollection } from "./collections";
import { GalleryDockBar } from "./gallery-dock-bar";

function activeFromPath(path: string): ChartCollection | "all" {
  const seg = path.match(/^\/charts\/([^/]+)\/?$/)?.[1];
  return seg && isChartCollection(seg) ? seg : "all";
}

/**
 * Floating command dock for the gallery — collection hubs, search, density, sort.
 * Mounted from `charts/layout.tsx` so hub navigations do not remount it.
 */
export function GalleryDock({
  counts,
  collections,
}: {
  counts: Record<string, number>;
  collections: readonly { key: ChartCollection; label: string }[];
}) {
  const activeCollection = activeFromPath(usePathname());
  return (
    <GalleryDockBar counts={counts} collections={collections} activeCollection={activeCollection} />
  );
}
