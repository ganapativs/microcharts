import type { ReactNode } from "react";
import { Newsreader } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { RouteTransition } from "@/components/route-transition";

// The reading serif — the streamed reply demo and the headline's italic
// emphasis. Marketing surface only; docs never load it.
// Variable axes (no weight list) — two files (roman + italic), not four.
// preload:false keeps the serif out of the critical font path: nothing it
// styles paints before ~1.9 s (reply stream, italic emphasis mid-settle).
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif-src",
  display: "swap",
  preload: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${serif.variable} flex min-h-screen flex-col [--font-serif:var(--font-serif-src),Georgia,serif]`}
    >
      <SiteNav />
      <main className="flex-1">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <SiteFooter />
    </div>
  );
}
