import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Provider } from "@/components/provider";
import { SITE } from "@/lib/site";
import { SIZE } from "@/lib/docs-facts";
import {
  jsonLdScript,
  softwareApplicationJsonLd,
  softwareSourceCodeJsonLd,
  websiteJsonLd,
} from "@/lib/jsonld";
import "./global.css";

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-src",
  display: "swap",
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-src",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-src",
  display: "swap",
});

// Apply saved accent + chart preset before first paint.
const ACCENT_SCRIPT = `try{var d=document.documentElement,a=localStorage.getItem("mc-accent");if(a&&a!=="cobalt")d.dataset.accent=a;var p=localStorage.getItem("mc-preset");if(p&&p!=="modern")d.dataset.mcPreset=p}catch(e){}`;

// The leading glyph is the hero's own sparkline data ([3,5,4,8,6,9,7,11])
// rendered in unicode blocks — a chart small enough to sit in a console.log,
// which is exactly the tagline. Delight that doesn't lie: it's the real series.
const CONSOLE_SCRIPT = `try{console.log("%c▁▃▂▅▄▆▅█%c  ${SITE.name}%c\\n${SITE.tagline}\\nThat glyph is the hero's sparkline in text. Small enough for a sentence, a table cell, or a console.log.\\nZero dependencies, ${SIZE.min}–${SIZE.max} kB gzip per chart, accessible by default.\\n\\nDocs    ${SITE.url}/docs\\nSource  ${SITE.repo}","color:#2f52d4;font-size:15px;letter-spacing:1.5px","color:#2f52d4;font-weight:700;font-size:13px","color:#8a8986;font-size:11px;line-height:1.7")}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.author, url: SITE.authorUrl }],
  creator: SITE.author,
  publisher: SITE.author,
  keywords: [
    "react charts",
    "sparkline",
    "microchart",
    "accessible charts",
    "zero dependency",
    "rsc",
    "svg charts",
    "tiny chart",
    "dataviz",
  ],
  alternates: {
    canonical: "/",
    types: { "application/atom+xml": [{ url: "/rss.xml", title: `${SITE.name} releases` }] },
  },
  // Crisp env-aware SVG favicon (app/brand/icon.svg); apple-touch icon is the
  // generated PNG (app/apple-icon.tsx) via its file convention.
  icons: { icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }] },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: SITE.ogImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.authorXHandle,
    creator: SITE.authorXHandle,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og/default.png"],
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
        <script dangerouslySetInnerHTML={{ __html: ACCENT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: CONSOLE_SCRIPT }} />
        <script type="application/ld+json">{jsonLdScript(websiteJsonLd())}</script>
        <script type="application/ld+json">{jsonLdScript(softwareSourceCodeJsonLd())}</script>
        <script type="application/ld+json">{jsonLdScript(softwareApplicationJsonLd())}</script>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
