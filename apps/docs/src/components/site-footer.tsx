import Link from "next/link";
import { SITE } from "@/lib/site";
import { STABLE_CHARTS } from "@/lib/catalog";
import { FooterMark } from "@/components/footer-mark";

/** Sized to the byline it sits in, not to the other two marks.
 *
 *  The X glyph fills ~81% of its 24×24 box (y 2.25→21.8), so at 14px its ink was
 *  11.3px tall against a 10.88px mono line whose caps are ~7.8px — half again as
 *  tall as the letters it sits beside, which is what read as unaligned. At 11px
 *  the ink is ~8.9px: a shade over cap height, which is where a logo has to sit
 *  to hold its weight without becoming the loudest thing on the line. */
function XMark() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

/** Sized by INK against the wordmark's cap band, not by box against each other.
 *
 *  The GitHub glyph fills ~98% of its box and npm's fills ~39%, so equal boxes
 *  are nowhere near equal marks: at 15 and 20 the ink measured 14.69 and 7.78
 *  against a 10.59px cap — GitHub 1.39× the caps, npm 0.73×, and GitHub nearly
 *  twice npm. 13 and 24 bring them to 1.20× and 0.88×, which is as close as the
 *  two shapes get before npm's box has to go past 30px wide to match on height.
 *  (Vertical alignment needed nothing: both were already centred on the cap band
 *  to within half a pixel.) */
function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

/** Bigger box than GitHub's, for the reason set out on `GithubMark`: this mark is
 *  a squat wordmark filling ~39% of its box, so it needs the larger box to carry
 *  comparable ink. */
function NpmMark() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
      <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H4v4H1.334V8.667h5.332v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
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
      { href: "/charts", label: `All ${STABLE_CHARTS.length} charts →` },
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
      {/* the link layers sit above the canvas field, so they must be
          transparent to the pointer — only the links themselves take it back,
          or the torch/swell is unreachable across most of the footer (on
          mobile the 2-col grid covers nearly the whole field) */}
      <div className="pointer-events-none relative z-10 mx-auto max-w-shell px-4 pb-4 pt-14 [&_a]:pointer-events-auto sm:px-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            {/* The repo and the package sit with the WORDMARK, not with the
                byline. They are the library's addresses; the byline's X handle is
                a person's. Parked together they read as one row of "contact me"
                links, and the reader has to guess which is which. */}
            <div className="flex items-center gap-1.5">
              <Link
                prefetch={false}
                href="/"
                className="text-[0.95rem] font-semibold tracking-tight transition-colors hover:text-fd-primary"
              >
                microcharts
              </Link>
              <a
                href={SITE.repo}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="microcharts on GitHub"
                className="ghost-ctrl ml-1 size-6"
              >
                <GithubMark />
              </a>
              <a
                href={SITE.npm}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="microcharts on npm"
                className="ghost-ctrl size-6"
              >
                <NpmMark />
              </a>
            </div>
            <p className="mt-2 max-w-52 text-sm text-fd-muted-foreground">{SITE.tagline}</p>
            {/* Brand sits on the LICENCE line, not in the Docs column, and that is
                the whole argument for where it went when it came out of the
                masthead. The three columns beside this one are sorted by kind —
                things to read, charts to browse, surfaces for machines — and a
                brand page is none of them. What it actually is, is the other half
                of this line: `MIT` is permission to use the code, and /brand is
                permission to use the name and the mark (its longest section is
                exactly that). Same category, same line, in the one column whose
                whole subject is the identity it documents. */}
            <div className="mono-label mt-4 flex items-center gap-1.5">
              <span>Zero deps · MIT ·</span>
              <Link
                prefetch={false}
                href="/brand"
                className="underline decoration-fd-border underline-offset-[3px] transition-colors hover:text-fd-foreground hover:decoration-fd-muted-foreground"
              >
                Brand
              </Link>
            </div>
            {/* The byline belongs to the brand block, not to the bar across the
                bottom. Down there it was the only thing on the left of a rule the
                wordmark also sits on, so it read as a caption for the canvas; here
                it closes the column that already says who and what this is. */}
            <span className="mono-label mt-3 flex items-center gap-1.5 text-fd-muted-foreground">
              <span>© 2026</span>
              <a
                href={SITE.authorUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="ml-0.5 underline decoration-fd-border underline-offset-[3px] transition-colors hover:text-fd-foreground hover:decoration-fd-muted-foreground"
              >
                {SITE.author}
              </a>
              {/* NO nudge, and that is the fix rather than the absence of one.
                  `items-center` centres this on the line box and the un-nudged
                  result is already right: ink 531.7→540.6 against a cap band of
                  532.1→540.1, so it straddles the band by half a pixel either
                  side. A +1.5px correction was added here once, from a baseline
                  computed with `(lineHeight - fontSize)/2` as the half-leading.
                  That is wrong — the content box is the font's ascent + descent
                  (11 + 3 = 14px here, not 10.88) — so the "baseline" came out
                  1.8px low and the mark was pushed down below the real one, which
                  is what made it hang under the S. Measure half-leading as
                  `(lineHeight - (ascent + descent)) / 2` or do not measure. */}
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
                        prefetch={false}
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
    </footer>
  );
}
