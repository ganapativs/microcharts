"use client";
/*
 * TEMPORARY — layout lab. Delete this directory before merge.
 *
 * Renders every chart in the catalog inside one hostile layout at a time, so a
 * human can look at the thing the automated suites only measure: whether the
 * hover readout survives a scrolling rail, a transformed ancestor, a window
 * edge, a table cell.
 *
 * `src/test/layout-escape.browser.test.tsx` is the committed guard and covers
 * four charts across nine layouts. This page is the other half: all 106 charts,
 * eyes on. "Audit this view" runs the same measurement the test does — focus
 * each chart, rove one unit, measure the chip against every clipping ancestor
 * and the window — and lists whatever fails.
 */
import { useCallback, useEffect, useState } from "react";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { CHART_MODULE_LAZY } from "@/lib/charts/modules.generated";

type Wrap = (kid: ReactNode) => ReactNode;

const box = (style: CSSProperties, kid: ReactNode): ReactNode => <div style={style}>{kid}</div>;

/** Each layout is one way a real app has eaten a readout. */
const LAYOUTS: Record<string, Wrap> = {
  roomy: (k) => box({ padding: 24 }, k),
  "overflow-hidden": (k) => box({ width: 200, height: 44, overflow: "hidden" }, k),
  "overflow-scroll": (k) =>
    box({ width: 200, height: 44, overflowY: "auto" }, <div style={{ paddingTop: 8 }}>{k}</div>),
  "nested-clippers": (k) => {
    let node: ReactNode = k;
    for (let i = 0; i < 7; i++) node = box({ overflow: "hidden" }, node);
    return box({ width: 220, height: 60, overflowY: "auto" }, node);
  },
  "transform-ancestor": (k) =>
    box({ transform: "translateX(4px)", width: 200, height: 44, overflow: "hidden" }, k),
  "filter-ancestor": (k) =>
    box({ filter: "saturate(1.05)", width: 200, height: 44, overflow: "hidden" }, k),
  "contain-paint": (k) => box({ contain: "paint", width: 200, height: 44 }, k),
  "sticky-header": (k) =>
    box(
      { width: 220, height: 70, overflowY: "auto" },
      <>
        {box({ position: "sticky", top: 0, background: "var(--color-fd-card)" }, k)}
        <div style={{ height: 300 }} />
      </>,
    ),
  narrow: (k) => box({ width: 64, overflow: "hidden" }, k),
  "flex-stretch": (k) => box({ display: "flex", alignItems: "stretch", width: 220 }, k),
  "table-cell": (k) => (
    <table>
      <tbody>
        <tr>
          <td style={{ padding: 2 }}>{k}</td>
        </tr>
      </tbody>
    </table>
  ),
  rtl: (k) => box({ direction: "rtl", width: 220 }, k),
  "fluid-w-full": (k) => box({ width: "100%" }, k),
};

const SLUGS = Object.keys(CHART_MODULE_LAZY).sort();

