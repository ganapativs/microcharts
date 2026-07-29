import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";
import { CATALOG, SIZE_MARKETING } from "@/lib/docs-facts";
import { OgBrandmark } from "@/lib/og-brandmark";
import { OG, OG_GRID_H, OG_GRID_V, OG_SIZE } from "@/lib/og-theme";

export const revalidate = false;
export const dynamic = "force-static";
export const contentType = "image/png";

const size = OG_SIZE;

const INK = OG.ink;
const MUTED = OG.muted;
const PAPER = OG.paper;
const CARD = OG.card;
const RULE = OG.rule;
const ACCENT = OG.accent;
const POS = "#0e7a5f";
const NEG = "#bd4b2d";
// The site's real cobalt-derived categorical ramp (defineTheme light .vars),
// same values the base :root carries in global.css.
const CAT = ["#6b87cb", "#8c548c", "#c26e65", "#876701"] as const;

const BARS = [
  { id: "b0", h: 12 },
  { id: "b1", h: 20 },
  { id: "b2", h: 16 },
  { id: "b3", h: 28 },
  { id: "b4", h: 22 },
  { id: "b5", h: 34 },
  { id: "b6", h: 26 },
  { id: "b7", h: 36 },
] as const;

const HEAT = [
  { id: "h0", o: 0.2 },
  { id: "h1", o: 0.35 },
  { id: "h2", o: 0.55 },
  { id: "h3", o: 0.4 },
  { id: "h4", o: 0.7 },
  { id: "h5", o: 0.85 },
  { id: "h6", o: 0.6 },
  { id: "h7", o: 0.95 },
  { id: "h8", o: 0.75 },
  { id: "h9", o: 1 },
] as const;

const WIN = [
  { id: "w0", s: 1 },
  { id: "w1", s: 1 },
  { id: "w2", s: -1 },
  { id: "w3", s: 1 },
  { id: "w4", s: -1 },
  { id: "w5", s: 1 },
  { id: "w6", s: 1 },
  { id: "w7", s: -1 },
  { id: "w8", s: 1 },
  { id: "w9", s: 1 },
] as const;

const GRID_V = OG_GRID_V;
const GRID_H = OG_GRID_H;

