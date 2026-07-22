import type { ReactNode } from "react";
import "@microcharts/react/styles.css";
import "./globals.css";
import { Nav } from "./components/nav";
import { MotionInit } from "./motion-init";

export const metadata = {
  title: "Pulse — Product Analytics",
  description: "Example dashboard showcasing @microcharts/react in Next.js RSC.",
  robots: { index: false, follow: false },
};

// Root layout is a Server Component. It renders the shared app shell and mounts
// <MotionInit /> once so client-side `animate` works without importing motion
// from any Server Component.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=zodiak@700,500,400&f[]=switzer@400,500,600,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Spline+Sans+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-mark">
                <span className="brand-name">Pulse</span>
                <span className="brand-reg">®</span>
              </span>
              <span className="brand-sub">Product Analytics · FY26</span>
            </div>
            <Nav />
            <div className="sidebar-foot">
              <span className="avatar">JD</span>
              <div>
                <div className="sidebar-foot-name">Jordan Diaz</div>
                <div>Acme Inc · Growth</div>
              </div>
            </div>
          </aside>
          <div className="main">{children}</div>
        </div>
        <MotionInit />
        {/* Cloudflare Web Analytics — inlined at build when NEXT_PUBLIC_CF_BEACON_TOKEN is set
            (or enable Web Analytics on the Pages project instead, which auto-injects). See DEPLOY.md. */}
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN })}
          />
        ) : null}
      </body>
    </html>
  );
}
