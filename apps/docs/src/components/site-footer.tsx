import Link from "next/link";
import { SITE } from "@/lib/site";
import { STABLE_CHARTS } from "@/lib/catalog";
import { FooterMark } from "@/components/footer-mark";

function XMark() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

const FEATURED_SLUGS = ["sparkline", "sparkbar", "delta", "bullet", "activity-grid"];
const featured = FEATURED_SLUGS.map((slug) => STABLE_CHARTS.find((c) => c.slug === slug)).filter(
  (c): c is (typeof STABLE_CHARTS)[number] => c !== undefined,
);

const cols: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Docs",
    links: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/docs/accessibility", label: "Accessibility" },
      { href: "/docs/performance", label: "Performance" },
      { href: "/docs/theming", label: "Theming" },
    ],
  },
  {
    title: "Charts",
    links: [
      ...featured.map((c) => ({ href: `/docs/charts/${c.slug}`, label: c.name })),
      { href: "/gallery", label: `All ${STABLE_CHARTS.length} charts →` },
    ],
  },
  {
    title: "Machine",
    links: [
      { href: "/llms.txt", label: "llms.txt", external: true },
      { href: "/catalog.json", label: "catalog.json", external: true },
      { href: "/docs/ai", label: "AI-native" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-4 pt-14 sm:px-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="inline-block text-[0.95rem] font-semibold tracking-tight transition-colors hover:text-fd-primary"
            >
              microcharts
            </Link>
            <p className="mt-2 max-w-52 text-sm text-fd-muted-foreground">{SITE.tagline}</p>
            <div className="mono-label mt-4">Zero deps · MIT</div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="mono-label mb-3">{col.title}</div>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) =>
                  l.external ? (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        className="text-fd-muted-foreground link-underline hover:text-fd-foreground"
                      >
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-fd-muted-foreground link-underline hover:text-fd-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <FooterMark />

      <div className="absolute inset-x-0 bottom-3 z-10 mx-auto max-w-6xl px-4 sm:bottom-4 sm:px-6">
        <div className="flex flex-col gap-3 text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="mono-label flex items-center gap-1.5">
            <span>© 2026</span>
            <a
              href={SITE.authorUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="ml-0.5 underline decoration-fd-border underline-offset-[3px] transition-colors hover:text-fd-foreground hover:decoration-fd-muted-foreground"
            >
              {SITE.author}
            </a>
            <a
              href={SITE.authorX}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${SITE.author} on X`}
              className="ghost-ctrl size-6"
            >
              <XMark />
            </a>
          </span>
          <div className="flex gap-4 text-sm">
            <Link href="/brand" className="link-underline hover:text-fd-foreground">
              Brand
            </Link>
            <a href={SITE.repo} className="link-underline hover:text-fd-foreground">
              GitHub
            </a>
            <a href={SITE.npm} className="link-underline hover:text-fd-foreground">
              npm
            </a>
            {/* dofollow, UTM-tagged — Argos open-source plan requirement */}
            <a
              href="https://argos-ci.com?utm_source=microcharts&utm_campaign=oss"
              className="link-underline hover:text-fd-foreground"
            >
              Visual tests by Argos
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
