import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

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
      <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
        <Link href="/" className="underline underline-offset-4 hover:text-fd-primary">
          Home
        </Link>
        <Link href="/docs" className="underline underline-offset-4 hover:text-fd-primary">
          Documentation
        </Link>
        <Link href="/charts" className="underline underline-offset-4 hover:text-fd-primary">
          Charts
        </Link>
      </nav>
    </main>
  );
}
