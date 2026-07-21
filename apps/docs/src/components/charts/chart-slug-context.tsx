"use client";
import "@microcharts/react/motion";
import { createContext, useContext, type ReactNode } from "react";

const ChartSlugContext = createContext<string | undefined>(undefined);

/** Chart-doc pages set this so LiveDemo variants can swap to the interactive twin. */
export function ChartSlugProvider({
  slug,
  children,
}: {
  slug: string | undefined;
  children: ReactNode;
}) {
  return <ChartSlugContext.Provider value={slug}>{children}</ChartSlugContext.Provider>;
}

export function useChartSlug(): string | undefined {
  return useContext(ChartSlugContext);
}
