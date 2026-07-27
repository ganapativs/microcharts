import type { ReactNode } from "react";
import { Source_Serif_4 } from "next/font/google";
import localFont from "next/font/local";
import { V3Shell } from "@/components/home-v3/v3-shell";
import "./v3.css";

// The reading serif — demo prose only: the living hero sentence, the paper
// inversion, the four-context frames, the model's reply, the italic alt-text
// quote. Scoped exactly as the current marketing surface scopes it, because the
// serif appears here only where the page is depicting prose, which is also the
// product's thesis. Body copy stays Hanken Grotesk, as everywhere else.
//
// PRELOADED, unlike the same face on the current home page: there the serif is
// below the fold, here it sets the hero sentence. Loading it late meant the
// sentence painted in the fallback, re-wrapped when the real face arrived, and
// moved the inline mark — which moved every leader in the specimen fan under it.
// The fold visibly settled twice.
const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif-src",
  display: "swap",
  preload: true,
});

// Open Runde (a rounded cut of Inter, SIL OFL — licence beside the file) is the
// display face for this candidate, replacing Mona Sans. It is 40px and up only
// and never carries a numeral, so two weights cover the whole page: 600 for
// section headings, 700 for the two bookend lines. The shipped files are latin
// subsets of the Fontsource 600/700 statics — 20 kB each, so the pair costs
// less than Mona Sans alone. Regenerate with fontTools:
//   python3 -m fontTools.subset open-runde-latin-700-normal.woff2 \
//     --unicodes=<google latin range> \
//     --layout-features=kern,liga,calt,ccmp,locl,mark,mkmk \
//     --flavor=woff2 --no-hinting --desubroutinize
//
// `adjustFontFallback` is the load-bearing option: it makes Next emit a
// metric-matched, size-adjusted local fallback, so the display line occupies the
// SAME box before and after the swap. Without it the first line of the page
// reflowed on font load and shoved the whole fold down a few pixels.
const display = localFont({
  src: [
    { path: "../../fonts/OpenRunde-600-latin.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/OpenRunde-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display-v3-src",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${serif.variable} ${display.variable} [--font-display-v3:var(--font-display-v3-src),ui-sans-serif,system-ui,sans-serif] [--font-serif:var(--font-serif-src),Georgia,serif]`}
    >
      <V3Shell>{children}</V3Shell>
    </div>
  );
}
