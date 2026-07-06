import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const revalidate = false;
export const dynamic = "force-static";
export const contentType = "image/png";

const size = { width: 1200, height: 630 };

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#fbfaf7",
        color: "#191712",
        fontFamily: "Georgia, serif",
        position: "relative",
      }}
    >
      {/* wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "monospace" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#0f66a6",
            display: "flex",
          }}
        />
        <div style={{ fontSize: 28, letterSpacing: "-0.01em", color: "#191712" }}>microcharts</div>
      </div>

      {/* headline + inline chart */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 88, lineHeight: 1.02, letterSpacing: "-0.03em", maxWidth: 940 }}>
          {SITE.tagline}
        </div>
        <svg width="1056" height="120" viewBox="0 0 1056 120" style={{ marginTop: 34 }}>
          <polyline
            points="0,96 120,80 240,88 360,52 480,64 600,30 720,44 840,14 960,26 1056,4"
            fill="none"
            stroke="#0f66a6"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="1056" cy="4" r="9" fill="#0f66a6" />
        </svg>
      </div>

      {/* footer */}
      <div style={{ display: "flex", fontSize: 26, color: "#6b6659", fontFamily: "monospace" }}>
        Zero deps · RSC-safe · Accessible by default
      </div>
    </div>,
    size,
  );
}
