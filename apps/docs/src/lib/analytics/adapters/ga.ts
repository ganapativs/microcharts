import type { AnalyticsAdapter, AnalyticsEvent } from "../types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtagEvent(name: string, params: Record<string, unknown>): void {
  window.gtag?.("event", name, params);
}

export const gaAdapter: AnalyticsAdapter = {
  track(event: AnalyticsEvent) {
    switch (event.name) {
      case "cta":
        gtagEvent("select_content", {
          content_type: "cta",
          item_id: event.id,
          link_url: event.href,
        });
        break;
      case "outbound":
        gtagEvent("click", {
          link_url: event.url,
          outbound: true,
          ...(event.label ? { link_text: event.label } : {}),
        });
        break;
      case "copy":
        gtagEvent("copy", { copy_type: event.kind });
        break;
      case "search":
        gtagEvent("search", {});
        break;
      case "sandbox":
        gtagEvent("select_content", {
          content_type: "sandbox",
          item_id: event.source,
        });
        break;
    }
  },
};
