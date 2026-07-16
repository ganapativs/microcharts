"use client";
import { createPortal } from "react-dom";
import {
  ArrowDownAZ,
  ArrowUp,
  Grid2x2,
  Grid3x3,
  ListOrdered,
  Search,
  Sparkles,
  Square,
} from "lucide-react";
import type { ChartCollection } from "@/lib/charts/types";
import { setGalleryMode } from "./gallery-mode";
import { useGalleryDock } from "./use-gallery-dock";

export function GalleryDockBar({
  counts,
  collections,
}: {
  counts: Record<string, number>;
  collections: { key: ChartCollection; label: string }[];
}) {
  const {
    mounted,
    q,
    setQ,
    col,
    setCol,
    density,
    setDensity,
    sort,
    setSort,
    shown,
    atTop,
    dockHidden,
    mode,
    inputRef,
  } = useGalleryDock(collections);

  const total = counts.all ?? 0;
  const pills = [{ key: "all", label: "All" }, ...collections] as {
    key: string;
    label: string;
  }[];

  if (!mounted) return null;

  return createPortal(
    <div
      className="g2-dock"
      role="region"
      aria-label="Gallery controls"
      data-hidden={dockHidden || undefined}
    >
      <div className="g2-dock-bar">
        <div className="flex items-center gap-0.5">
          {pills.map((p) => {
            const n = counts[p.key] ?? 0;
            const empty = p.key !== "all" && n === 0;
            const active = col === p.key;
            return (
              <button
                key={p.key}
                type="button"
                className="g2-pill"
                onClick={() => !empty && setCol(p.key)}
                disabled={empty}
                aria-pressed={active}
                title={empty ? "Coming before launch" : undefined}
              >
                {p.label}
                <span className="g2-pill-n">{empty ? "soon" : n}</span>
              </button>
            );
          })}
        </div>

        <span className="g2-dock-div" aria-hidden />
        <div className="g2-dock-search">
          <Search className="size-4" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search…"
            aria-label="Search charts"
          />
        </div>
        <div className="g2-seg" role="group" aria-label="Render mode">
          {(
            [
              { key: "live" as const, Icon: Sparkles, label: "Live: interactive, animated" },
              { key: "static" as const, Icon: Square, label: "Static: no motion" },
            ] as const
          ).map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              className="g2-icon-btn"
              onClick={() => setGalleryMode(key)}
              aria-pressed={mode === key}
              title={label}
              aria-label={label}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
        <div className="g2-seg" role="group" aria-label="Density">
          {(
            [
              { key: "comfortable", Icon: Grid2x2, label: "Comfortable" },
              { key: "compact", Icon: Grid3x3, label: "Compact" },
            ] as const
          ).map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              className="g2-icon-btn"
              onClick={() => setDensity(key)}
              aria-pressed={density === key}
              title={`${label} density`}
              aria-label={`${label} density`}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
        <div className="g2-seg" role="group" aria-label="Sort">
          {(
            [
              { key: "catalog", Icon: ListOrdered, label: "Catalog order" },
              { key: "name", Icon: ArrowDownAZ, label: "A–Z by name" },
            ] as const
          ).map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              className="g2-icon-btn"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              title={label}
              aria-label={label}
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>

        <span className="g2-dock-div" aria-hidden />
        <span className="g2-dock-count" role="status" aria-live="polite">
          {shown !== null && shown !== total ? shown : total}
        </span>
        <button
          type="button"
          className="g2-icon-btn g2-top"
          data-show={atTop ? undefined : "true"}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp className="size-4" aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
