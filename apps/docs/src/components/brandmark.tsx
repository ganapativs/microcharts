import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";

/**
 * microcharts brand mark — three data cells climbing a diagonal, fill graded
 * faint → solid (ActivityGrid DNA; ownable, crisp at a 16 px favicon). Geometry
 * is the single canonical spec in `lib/brand.ts`, shared with the favicon /
 * apple icon / OG badge so every surface matches exactly.
 *
 * variant "solid" → accent squircle, near-white cells knocked out (the standard
 *                    logo: nav, favicon, wordmark badge).
 * variant "line"  → transparent, cells in currentColor (footers, mono contexts).
 */
export function Brandmark({
  size = 24,
  variant = "solid",
  className,
}: {
  size?: number;
  variant?: "solid" | "line";
  className?: string;
}) {
  if (variant === "line") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className={className}
      >
        {CELLS.map((c) => (
          <rect
            key={c.x}
            x={c.x}
            y={c.y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={CELL_R}
            fill="currentColor"
            opacity={c.o}
          />
        ))}
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <path d={SQUIRCLE_PATH} className="fill-fd-primary" />
      {CELLS.map((c) => (
        <rect
          key={c.x}
          x={c.x}
          y={c.y}
          width={CELL_SIZE}
          height={CELL_SIZE}
          rx={CELL_R}
          fill={CELL_FILL}
          opacity={c.o}
        />
      ))}
    </svg>
  );
}