/** Lazily resolves one chart's live preview. */
function Cell({ slug, wrap }: { slug: string; wrap: Wrap }): ReactNode {
  const [Preview, setPreview] = useState<ComponentType<{ animate?: boolean }> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    CHART_MODULE_LAZY[slug]?.()
      .then((m) => {
        const p = (m as unknown as { PreviewLive?: ComponentType<{ animate?: boolean }> })
          .PreviewLive;
        if (!live) return;
        if (p) setPreview(() => p);
        else setFailed(true);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [slug]);
  return (
    <figure data-slug={slug} className="m-0 rounded border border-fd-border p-2">
      <figcaption className="mb-1 font-mono text-[11px] text-fd-muted-foreground">
        {slug}
      </figcaption>
      {failed ? (
        <span className="text-[11px] text-red-500">no live preview</span>
      ) : Preview ? (
        wrap(<Preview />)
      ) : (
        <span className="text-[11px] text-fd-muted-foreground">…</span>
      )}
    </figure>
  );
}

interface Fail {
  slug: string;
  why: string;
}

/**
 * The same measurement `layout-escape.browser.test.tsx` makes, run in the page:
 * a chip must survive every clipping ancestor, stay inside the window, and stay
 * attached to the chart it names. A chip in the top layer is out of the
 * ancestors' reach by definition, so their clips are not applied to it.
 */
function auditChip(host: HTMLElement, chip: HTMLElement): string | null {
  const c = chip.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  const area = Math.max(1, c.width * c.height);
  let x0 = c.left;
  let y0 = c.top;
  let x1 = c.right;
  let y1 = c.bottom;
  if (!chip.matches(":popover-open")) {
    for (let p = chip.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (
        !/hidden|clip|auto|scroll/.test(cs.overflowX + cs.overflowY) &&
        !/paint|strict|content/.test(cs.contain)
      )
        continue;
      const r = p.getBoundingClientRect();
      x0 = Math.max(x0, r.left);
      y0 = Math.max(y0, r.top);
      x1 = Math.min(x1, r.right);
      y1 = Math.min(y1, r.bottom);
    }
  }
  const visible =
    (Math.max(0, Math.min(x1, innerWidth) - Math.max(x0, 0)) *
      Math.max(0, Math.min(y1, innerHeight) - Math.max(y0, 0))) /
    area;
  if (visible < 0.99) return `clipped to ${Math.round(visible * 100)}%`;
  const off = Math.max(c.right - innerWidth, -c.left, c.bottom - innerHeight, -c.top);
  if (off > 0.5) return `${off.toFixed(0)}px off-screen`;
  if (Math.min(c.right, h.right) - Math.max(c.left, h.left) <= 0) return "detached from its chart";
  return null;
}

export default function LayoutLab(): ReactNode {
  const [layout, setLayout] = useState<string>("nested-clippers");
  const [fails, setFails] = useState<Fail[] | null>(null);
  const [busy, setBusy] = useState(false);

  const audit = useCallback(async () => {
    setBusy(true);
    setFails(null);
    const found: Fail[] = [];
    for (const fig of document.querySelectorAll<HTMLElement>("figure[data-slug]")) {
      // Pointer, not focus. The docs previews pass `summary={false}` with no
      // title, so they are decorative — `aria-hidden`, no tab stop — and a
      // `.focus()` on them does nothing. The pointer handlers are bound on the
      // wrapper either way, which is also how a reader opens the chip.
      const host = fig.querySelector<HTMLElement>("[data-mc-host]");
      if (!host) continue;
      // Scroll it under the eye first. The chip carries
      // `position-visibility: anchors-visible`, so a chart parked off-screen
      // correctly has NO visible chip — measuring that as "clipped" says
      // nothing about the layout and reports 62 false failures on this page.
      fig.scrollIntoView({ block: "center" });
      // Let the scroll actually land. Measuring on a 0 ms tick reads rects from
      // mid-scroll and reported 17 charts as clipped that were, checked one by
      // one, sitting correctly above their marks.
      await new Promise((r) => setTimeout(r, 80));
      const b = host.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      const at = (type: string, x: number, y: number): void => {
        host.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            clientX: x,
            clientY: y,
            pointerType: "mouse",
          }),
        );
      };
      /** Settle to a painted frame — rects read mid-scroll are fiction. */
      const frame = (): Promise<void> =>
        new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      // Two samples: some charts read out only away from an endpoint.
      for (const frac of [0.5, 0.75]) {
        const x = b.left + b.width * frac;
        const y = b.top + b.height / 2;
        at("pointerenter", x, y);
        at("pointermove", x, y);
        await frame();
        const chip = host.querySelector<HTMLElement>(".mc-spark-readout");
        if (!chip || !(chip.textContent ?? "").trim()) continue;
        let why = auditChip(host, chip);
        // Confirm before accusing. The chip animates in and the page is still
        // settling, so a single sample reports charts as clipped that are
        // sitting correctly above their marks — verified one by one.
        if (why) {
          await frame();
          why = auditChip(host, chip);
        }
        if (why) {
          found.push({ slug: fig.dataset.slug ?? "?", why });
          break;
        }
      }
      at("pointerleave", b.left - 40, b.top - 40);
    }
    setFails(found);
    setBusy(false);
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-xl font-medium">Layout lab (temporary)</h1>
      <p className="mt-1 max-w-2xl text-sm text-fd-muted-foreground">
        Every chart in one hostile layout. Hover or tab to a chart and watch the readout: it should
        stay whole, stay on screen, and flip below the mark when there is no room above.
      </p>

      <div className="mt-4 flex flex-wrap gap-1">
        {Object.keys(LAYOUTS).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setLayout(name);
              setFails(null);
            }}
            className={`rounded border px-2 py-1 font-mono text-xs ${
              name === layout ? "border-fd-primary bg-fd-primary/10" : "border-fd-border"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={audit}
          disabled={busy}
          className="rounded border border-fd-border px-3 py-1 text-sm"
        >
          {busy ? "auditing…" : "Audit this view"}
        </button>
        {fails ? (
          <span className={`text-sm ${fails.length ? "text-red-500" : "text-green-600"}`}>
            {fails.length
              ? `${fails.length} chart(s) with a clipped or off-screen readout`
              : "every readout whole and on screen"}
          </span>
        ) : null}
      </div>

      {fails?.length ? (
        <ul className="mt-2 font-mono text-xs text-red-500">
          {fails.map((f) => (
            <li key={f.slug}>
              {f.slug} — {f.why}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {SLUGS.map((slug) => (
          <Cell key={`${layout}:${slug}`} slug={slug} wrap={LAYOUTS[layout]!} />
        ))}
      </div>
    </main>
  );
}
