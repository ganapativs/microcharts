import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RouteTransition } from "@/components/route-transition";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main id="main-content" className="flex-1">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <SiteFooter />
    </div>
  );
}
