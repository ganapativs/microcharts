import type { ReactNode } from "react";
import { OgBrandmark } from "@/lib/og-brandmark";
import { SITE } from "@/lib/site";
import { OG, OG_GRID_H, OG_GRID_V } from "@/lib/og-theme";

/** Paper + graph grid + brand header/footer — main column is the caller's job. */
export function OgShell({ children, footerLeft }: { children: ReactNode; footerLeft: string }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        background: OG.paper,
        color: OG.ink,
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        width="1200"
        height="630"
        style={{ position: "absolute", top: 0, left: 0 }}
        aria-hidden="true"
      >
        {OG_GRID_V.map((i) => (
          <line
            key={`v${i}`}
            x1={i * 50}
            y1={0}
            x2={i * 50}
            y2={630}
            stroke={OG.rule}
            strokeWidth={1}
            opacity={0.55}
          />
        ))}
        {OG_GRID_H.map((i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 50}
            x2={1200}
            y2={i * 50}
            stroke={OG.rule}
            strokeWidth={1}
            opacity={0.55}
          />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: -40,
          top: -40,
          width: 480,
          height: 400,
          borderRadius: 999,
          background: OG.accent,
          opacity: 0.06,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "48px 56px 40px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <OgBrandmark size={44} />
            <div
              style={{ display: "flex", fontSize: 28, fontWeight: 600, fontFamily: "monospace" }}
            >
              {SITE.name}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 20, color: OG.muted, fontFamily: "monospace" }}>
            {SITE.pkg}
          </div>
        </div>

        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", width: "100%" }}>
          {children}
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 18,
            borderTop: `1px solid ${OG.rule}`,
          }}
        >
          <div style={{ display: "flex", fontSize: 18, color: OG.muted, fontFamily: "monospace" }}>
            {footerLeft}
          </div>
          <div style={{ display: "flex", fontSize: 18, color: OG.muted, fontFamily: "monospace" }}>
            microcharts.dev
          </div>
        </div>
      </div>
    </div>
  );
}

export function ogTitleSize(name: string): number {
  if (name.length > 18) return 48;
  if (name.length > 14) return 56;
  if (name.length > 10) return 68;
  return 84;
}
