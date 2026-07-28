"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SearchTrigger } from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { Brandmark } from "@/components/brandmark";
import { AppearanceMenu } from "@/components/appearance-menu";
import { GithubStarCount } from "@/components/github-stars";

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

// One door per intent: "Charts" is the visual index (/charts — every card opens
// that chart's reference page), the word people scan for on a charts site.
// "Documentation" owns everything under /docs; the per-chart API pages live in
// the sidebar's "Reference" section — so the visible label "Charts" is unique
// and never collides with a second "Charts" in the docs tree.
const links = [
  { href: "/docs", label: "Documentation" },
  { href: "/charts", label: "Charts" },
  { href: "/examples", label: "Examples" },
  { href: "/docs/ai", label: "AI-native" },
];
// Brand is NOT here, and was: it is a guidelines page a reader visits once, and
// it was taking a fifth of a masthead whose other four entries are the site's
// working doors. It lives on the footer's licence line now — see the note there.

/** Documentation claims all of /docs except /docs/ai, which the AI entry owns. */
function isActive(href: string, pathname: string): boolean {
  if (href === "/docs") return pathname.startsWith("/docs") && !pathname.startsWith("/docs/ai");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark() {
  // Masthead links keep default App Router prefetch (production only). Dense
  // surfaces (docs sidebar, gallery cards, MDX) stay on prefetch={false}.
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
      <Brandmark size={28} className="shrink-0 transition-transform group-hover:-translate-y-px" />
      {/* Wordmark sits ~1px low vs links (lowercase + size); nudge up. */}
      <span className="font-display -translate-y-px text-[0.98rem] font-semibold tracking-[-0.016em] text-fd-foreground">
        microcharts
      </span>
    </Link>
  );
}

const ctrl = "ghost-ctrl size-8";

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // The mobile sheet never survives a navigation or an Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className="glass-rail sticky top-0 z-40"
      data-scrolled={scrolled || undefined}
      data-menu-open={open || undefined}
    >
      <nav className="mx-auto flex h-14 max-w-shell items-center gap-5 px-4 sm:px-6">
        <Wordmark />
        <div className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => {
            const active = isActive(l.href, pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-md px-2.5 py-1.5 text-[0.82rem] font-medium transition-colors",
                  active
                    ? "text-fd-foreground"
                    : "text-fd-muted-foreground hover:text-fd-foreground",
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-2.5 -bottom-[11px] h-px bg-fd-primary" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="site-nav-ctrls ml-auto flex items-center gap-1.5">
          {/* Fumadocs' SearchTrigger renders its own icon (ignores children), so
              style it as a clean square icon button matching GitHub + palette. */}
          <SearchTrigger aria-label="Search" className="ghost-ctrl size-8" />
          {/* Auto width, not the square ctrl: the star count (fail-open, may
              never render) sits inside the same anchor as a quiet pill. */}
          <a
            href={SITE.repo}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub repository"
            className="ghost-ctrl h-8 min-w-8 gap-1.5 px-1.5"
          >
            <GithubMark />
            <GithubStarCount />
          </a>
          <AppearanceMenu />
          {/* !: .ghost-ctrl's unlayered display:inline-flex outranks layered
              Tailwind utilities, so plain md:hidden loses. */}
          <button
            type="button"
            className={cn(ctrl, "md:!hidden")}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-nav-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-[17px]" /> : <Menu className="size-[17px]" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet under the rail (no portal); closes on navigate/Escape. */}
      {open && (
        <div
          id="site-nav-menu"
          className="site-nav-sheet absolute inset-x-0 top-full border-b border-hairline md:hidden"
        >
          <div className="mx-auto flex max-w-shell flex-col px-4 py-2 sm:px-6">
            {links.map((l) => {
              const active = isActive(l.href, pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-md px-2.5 py-2.5 text-[0.95rem] font-medium transition-colors",
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
        </div>
      )}
    </header>
  );
}
