import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Provider } from "@/components/provider";
import { SITE } from "@/lib/site";
import { jsonLdScript, softwareSourceCodeJsonLd, websiteJsonLd } from "@/lib/jsonld";
import "./global.css";

// Hanken Grotesk — crisp, compact humanist body/UI (narrower than Instrument
// Sans). Excellent tabular numerals for the charts to inherit.
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-src",
  display: "swap",
});

// Bricolage Grotesque — an expressive, optical display grotesque with genuine
// character (the "handcrafted" voice). Distinct from the serif-heavy AI
// editorial pack; carries the big hero + section headings.
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

// No-flash accent: apply the saved accent before first paint.
const ACCENT_SCRIPT = `try{var a=localStorage.getItem("mc-accent");if(a&&a!=="cobalt")document.documentElement.dataset.accent=a}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.author }],
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
  alternates: { canonical: "/" },
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
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og/default.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d11" },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(softwareSourceCodeJsonLd()) }}
        />
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
