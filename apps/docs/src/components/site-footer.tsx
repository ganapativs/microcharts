import Link from "next/link";
import { SITE } from "@/lib/site";
import { STABLE_CHARTS } from "@/lib/catalog";

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
    links: STABLE_CHARTS.map((c) => ({ href: `/docs/charts/${c.slug}`, label: c.name })),
  },
  {
    title: "Machine",
    links: [
      { href: "/llms.txt", label: "llms.txt", external: true },
      { href: "/microcharts.catalog.json", label: "catalog.json", external: true },
      { href: "/docs/ai", label: "AI-native" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-fd-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="text-[0.95rem] font-semibold tracking-tight">microcharts</div>
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
        <div className="mt-12 flex flex-col gap-3 border-t border-fd-border pt-6 text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="mono-label">© 2026 {SITE.author}</span>
          <div className="flex gap-4 text-sm">
            <a href={SITE.repo} className="link-underline hover:text-fd-foreground">
              GitHub
            </a>
            <a href={SITE.npm} className="link-underline hover:text-fd-foreground">
              npm
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
