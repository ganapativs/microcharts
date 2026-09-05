"use client";
import { useEffect, useState } from "react";
import { CHART_MODULE_LAZY } from "./modules.generated";
import type { ChartModule } from "./types";

// Resolved modules are cached at module scope so a second consumer on the same
// page (Playground and FourContexts both render on every chart doc page) and a
// re-visit after client navigation both resolve SYNCHRONOUSLY — the loading
// state is paid once per chart, not once per component per mount.
const cache = new Map<string, ChartModule>();
const inflight = new Map<string, Promise<ChartModule | undefined>>();

function load(slug: string): Promise<ChartModule | undefined> {
  const hit = inflight.get(slug);
  if (hit) return hit;
  const loader = CHART_MODULE_LAZY[slug];
  if (!loader) return Promise.resolve(undefined);
  const p = loader().then((m) => {
    cache.set(slug, m.default);
    return m.default;
  });
  inflight.set(slug, p);
  return p;
}

/**
 * Resolve one chart's `ChartModule` by slug, lazily.
 *
 * `lib/charts/registry` statically imports all 106 modules (each pulling its
 * chart's static AND interactive entry), so importing it from a `'use client'`
 * file costs the route ~311 kB gzip. A chart doc page needs exactly one chart —
 * this hook fetches that one chunk instead. Returns `undefined` until it lands;
 * callers must reserve the box's height so the swap causes no layout shift.
 */
export function useChartModule(slug: string | undefined): ChartModule | undefined {
  const [mod, setMod] = useState<ChartModule | undefined>(() =>
    slug ? cache.get(slug) : undefined,
  );

  useEffect(() => {
    // Loading a chart module is a dynamic import — an external system, and the
    // resolved module is what this hook exists to hand back.
    if (!slug) {
      // oxlint-disable-next-line react/set-state-in-effect
      setMod(undefined);
      return;
    }
    const cached = cache.get(slug);
    if (cached) {
      setMod(cached);
      return;
    }
    setMod(undefined);
    let cancelled = false;
    void load(slug).then((m) => {
      if (!cancelled) setMod(m);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return mod;
}
