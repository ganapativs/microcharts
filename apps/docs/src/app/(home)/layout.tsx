import type { ReactNode } from "react";
import { Source_Serif_4 } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

// The reading serif — the streamed reply demo and the headline's italic
// emphasis. Marketing surface only; docs never load it. Source Serif 4 is the
// closest open face to the serif the streaming assistants themselves set
// replies in, so the demo reads like the surface it depicts.
// Variable axes (no weight list) — two files (roman + italic), not four.
// preload:false keeps the serif out of the critical font path: nothing it
// styles paints before ~1.9 s (reply stream, italic emphasis mid-settle).
const serif = Source_Serif_4({
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
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