/** Specimen marks — geometry inset so strokes/markers never clip the frame. */
const SPECIMENS = [
  {
    label: "Sparkline",
    svg: (
      <svg width="144" height="36" viewBox="0 0 156 40" aria-hidden="true">
        <path
          d="M8,40 8,32 28,26 48,29 68,18 88,22 108,12 128,16 148,7 148,40 Z"
          fill={ACCENT}
          opacity="0.12"
        />
        <polyline
          points="8,32 28,26 48,29 68,18 88,22 108,12 128,16 148,7"
          fill="none"
          stroke={ACCENT}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="148" cy="7" r="4.5" fill={ACCENT} />
      </svg>
    ),
  },
  {
    label: "Bars",
    svg: (
      <svg width="144" height="36" viewBox="0 0 156 40" aria-hidden="true">
        {BARS.map((b, i) => (
          <rect
            key={b.id}
            x={8 + i * 18}
            y={38 - b.h}
            width="11"
            height={b.h}
            rx="2"
            fill={i === BARS.length - 1 ? ACCENT : "#c9bfb0"}
          />
        ))}
      </svg>
    ),
  },
  {
    label: "Heat",
    svg: (
      <svg width="144" height="36" viewBox="0 0 156 40" aria-hidden="true">
        {HEAT.map((c, i) => (
          <rect
            key={c.id}
            x={6 + i * 15}
            y="10"
            width="12"
            height="20"
            rx="3"
            fill={ACCENT}
            opacity={c.o}
          />
        ))}
      </svg>
    ),
  },
  {
    label: "Activity",
    svg: (
      <svg width="144" height="36" viewBox="0 0 156 40" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => {
          const col = i % 10;
          const row = Math.floor(i / 10);
          const o = 0.2 + ((i * 17) % 80) / 100;
          return (
            <rect
              key={`g${row}-${col}`}
              x={8 + col * 14}
              y={2 + row * 9.5}
              width="10"
              height="7.5"
              rx="2"
              fill={ACCENT}
              opacity={o}
            />
          );
        })}
      </svg>
    ),
  },
  {
    label: "Segments",
    svg: (
      <svg width="144" height="36" viewBox="0 0 156 40" aria-hidden="true">
        <rect x="6" y="14" width="52" height="12" rx="3" fill={CAT[0]} />
        <rect x="61" y="14" width="34" height="12" rx="3" fill={CAT[1]} />
        <rect x="98" y="14" width="28" height="12" rx="3" fill={CAT[2]} />
        <rect x="129" y="14" width="21" height="12" rx="3" fill={CAT[3]} />
      </svg>
    ),
  },
  {
    label: "Bullet",
    svg: (
      <svg width="144" height="36" viewBox="0 0 156 40" aria-hidden="true">
        <rect x="6" y="14" width="144" height="12" rx="3" fill="#ebe4d8" />
        <rect x="6" y="14" width="96" height="12" rx="3" fill="#d7cfc0" />
        <rect x="6" y="17" width="78" height="6" rx="2" fill={ACCENT} />
        <rect x="108" y="12" width="3" height="16" rx="1" fill={INK} />
      </svg>
    ),
  },
  {
    label: "Ring",
    svg: (
      <svg width="144" height="36" viewBox="0 0 156 40" aria-hidden="true">
        <circle cx="78" cy="20" r="14" fill="none" stroke="#ebe4d8" strokeWidth="5" />
        <circle
          cx="78"
          cy="20"
          r="14"
          fill="none"
          stroke={ACCENT}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 14 * 0.72} ${2 * Math.PI * 14}`}
          transform="rotate(-90 78 20)"
        />
      </svg>
    ),
  },
  {
    label: "Delta",
    svg: (
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: POS,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 2L14 13H2L8 2Z" fill={POS} />
          </svg>
          +12.4%
        </div>
        <svg width="54" height="28" viewBox="0 0 54 28" aria-hidden="true">
          <polyline
            points="2,22 12,18 22,20 32,10 42,12 50,6"
            fill="none"
            stroke={POS}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
  },
  {
    label: "Win / loss",
    svg: (
      <svg width="144" height="36" viewBox="0 0 156 40" aria-hidden="true">
        <line x1="6" y1="20" x2="150" y2="20" stroke={RULE} strokeWidth="1" />
        {WIN.map((w, i) => (
          <rect
            key={w.id}
            x={10 + i * 14}
            y={w.s > 0 ? 6 : 20}
            width="9"
            height="14"
            rx="2"
            fill={w.s > 0 ? POS : NEG}
          />
        ))}
      </svg>
    ),
  },
] as const;

const ROWS = [
  { id: "r0", tiles: SPECIMENS.slice(0, 3) },
  { id: "r1", tiles: SPECIMENS.slice(3, 6) },
  { id: "r2", tiles: SPECIMENS.slice(6, 9) },
] as const;

export function GET() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        background: PAPER,
        color: INK,
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
        {GRID_V.map((i) => (
          <line
            key={`v${i}`}
            x1={i * 50}
            y1={0}
            x2={i * 50}
            y2={630}
            stroke={RULE}
            strokeWidth={1}
            opacity={0.55}
          />
        ))}
        {GRID_H.map((i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 50}
            x2={1200}
            y2={i * 50}
            stroke={RULE}
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
          background: ACCENT,
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
            <OgBrandmark size={44} fill={ACCENT} />
            <div
              style={{ display: "flex", fontSize: 28, fontWeight: 600, fontFamily: "monospace" }}
            >
              microcharts
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 20, color: MUTED, fontFamily: "monospace" }}>
            {SITE.pkg}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            flexGrow: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 500,
              gap: 22,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 58,
                lineHeight: 1.12,
                letterSpacing: "-0.035em",
                fontWeight: 700,
              }}
            >
              {SITE.tagline}
            </div>
            <div style={{ display: "flex", fontSize: 23, lineHeight: 1.4, color: MUTED }}>
              {`${CATALOG.total} types that sit inside a sentence, a table cell, or a streamed reply.`}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["Zero deps", "RSC-safe", "Accessible"].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: `1px solid ${RULE}`,
                    background: CARD,
                    fontSize: 15,
                    fontFamily: "monospace",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 540,
              gap: 12,
              marginLeft: "auto",
              justifyContent: "center",
            }}
          >
            {ROWS.map((row) => (
              <div key={row.id} style={{ display: "flex", gap: 12 }}>
                {row.tiles.map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      padding: "12px 14px 14px",
                      background: CARD,
                      border: `1px solid ${RULE}`,
                      borderRadius: 12,
                      width: 172,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: MUTED,
                        fontFamily: "monospace",
                      }}
                    >
                      {s.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", height: 36 }}>{s.svg}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 18,
            borderTop: `1px solid ${RULE}`,
          }}
        >
          <div style={{ display: "flex", fontSize: 18, color: MUTED, fontFamily: "monospace" }}>
            {`Zero deps · ${SIZE_MARKETING} · Accessible by default`}
          </div>
          <div style={{ display: "flex", fontSize: 18, color: MUTED, fontFamily: "monospace" }}>
            microcharts.dev
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
