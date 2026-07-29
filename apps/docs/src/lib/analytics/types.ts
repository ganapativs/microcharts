export type CopyKind = "install" | "code" | "agent_setup" | "brand";

export type AnalyticsEvent =
  | { name: "cta"; id: string; href: string }
  | { name: "outbound"; url: string; label?: string }
  | { name: "copy"; kind: CopyKind }
  | { name: "search"; action: "open" }
  | { name: "sandbox"; source: string };

export type AnalyticsAdapter = {
  track(event: AnalyticsEvent): void;
};
