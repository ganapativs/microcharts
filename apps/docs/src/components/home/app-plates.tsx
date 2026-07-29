import { SHOWCASE } from "@/lib/showcase";
import { getModule } from "@/lib/charts/registry";

/**
 * Act IV — wear it. The seven example apps in `examples/`, each installing
 * `@microcharts/react` from npm the way a consumer would and deployed so a
 * reader can click through. Between them they import every type in the catalog —
 * the union of their `charts` lists is exactly the stable catalog, and
 * `home.test.ts` asserts it.
 *
 * Plate width follows how many catalog types each app uses, and that count comes
 * from the example's own imports, so a plate cannot claim a mark its app doesn't
 * render. Width is the whole encoding; rows are flush.
 *
 * Each plate is drawn in a different chart preset, so the reader sees what
 * `defineTheme` spans before touching the masthead control. Two are the app's own
 * (Dispatch ships editorial, Shipyard ships mono, both stated in the showcase
 * registry); the rest are this page's rendering choice, and the plate says which.
 */
type Plate = {
  slug: string;
  /** Chart preset this plate is drawn in. */
  preset: string;
  /** `true` ⇒ the app itself ships this preset (showcase `tag` says so). */
  own?: boolean;
  /** Three slugs from the app's own import list. */
  marks: [string, string, string];
  /** 12-column placement. Rows are flush; only the span varies. */
  place: { gridColumn: string; gridRow: string };
};

/**
 * Two rules on the three slugs. No text-shaped marks (TokenConfidence, FillWord,
 * FatDigits) — they set real prose at real sizes and overrun an 88px slot — and
 * every mark must draw at roughly 88×26, its natural aspect, or the band reads as
 * three unrelated objects sharing a row.
 *
 * Each trio has to be the app's own (`home.test.ts` checks every slug against
 * that app's import list), and the three should differ in texture: a line, a
 * field and a set of bars beats three strips.
 */
const PLATES: Plate[] = [
  {
    slug: "pulse",
    preset: "modern",
    marks: ["sparkline", "funnel", "retention-curve"],
    place: { gridColumn: "1 / 8", gridRow: "1" },
  },
  {
    slug: "ledger",
    preset: "vivid",
    marks: ["ohlc", "volume-profile", "tape-gauge"],
    place: { gridColumn: "8 / 13", gridRow: "1" },
  },
  {
    slug: "atlas",
    preset: "print",
    marks: ["mini-bar", "percentile-ladder", "stacked-area"],
    place: { gridColumn: "1 / 7", gridRow: "2" },
  },
  {
    slug: "vitals",
    preset: "eink",
    marks: ["hypnogram", "cycle-plot", "streak-spark"],
    place: { gridColumn: "7 / 13", gridRow: "2" },
  },
  {
    slug: "cortex",
    preset: "editorial",
    marks: ["calibration-strip", "waveform", "rubric-strip"],
    place: { gridColumn: "1 / 5", gridRow: "3" },
  },
  {
    slug: "shipyard",
    preset: "mono",
    own: true,
    marks: ["error-budget", "seismogram", "micro-box"],
    place: { gridColumn: "5 / 9", gridRow: "3" },
  },
  {
    slug: "dispatch",
    preset: "editorial",
    own: true,
    marks: ["sparkbar", "likert-strip", "music-staff"],
    place: { gridColumn: "9 / 13", gridRow: "3" },
  },
];

export function AppPlates({ catalogTotal }: { catalogTotal: number }) {
  return (
    <>
      <div className="plates u-block">
        {PLATES.map((p) => {
          const app = SHOWCASE.find((a) => a.slug === p.slug);
          if (!app) return null;
          return (
            <div
              key={p.slug}
              data-home-preset={p.preset === "modern" ? undefined : p.preset}
              // `display:grid` and no `alignSelf`, so the plate stretches to its
              // row's height: with rows flush, two plates side by side that end at
              // different heights are exactly what made the old arrangement look
              // accidental. The anchor inside stretches with it.
              style={{ position: "relative", display: "grid", ...p.place }}
            >
              <a
                href={`/examples/${app.slug}`}
                className="plate group grid gap-3.5 px-4 pb-10 pt-4 sm:px-5 sm:pt-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className="font-mono text-[13px] font-medium leading-none tracking-[-0.03em] transition-colors group-hover:text-[var(--mc-accent)]"
                    style={{ color: "var(--ink)" }}
                  >
                    {app.name}
                  </h3>
                  <span className="kicker shrink-0">
                    {app.charts.length} of {catalogTotal}
                  </span>
                </div>

                {/* Two lines of room, always: the blurbs run one line or two, and
                    a self-sizing paragraph put the specimen band at four
                    different heights across seven plates. */}
                <p className="plate-blurb text-[15px] leading-[1.5] text-pretty">{app.blurb}</p>

                {/* Three equal slots, not a flex row: packed left with a gap, the
                    18–88px marks gave every plate its own tick positions and row
                    height. */}
                <div aria-hidden className="plate-marks">
                  {p.marks.map((slug) => {
                    const mod = getModule(slug);
                    if (!mod) return null;
                    const { Mark, entry } = mod;
                    return (
                      <span key={slug} className="plate-mark text-[0.6rem]">
                        <Mark data={entry.demo} width={88} height={26} />
                      </span>
                    );
                  })}
                </div>

                <span
                  className="absolute inset-x-4 bottom-3 flex items-baseline justify-between gap-3 font-mono text-[10px] tracking-[-0.02em] sm:inset-x-5"
                  style={{ color: "var(--ink-3)" }}
                >
                  <span className="truncate">{app.host}</span>
                  {/* "ships" vs "in": the app's own preset, or this page's choice
                      of how to draw the plate. */}
                  <span className="shrink-0">
                    {p.own ? "ships " : "in "}
                    {p.preset}
                  </span>
                </span>
              </a>
            </div>
          );
        })}
      </div>
    </>
  );
}
