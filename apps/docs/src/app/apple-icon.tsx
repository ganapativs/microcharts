import { ImageResponse } from "next/og";
import { CELL_FILL, CELL_R, CELL_SIZE, CELLS } from "@/lib/brand";
import { envIcon } from "@/lib/env-badge";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — same canonical mark, env-tinted background. PNG because
// apple-touch-icon must be raster; the favicon proper stays SVG.
export default function AppleIcon() {
  const { bg } = envIcon();
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
      <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
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
    size,
  );
}
