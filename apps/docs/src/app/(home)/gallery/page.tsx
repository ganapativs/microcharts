import type { Metadata } from "next";
import Link from "next/link";

// Backward-compat: the gallery moved to /charts. Static export has no server
// redirects, so this stub bounces the browser with a meta refresh and points
// crawlers at the canonical /charts (noindex so it never competes in search).
export const metadata: Metadata = {
  title: "Charts",
  alternates: { canonical: "/charts" },
  robots: { index: false, follow: true },
};

export default function GalleryRedirect() {
  return (
    <>
      {/* React 19 hoists this into <head>; browsers honor it on any static host. */}
      <meta httpEquiv="refresh" content="0; url=/charts" />
      <div className="mx-auto max-w-shell px-4 py-24 text-center sm:px-6">
        <p className="text-fd-muted-foreground">
          The gallery is now{" "}
          <Link href="/charts" className="underline underline-offset-4 hover:text-fd-primary">
            Charts
          </Link>
          . Redirecting…
        </p>
      </div>
    </>
  );
}
