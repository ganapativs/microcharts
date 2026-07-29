import type { ReactNode } from "react";
import { Source_Serif_4 } from "next/font/google";
import { HomeShell } from "@/components/home/home-shell";
import "../surface.css";
import "./home.css";

// The reading serif — demo prose only: the living hero sentence, the paper
// inversion, the four-context frames, the italic alt-text quote. It appears
// exactly where the page depicts prose, which is also the product's thesis.
// Body copy stays Hanken Grotesk, as everywhere else.
//
// Preloaded, unlike the same face elsewhere on the site, because it sets the
// hero sentence. Loading it late meant the sentence painted in the fallback,
// re-wrapped when the real face arrived, and moved the inline mark — which moved
// every leader in the specimen fan under it.
const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif-src",
  display: "swap",
  preload: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={`${serif.variable} [--font-serif:var(--font-serif-src),Georgia,serif]`}>
      <HomeShell>{children}</HomeShell>
    </div>
  );
}
