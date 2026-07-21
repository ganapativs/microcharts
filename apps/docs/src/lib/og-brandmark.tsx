import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";
import { OG } from "@/lib/og-theme";

/** Same geometry as `<Brandmark variant="solid">` — Satori-safe (inline fill, no CSS). */
export function OgBrandmark({ size = 44, fill = OG.accent }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d={SQUIRCLE_PATH} fill={fill} />
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
