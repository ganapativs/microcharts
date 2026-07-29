import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

/**
 * The page shell: the shared `.surface` token scope, the landing's own `.home`
 * scope over it, the site nav and the site footer. A server component — no
 * hooks, no refs, no client boundary.
 *
 * `.surface` is the design language every customer-facing route now opens on
 * (see `src/app/surface.css`); `.home` is the eleven components only this page
 * has. `/charts`, `/examples` and `/brand` carry the first and not the second.
 *
 * The ground under it (`.site-grain` / `.site-wash`) is the site's, painted from
 * the root layout on every route.
 *
 * There is no entrance motion: no scroll reveals, no staggered fades, and the
 * charts do not draw themselves in. See home.css.
 */
export function HomeShell({ children }: { children: ReactNode }) {
  return (
    <div className="surface home relative flex min-h-screen flex-col">
      <SiteNav />
      <main id="main-content" className="surface-main flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
