import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import "../surface.css";
import "./marketing.css";

/**
 * The marketing routes that are not the landing page: /brand, /charts,
 * /examples, /gallery.
 *
 * Same shell as the landing page's (`components/home/home-shell.tsx`) and the
 * same `.surface` token scope, so a reader crossing between them sees the same
 * measure, the same rhythm, the same type ramp and the same actions. The
 * landing page adds a second scope of its own for the components only it has;
 * these routes add `marketing.css`, which is the same idea for the catalog
 * plane, the example plates and the brand sheets.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="surface relative flex min-h-screen flex-col">
      <SiteNav />
      <main id="main-content" className="surface-main flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
