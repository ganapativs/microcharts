"use client";
import { lazy, useEffect, type ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

// Orama search dialog (~62 kB gzip) is lazy — it drops out of every page's
// initial JS and is fetched only when the user opens search. Fumadocs supports a
// React.lazy dialog and preloads it once idle, so Cmd/Ctrl-K stays instant.
const SearchDialog = lazy(() => import("@/components/search"));

export function Provider({ children }: { children: ReactNode }) {
  // Retire the cold-boot flag once the tree has hydrated. Everything
  // downstream (Reveal, RouteTransition) reads this to tell a paint the reader
  // is waiting on from one that is already behind them. Deliberately not
  // rAF-gated: a background tab never gets a frame, and the only thing this
  // flag gates is the *next* navigation — which is many seconds and a user
  // gesture away. Child effects (Reveal's layout effects) all run first.
  useEffect(() => {
    document.documentElement.dataset.boot = "warm";
  }, []);

  return <RootProvider search={{ SearchDialog }}>{children}</RootProvider>;
}
