import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The instrument card — the site's repeating frame for a live chart.
 * Hairline panel, mono label, precise meta. Consistent premium rhythm.
 */
export function Instrument({
  label,
  meta,
  children,
  caption,
  className,
  bodyClassName,
  grid = false,
}: {
  label?: string;
  meta?: ReactNode;
  children: ReactNode;
  caption?: ReactNode;
  className?: string;
  bodyClassName?: string;
  grid?: boolean;
}) {
  return (
    <figure className={cn("panel overflow-hidden", className)}>
      {(label || meta) && (
        <figcaption className="flex items-baseline justify-between gap-3 border-b border-fd-border px-4 py-2.5">
          {label ? <span className="mono-label">{label}</span> : <span />}
          {meta ? <span className="mono-label opacity-70">{meta}</span> : null}
        </figcaption>
      )}
      <div
        className={cn(
          "flex min-h-24 items-center justify-center px-5 py-8",
          grid && "grid-paper",
          bodyClassName,
        )}
      >
        {children}
      </div>
      {caption ? (
        <div className="border-t border-fd-border px-4 py-2.5 text-sm text-fd-muted-foreground">
          {caption}
        </div>
      ) : null}
    </figure>
  );
}
