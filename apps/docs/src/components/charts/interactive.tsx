"use client";
import { getModule } from "@/lib/charts/registry";

/** A fully interactive example of a chart's `/interactive` entry. */
export function InteractiveDemo({ slug }: { slug: string }) {
  const mod = getModule(slug);
  if (!mod) return null;
  const Demo = mod.InteractiveDemo;
  return <Demo />;
}
