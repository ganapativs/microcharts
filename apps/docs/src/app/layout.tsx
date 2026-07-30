import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@/components/analytics";
import { LabelCodeRegions } from "@/components/label-code-regions";
import { Provider } from "@/components/provider";
import { SITE } from "@/lib/site";
import {
  jsonLdScript,
  organizationJsonLd,
  softwareApplicationJsonLd,
  softwareSourceCodeJsonLd,
  websiteJsonLd,
} from "@/lib/jsonld";
import { SEO_KEYWORDS } from "@/lib/seo";
import "./global.css";

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-src",
  display: "swap",
});

// Open Runde (a rounded cut of Inter, SIL OFL — licence beside the files) is the
// site's display face, self-hosted because it isn't on Google Fonts. It ships as
// statics, not a variable font, so only the three weights the site actually sets
// are here: 500 for headings and doc titles, 600 for the landing sections and
// the footer wordmark, 700 for the two landing bookends. 20 kB each.
// Regenerate with fontTools from the Fontsource latin statics:
//   python3 -m fontTools.subset open-runde-latin-<w>-normal.woff2 \
//     --unicodes=<google latin range> \
//     --layout-features=kern,liga,calt,ccmp,locl,mark,mkmk \
//     --flavor=woff2 --no-hinting --desubroutinize
//
// `adjustFontFallback` makes Next emit a metric-matched, size-adjusted local
// fallback, so a display line occupies the same box before and after the swap —
// without it the first heading reflows on font load.
const display = localFont({
  src: [
    { path: "../fonts/OpenRunde-500-latin.woff2", weight: "500", style: "normal" },
    { path: "../fonts/OpenRunde-600-latin.woff2", weight: "600", style: "normal" },
    { path: "../fonts/OpenRunde-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display-src",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Iosevka (SIL OFL — licence beside the files) is the site's mono: metadata
// labels, figures, code. Self-hosted because it isn't on Google Fonts. The cut
// is Iosevka EXTENDED, whose 600/1000 advance matches the mono the site was
// typeset against, so every hardcoded mono size and tracking value still holds;
// the default 500/1000 cut would run 17% narrow. Three statics — 400 for code
// and figures, 500 for the uppercase labels and table heads, 700 because Shiki
// emits `font-weight: bold` for keywords and a missing weight would synthesize.
// ~20 kB each. Regenerate from the official Iosevka release TTFs:
//   python3 -m fontTools.subset Iosevka-Extended.ttf \
//     --unicodes=<google latin range + arrows, box + block drawing> \
//     --layout-features=kern,liga,calt,ccmp,locl,mark,mkmk \
//     --flavor=woff2 --no-hinting
const mono = localFont({
  src: [
    { path: "../fonts/Iosevka-400-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Iosevka-500-latin.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Iosevka-700-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono-src",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

// Apply saved accent + chart preset before first paint.
const ACCENT_SCRIPT = `try{var d=document.documentElement,a=localStorage.getItem("mc-accent");if(a&&a!=="cobalt")d.dataset.accent=a;var p=localStorage.getItem("mc-preset");if(p&&p!=="modern")d.dataset.mcPreset=p}catch(e){}`;

// Mark the scrolled state on :root before hydration, so a reload at a restored
// scroll offset paints the header's surface in the first frame instead of
// materialising it a beat later (which is what a hydration-time effect does).
// Scroll restoration can land before or after this script runs, so the state is
// re-read on the next frame and on pageshow (bfcache) as well as on scroll.
const RAIL_SCRIPT = `try{var d=document.documentElement,f=function(){d.toggleAttribute("data-rail-scrolled",(window.scrollY||0)>8)};f();addEventListener("scroll",f,{passive:true});addEventListener("pageshow",f);requestAnimationFrame(f)}catch(e){}`;

// Console easter egg — unicode blocks of the hero sparkline series [3,5,4,8,6,9,7,11].
const CONSOLE_SCRIPT = `try{console.log("%c▁▃▂▅▄▆▅█%c  ${SITE.name}%c\\n${SITE.tagline}\\nThat glyph is the hero's sparkline in text. Small enough for a sentence, a table cell, or a console.log.\\nZero dependencies, ~2–7 kB interactive · ~1–4 kB static per chart, accessible by default.\\n\\nDocs    ${SITE.url}/docs\\nSource  ${SITE.repo}","color:#2f52d4;font-size:15px;letter-spacing:1.5px","color:#2f52d4;font-weight:700;font-size:13px","color:#8a8986;font-size:11px;line-height:1.7")}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // Keyword tail on the SERP title only — OG/twitter keep the clean brand line.
  title: {
    default: `${SITE.name} — ${SITE.tagline} Tiny sparklines & micro charts.`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.author, url: SITE.authorUrl }],
  creator: SITE.author,
  publisher: SITE.author,
  keywords: [...SEO_KEYWORDS],
  category: "technology",
  alternates: {
    canonical: "/",
    types: {
      "application/atom+xml": [{ url: "/rss.xml", title: `${SITE.name} releases` }],
      "text/plain": [{ url: "/llms.txt", title: `${SITE.name} for LLMs` }],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Crisp env-aware SVG favicon (app/brand/icon.svg). The apple-touch icon must
  // be listed explicitly — an `icons` object suppresses the app/apple-icon.tsx
  // file convention's automatic <link> tag. favicon.ico (app/favicon.ico,
  // regenerated by scripts/gen-favicon.py) + the 192px PNG exist for Google
  // SERP favicon rules (48px-multiple raster) and legacy /favicon.ico probes.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48 32x32 16x16", type: "image/x-icon" },
      { url: "/icon-192", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: SITE.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.authorXHandle,
    creator: SITE.authorXHandle,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [{ url: "/og/default.png", alt: SITE.ogImageAlt }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9edf4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0f" },
  ],
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-fd-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-fd-foreground focus:shadow-md focus:ring-2 focus:ring-fd-primary"
        >
          Skip to content
        </a>
        {/* The site's ground, on every route. Fixed and at `z-index: -1`, so no
            page layout has to make room for them or stack above them. */}
        <div aria-hidden className="site-grain" />
        <div aria-hidden className="site-wash" />
        <script dangerouslySetInnerHTML={{ __html: ACCENT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: RAIL_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: CONSOLE_SCRIPT }} />
        <script type="application/ld+json">{jsonLdScript(organizationJsonLd())}</script>
        <script type="application/ld+json">{jsonLdScript(websiteJsonLd())}</script>
        <script type="application/ld+json">{jsonLdScript(softwareSourceCodeJsonLd())}</script>
        <script type="application/ld+json">{jsonLdScript(softwareApplicationJsonLd())}</script>
        <Analytics />
        <LabelCodeRegions />
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
