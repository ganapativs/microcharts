import { getPageImage, source } from "@/lib/source";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { getChart } from "@/lib/charts/entries";
import { SIZE_MARKETING } from "@/lib/docs-facts";
import { OgChartMark } from "@/lib/og-chart-mark";
import { OgShell, ogTitleSize } from "@/lib/og-shell";
import { OG, OG_SIZE } from "@/lib/og-theme";

export const revalidate = false;
export const dynamic = "force-static";
export const contentType = "image/png";

const COLLECTION: Record<string, string> = {
  core: "Core",
  decision: "Decision",
  expressive: "Expressive",
  frontier: "Frontier",
};

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).replace(/\s+\S*$/, "")}…`;
}

export async function GET(_req: Request, { params }: RouteContext<"/og/docs/[...slug]">) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const chartSlug = page.slugs[0] === "charts" ? page.slugs[1] : undefined;
  const chart = chartSlug ? getChart(chartSlug) : undefined;

  const title = chart?.name ?? page.data.title;
  const eyebrow = chart
    ? `${COLLECTION[chart.collection] ?? chart.collection} · React chart`
    : "Docs";
  const blurb = clip(chart?.tagline ?? page.data.description ?? "", chart ? 100 : 160);
  const footerLeft = chart
    ? `Word-sized · ${SIZE_MARKETING} · Accessible`
    : `Zero deps · ${SIZE_MARKETING} · Accessible by default`;

  return new ImageResponse(
    <OgShell footerLeft={footerLeft}>
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: chart ? 460 : 980,
            flexShrink: 1,
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
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: ogTitleSize(title),
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              fontWeight: 700,
              maxWidth: "100%",
            }}
          >
            {title}
          </div>
          {blurb ? (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                lineHeight: 1.35,
                color: OG.muted,
                maxWidth: 440,
              }}
            >
              {blurb}
            </div>
          ) : null}
          {chart ? (
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {["SVG", "RSC-safe", "@microcharts/react"].map((t) => (
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
          ) : null}
        </div>
        {chartSlug ? <OgChartMark slug={chartSlug} /> : null}
      </div>
    </OgShell>,
    OG_SIZE,
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: getPageImage(page).segments,
  }));
}
