"use client";
import { lazy, type ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

// Orama search dialog (~62 kB gzip) is lazy — it drops out of every page's
// initial JS and is fetched only when the user opens search. Fumadocs supports a
// React.lazy dialog and preloads it once idle, so Cmd/Ctrl-K stays instant.
const SearchDialog = lazy(() => import("@/components/search"));

export function Provider({ children }: { children: ReactNode }) {
  return <RootProvider search={{ SearchDialog }}>{children}</RootProvider>;
}
