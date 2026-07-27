import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

/**
 * The page shell: the `.v3` token scope and the ground under it. No hooks, no
 * refs, no client boundary — this is a server component, and everything it holds
 * is server-rendered.
 *
 * **The masthead is the SITE's nav.** An earlier draft shipped a bespoke rail
 * carrying a `defineTheme` palette switch as the page's signature control; it was
 * cut, because a candidate homepage that re-invents the header is testing two
 * things at once, and the standard rail already does the job: `.glass-rail` is
 * transparent until `data-scrolled`, so it blends into the fold and only becomes
 * a surface once there is content behind it. Its appearance popover owns theme,
 * accent and all six chart presets, with a description for each.
 *
 * **The ground spans the whole page, including behind the rail.** The ember wash
 * used to live inside Act I, whose box starts below the sticky header — so the
 * 56px strip behind the transparent rail showed the bare field while the fold
 * showed field + wash, and the seam between them read as a header background. Two
 * page-level layers instead: the grain over everything, the wash over the fold's
 * height only, both starting at y=0 and both under the rail.
 *
 * **There is no entrance motion.** No scroll reveals, no staggered fades, no
 * hero sequence, and the charts do not draw themselves in. See v3.css.
 */
export function V3Shell({ children }: { children: ReactNode }) {
  return (
    <div className="v3 relative flex min-h-screen flex-col">
      <div aria-hidden className="v3-grain" />
      <div aria-hidden className="v3-wash" />
      <SiteNav />
      <main id="main-content" className="v3-main relative z-[2] flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
