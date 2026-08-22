import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/**
 * The HTML 404.
 *
 * Browsers land here. Every other client gets the same information as Markdown
 * or RFC 9457 problem details, rendered at the edge by `worker.ts` and
 * published as a static file at `/404.md`. The machine-surface row below is
 * what those bodies link to, so a reader and a script recover the same way.
 */
const RECOVERY = [
  { href: "/docs", label: "Documentation" },
  { href: "/charts", label: "All charts" },
  { href: "/examples", label: "Examples" },
];

const MACHINE = [
  { href: "/llms.txt", label: "/llms.txt" },
  { href: "/sitemap.xml", label: "/sitemap.xml" },
  { href: "/catalog.json", label: "/catalog.json" },
  { href: "/openapi.json", label: "/openapi.json" },
];

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <p className="font-mono text-sm tracking-widest text-fd-muted-foreground uppercase">404</p>
      <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        This page doesn&apos;t exist
      </h1>
      <p className="max-w-md text-fd-muted-foreground">
        The chart you&apos;re looking for may have moved. Browse the charts, or start from the docs.
      </p>
      <nav
        aria-label="Recover"
        className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium"
      >
        <Link href="/" className="underline underline-offset-4 hover:text-fd-primary">
          Home
        </Link>
        {RECOVERY.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="underline underline-offset-4 hover:text-fd-primary"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <nav
        aria-label="Machine-readable index"
        className="flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-xs text-fd-muted-foreground"
      >
        {MACHINE.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="underline underline-offset-4 hover:text-fd-primary"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <p className="max-w-md font-mono text-xs text-fd-muted-foreground">
        Reading this with a script?{" "}
        <a href="/404.md" className="underline underline-offset-4">
          /404.md
        </a>{" "}
        is this page as Markdown, and any page here answers <code>Accept: text/markdown</code>.
      </p>
    </main>
  );
}
