"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchTrigger } from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { Search } from "lucide-react";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/cn";

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/docs/charts/sparkline", label: "Charts" },
  { href: "/gallery", label: "Gallery" },
  { href: "/docs/accessibility", label: "A11y" },
];

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label={`${SITE.name} home`}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden className="shrink-0">
        <rect width="32" height="32" rx="7" className="fill-fd-primary" />
        <path
          d="M6 21L11 16L15 18L20 10.5L25.5 6.5"
          className="stroke-fd-primary-foreground"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25.5" cy="6.5" r="2.6" className="fill-fd-primary-foreground" />
      </svg>
      <span className="text-[0.95rem] font-semibold tracking-tight text-fd-foreground">
        microcharts
      </span>
    </Link>
  );
}

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-fd-border/80 bg-fd-background/72 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Wordmark />
        <div className="mx-1 hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active =
              pathname === l.href || (l.href !== "/docs" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-colors",
                  active
                    ? "text-fd-foreground"
                    : "text-fd-muted-foreground hover:text-fd-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <SearchTrigger
            className="group flex h-8 items-center gap-2 rounded-md border border-fd-border bg-fd-muted/50 pl-2.5 pr-1.5 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            aria-label="Search"
          >
            <Search className="size-3.5" />
            <span className="hidden font-mono text-[0.7rem] sm:inline">Search</span>
            <kbd className="hidden rounded border border-fd-border bg-fd-card px-1.5 py-0.5 font-mono text-[0.62rem] sm:inline">
              ⌘K
            </kbd>
          </SearchTrigger>
          <a
            href={SITE.repo}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub repository"
            className="inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
          >
            <GithubMark />
          </a>
          <ThemeSwitch className="shrink-0" />
        </div>
      </nav>
    </header>
  );
}
