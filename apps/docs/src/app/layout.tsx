import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Provider } from "@/components/provider";
import { SITE } from "@/lib/site";
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

const CONSOLE_SCRIPT = `try{console.log("%c${SITE.name}%c\\n${SITE.tagline}\\nZero dependencies, ~1 kB gzip per chart, accessible by default.\\n\\nDocs    ${SITE.url}/docs\\nSource  ${SITE.repo}","color:#2f52d4;font-weight:700;font-size:13px","color:#8a8986;font-size:11px;line-height:1.6")}catch(e){}`;

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
  // Crisp env-aware SVG favicon (app/brand/icon.svg). The apple-touch icon must
  // be listed explicitly — an `icons` object suppresses the app/apple-icon.tsx
  // file convention's automatic <link> tag.
  icons: {
    icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-fd-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-fd-foreground focus:shadow-md focus:ring-2 focus:ring-fd-primary"
        >
          Skip to content
        </a>
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
