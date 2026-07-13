import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";

/**
 * Brand mark — three cells on a diagonal. Geometry from `lib/brand.ts`.
 * solid: accent squircle + near-white cells · line: currentColor cells ·
 * outline: hairline squircle + cells (footer letterpress).
 */
export function Brandmark({
  size = 24,
  variant = "solid",
  className,
}: {
  size?: number;
  variant?: "solid" | "line" | "outline";
  className?: string;
}) {
  if (variant === "outline") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className={className}
      >
        <path d={SQUIRCLE_PATH} stroke="currentColor" strokeWidth={1.5} opacity={0.55} />
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
