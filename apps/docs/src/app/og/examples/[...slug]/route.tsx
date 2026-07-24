import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getShowcase, SHOWCASE } from "@/lib/showcase";
import { CATALOG } from "@/lib/docs-facts";
import { OgShell, ogTitleSize } from "@/lib/og-shell";
import { OG, OG_SIZE } from "@/lib/og-theme";

export const revalidate = false;
export const dynamic = "force-static";
export const contentType = "image/png";

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).replace(/\s+\S*$/, "")}…`;
}

export async function GET(_req: Request, { params }: RouteContext<"/og/examples/[...slug]">) {
  // URL is /og/examples/<slug>/image.png — drop the trailing "image.png".
  const { slug } = await params;
  const app = getShowcase(slug[0] ?? "");
  if (!app) notFound();

  return new ImageResponse(
    <OgShell footerLeft={`microcharts example · ${app.charts.length} of ${CATALOG.total} types`}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          maxWidth: 980,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: OG.accent,
            fontFamily: "monospace",
            fontWeight: 600,
          }}
        >
          Example · {app.tag}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: ogTitleSize(app.name),
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            fontWeight: 700,
          }}
        >
          {app.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            lineHeight: 1.35,
            color: OG.muted,
            maxWidth: 900,
          }}
        >
          {clip(app.blurb, 120)}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          {["@microcharts/react", "from npm", "0 deps"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "8px 14px",
                borderRadius: 999,
                border: `1px solid ${OG.rule}`,
                background: OG.card,
                fontSize: 15,
                fontFamily: "monospace",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </OgShell>,
    OG_SIZE,
  );
}

export function generateStaticParams() {
  return SHOWCASE.map((a) => ({ slug: [a.slug, "image.png"] }));
}
