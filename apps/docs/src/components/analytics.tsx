"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { gaAdapter, registerAdapter, track } from "@/lib/analytics";

/** Bake-time override; empty string disables GA. Default = production property. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-LN11CCKKTW";

/** SPA pageviews — first load is covered by gtag('config'). */
function GaPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!GA_ID) return;
    const qs = searchParams.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;
    window.gtag?.("config", GA_ID, { page_path: path });
  }, [pathname, searchParams]);

  return null;
}

function isSkippableHref(href: string): boolean {
  return (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  );
}

/** Delegated capture: `data-analytics="cta:…"` + same-origin-leaving `<a>`. */
function ClickCapture() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a[href], [data-analytics]");
      if (!(el instanceof Element)) return;

      const analytics = el.getAttribute("data-analytics");
      if (analytics?.startsWith("cta:")) {
        const id = analytics.slice(4);
        const href = el.getAttribute("href") ?? "";
        track({ name: "cta", id, href });
      }

      if (el.tagName !== "A") return;
      const raw = el.getAttribute("href");
      if (!raw || isSkippableHref(raw)) return;
      let url: URL;
      try {
        url = new URL(raw, window.location.href);
      } catch {
        return;
      }
      if (url.origin === window.location.origin) return;
      const label =
        el.getAttribute("aria-label")?.trim() ||
        el.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) ||
        undefined;
      track({ name: "outbound", url: url.href, label });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}

export function Analytics() {
  useEffect(() => {
    if (GA_ID) registerAdapter(gaAdapter);
  }, []);

  if (!GA_ID) return <ClickCapture />;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');
`}</Script>
      <Suspense fallback={null}>
        <GaPageViews />
      </Suspense>
      <ClickCapture />
    </>
  );
}
