import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAdapters,
  gaAdapter,
  registerAdapter,
  track,
  type AnalyticsAdapter,
  type AnalyticsEvent,
} from "./index";

function mockGtag() {
  const gtag = vi.fn();
  vi.stubGlobal("window", { gtag });
  return gtag;
}

afterEach(() => {
  clearAdapters();
  vi.restoreAllMocks();
});

describe("track bus", () => {
  it("no-ops with no adapters", () => {
    expect(() => track({ name: "copy", kind: "code" })).not.toThrow();
  });

  it("fans out to every registered adapter", () => {
    const a = vi.fn();
    const b = vi.fn();
    registerAdapter({ track: a });
    registerAdapter({ track: b });
    const event: AnalyticsEvent = { name: "cta", id: "get-started", href: "/docs" };
    track(event);
    expect(a).toHaveBeenCalledExactlyOnceWith(event);
    expect(b).toHaveBeenCalledExactlyOnceWith(event);
  });

  it("ignores duplicate register of the same adapter", () => {
    const adapter: AnalyticsAdapter = { track: vi.fn() };
    registerAdapter(adapter);
    registerAdapter(adapter);
    track({ name: "search", action: "open" });
    expect(adapter.track).toHaveBeenCalledTimes(1);
  });
});

describe("gaAdapter", () => {
  it("maps cta → select_content", () => {
    const gtag = mockGtag();
    gaAdapter.track({ name: "cta", id: "nav-docs", href: "/docs" });
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "select_content", {
      content_type: "cta",
      item_id: "nav-docs",
      link_url: "/docs",
    });
  });

  it("maps outbound → click", () => {
    const gtag = mockGtag();
    gaAdapter.track({
      name: "outbound",
      url: "https://github.com/ganapativs/microcharts",
      label: "GitHub",
    });
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "click", {
      link_url: "https://github.com/ganapativs/microcharts",
      outbound: true,
      link_text: "GitHub",
    });
  });

  it("maps copy → copy", () => {
    const gtag = mockGtag();
    gaAdapter.track({ name: "copy", kind: "install" });
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "copy", { copy_type: "install" });
  });

  it("maps search → search", () => {
    const gtag = mockGtag();
    gaAdapter.track({ name: "search", action: "open" });
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "search", {});
  });

  it("maps sandbox → select_content", () => {
    const gtag = mockGtag();
    gaAdapter.track({ name: "sandbox", source: "stackblitz-starter" });
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "select_content", {
      content_type: "sandbox",
      item_id: "stackblitz-starter",
    });
  });

  it("no-ops when gtag is missing", () => {
    vi.stubGlobal("window", {});
    expect(() => gaAdapter.track({ name: "copy", kind: "code" })).not.toThrow();
  });
});
