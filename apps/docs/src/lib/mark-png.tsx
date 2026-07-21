import { ImageResponse } from "next/og";
import { CELL_FILL, CELL_R, CELL_SIZE, CELLS } from "@/lib/brand";
import { envIcon } from "@/lib/env-badge";

/** Shared PNG mark for PWA / manifest icons (apple-touch stays on /apple-icon). */
export function markPng(size: number) {
  const { bg } = envIcon();
  const mark = Math.round(size * 0.67);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
      }}
    >
      <svg width={mark} height={mark} viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
    </div>,
    { width: size, height: size },
  );
}
