import type { ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { TrendArrow } from "@microcharts/react/trend-arrow/interactive";
import { StatusDot } from "@microcharts/react/status-dot/interactive";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { Dumbbell } from "@microcharts/react/dumbbell/interactive";
import { Slope } from "@microcharts/react/slope/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { LikertStrip } from "@microcharts/react/likert-strip/interactive";
import { PartitionStrip } from "@microcharts/react/partition-strip/interactive";
import { PairedBars } from "@microcharts/react/paired-bars/interactive";
import { StationGlyph } from "@microcharts/react/station-glyph/interactive";
import { WindBarb } from "@microcharts/react/wind-barb";
import { MoonPhase } from "@microcharts/react/moon-phase/interactive";
import { Hourglass } from "@microcharts/react/hourglass/interactive";
import { FillWord } from "@microcharts/react/fill-word/interactive";
import { DicePips } from "@microcharts/react/dice-pips/interactive";
import { GardenGrid } from "@microcharts/react/garden-grid/interactive";
import { MusicStaff } from "@microcharts/react/music-staff/interactive";
import { Threshold, Marker } from "@microcharts/react/annotations";
import {
  breachIndex,
  budgetComposition,
  districtSpend,
  exportDestinations,
  futuresSeries,
  harvestSwing,
  moonTonight,
  prevailingWind,
  priceCeiling,
  priceNow,
  priceYearAgo,
  rainfallAnomaly,
  rainfallByRegion,
  rainRhythm,
  readerPoll,
  reservoirFraction,
  retailYoY,
  solsticeElapsed,
  springRunUp,
  stations,
  weekHighs,
  yieldsByCountry,
} from "../data";

type Role = "inline" | "figure" | "glyph";

type IndexEntry = {
  name: string;
  role: Role;
  caption: string;
  demo: ReactNode;
};

const inline = (demo: ReactNode): ReactNode => <span className="mc-inline">{demo}</span>;

const ENTRIES: IndexEntry[] = [
  {
    name: "Sparkline",
    role: "inline",
    caption:
      "A run of values compressed onto the baseline: “prices climbed [chart] through the spring.”",
    demo: inline(
      <Sparkline data={springRunUp} width={64} height={20} summary={false} dots="none" />,
    ),
  },
  {
    name: "Delta",
    role: "inline",
    caption:
      "A signed change against a prior value — with `from`, it reads as a percent, set in running text.",
    demo: <Delta value={priceNow} from={priceYearAgo} positive="down" summary={false} />,
  },
  {
    name: "TrendArrow",
    role: "inline",
    caption: "Direction of movement as a single glyph, tuned for the flow of a sentence.",
    demo: inline(<TrendArrow value={-retailYoY} glyph="chevron" positive="up" summary={false} />),
  },
  {
    name: "SparkBar",
    role: "inline",
    caption: "A win/loss streak of successive periods: each bar one interval against the last.",
    demo: inline(
      <SparkBar data={harvestSwing} width={56} height={20} mode="winloss" summary={false} />,
    ),
  },
  {
    name: "StatusDot",
    role: "inline",
    caption: "A state token mid-sentence: “supply remains [dot] constrained.”",
    demo: inline(<StatusDot status="warn" summary={false} />),
  },
  {
    name: "HistogramStrip",
    role: "figure",
    caption: "The shape of a distribution, with one bin marked to show where the median falls.",
    demo: (
      <HistogramStrip
        data={rainfallAnomaly}
        bins={10}
        markValue={-410}
        width={520}
        height={110}
        format={{ maximumFractionDigits: 0 }}
        summary={false}
      />
    ),
  },
  {
    name: "Dumbbell",
    role: "figure",
    caption: "Before and after by category — the normal season against this one.",
    demo: (
      <Dumbbell
        data={rainfallByRegion}
        highlight="Minas Gerais"
        positive="up"
        label="value"
        domain={[700, 2100]}
        width={640}
        height={200}
        format={{ maximumFractionDigits: 0 }}
        summary={false}
        style={{ width: "100%", height: "auto" }}
      />
    ),
  },
  {
    name: "Slope",
    role: "figure",
    caption:
      "A two-point comparison across items — yields then and now, for Brazil, Vietnam, Colombia, Ethiopia and Honduras.",
    demo: (
      <Slope
        data={yieldsByCountry}
        highlight="Vietnam"
        positive="up"
        label="value"
        width={640}
        height={280}
        format={{ maximumFractionDigits: 0 }}
        summary={false}
        style={{ width: "100%", height: "auto" }}
      />
    ),
  },
  {
    name: "SegmentedBar",
    role: "figure",
    caption: "Composition as parts of a whole — where the crop is consumed.",
    demo: (
      <SegmentedBar
        data={exportDestinations}
        label="percent"
        width={520}
        height={52}
        summary={false}
      />
    ),
  },
  {
    name: "PartitionStrip",
    role: "figure",
    caption:
      "A two-level breakdown — program areas over line items, each width its share of the whole.",
    demo: (
      <PartitionStrip data={budgetComposition} labels width={520} height={120} summary={false} />
    ),
  },
  {
    name: "PairedBars",
    role: "figure",
    caption: "Two series per row, zero-anchored — budget as a ghost behind the actual spend.",
    demo: (
      <PairedBars
        data={districtSpend}
        mode="overlay"
        orientation="horizontal"
        positive="down"
        width={520}
        height={170}
        format={{ maximumFractionDigits: 1 }}
        summary={false}
      />
    ),
  },
  {
    name: "LikertStrip",
    role: "figure",
    caption: "A survey row diverging from a center line — disagreement left, agreement right.",
    demo: (
      <div style={{ paddingRight: 14 }}>
        <LikertStrip
          data={readerPoll}
          neutral="split"
          label="ends"
          width={520}
          height={64}
          summary={false}
        />
      </div>
    ),
  },
  {
    name: "Sparkline + annotations",
    role: "figure",
    caption: "A full-width series carrying a Threshold hairline and a Marker flag as children.",
    demo: (
      <Sparkline
        data={futuresSeries}
        width={520}
        height={140}
        fill
        dots="minmax"
        format={{ maximumFractionDigits: 0 }}
        summary={false}
      >
        <Threshold y={priceCeiling} label="300¢" />
        <Marker x={breachIndex} label="Breach" />
      </Sparkline>
    ),
  },
  {
    name: "StationGlyph",
    role: "glyph",
    caption:
      "The meteorologist's dense station model — sky cover, wind, and three corner numerals in one cell.",
    demo: (
      <StationGlyph
        station={stations[0].station}
        cloud={stations[0].cloud}
        wind={stations[0].wind}
        temp={stations[0].temp}
        dewpoint={stations[0].dewpoint}
        pressure={stations[0].pressure}
        size={72}
        summary={false}
      />
    ),
  },
  {
    name: "WindBarb",
    role: "glyph",
    caption: "Direction as shaft angle, strength as quantized barbs — each barb ten.",
    demo: (
      <WindBarb
        direction={prevailingWind.direction}
        magnitude={prevailingWind.magnitude}
        step={10}
        label="value"
        size={72}
        summary={false}
      />
    ),
  },
  {
    name: "MoonPhase",
    role: "glyph",
    caption: "An illuminated fraction as the lit face of the moon.",
    demo: <MoonPhase value={moonTonight} mode="cycle" size={72} summary={false} />,
  },
  {
    name: "Hourglass",
    role: "glyph",
    caption: "A deadline as sand — top remaining, bottom elapsed.",
    demo: (
      <Hourglass value={solsticeElapsed} label="remaining" width={54} height={72} summary={false} />
    ),
  },
  {
    name: "FillWord",
    role: "glyph",
    caption: "A labelled progress read where the word is the metric and the ink is the value.",
    demo: (
      <FillWord
        word="RESERVOIR"
        value={reservoirFraction}
        mode="fill"
        label="value"
        fontSize={24}
        summary={false}
      />
    ),
  },
  {
    name: "DicePips",
    role: "glyph",
    caption: "A subitized count 0–6 on a die — severity or rating in a single cell.",
    demo: <DicePips value={4} size={56} summary={false} />,
  },
  {
    name: "GardenGrid",
    role: "glyph",
    caption: "A calendar-shaped intensity, quantized to five gray steps for print.",
    demo: (
      <GardenGrid data={rainRhythm} rows={7} steps={5} unit="rain days" cell={12} summary={false} />
    ),
  },
  {
    name: "MusicStaff",
    role: "glyph",
    caption: "A short series as pitch on a five-line staff — a week read as a melody.",
    demo: (
      <MusicStaff
        data={weekHighs}
        mode="ledger"
        label="last"
        width={220}
        height={72}
        format={{ maximumFractionDigits: 0 }}
        summary={false}
      />
    ),
  },
];

const ROLE_LABEL: Record<Role, string> = {
  inline: "in prose",
  figure: "figure",
  glyph: "glyph",
};

const GROUPS: { role: Role; title: string; note: string }[] = [
  {
    role: "inline",
    title: "Set in running text",
    note: "a few dozen pixels, riding the baseline",
  },
  {
    role: "figure",
    title: "Standing figures",
    note: "the block charts that break the column",
  },
  {
    role: "glyph",
    title: "Almanac glyphs",
    note: "one reading packed into a single cell",
  },
];

export function ChartsIndex() {
  return (
    <section className="index" data-mc-theme="editorial">
      <p className="article__kicker">Colophon</p>
      <h2 className="index__title">Specimen of marks in this issue</h2>
      <p className="index__intro">
        A back-of-book sample of every mark that appears in Dispatch — not a catalog of the library.
        Three registers only: prose inline, standing figures, and almanac glyphs. Each demo is the
        live component, set the way an editor would set it.
      </p>
      {GROUPS.map((g) => (
        <div key={g.role} className="index__group">
          <div className="index__group-head">
            <h3 className="index__group-title">{g.title}</h3>
            <span className="index__group-note">— {g.note}</span>
          </div>
          <ul className="index__list">
            {ENTRIES.filter((e) => e.role === g.role).map((e) => (
              <li key={e.name} className={`card card--${e.role}`}>
                <div className="card__head">
                  <h3 className="card__name">{e.name}</h3>
                  <span className="card__role">{ROLE_LABEL[e.role]}</span>
                </div>
                <div className="card__demo">{e.demo}</div>
                <p className="card__caption">{e.caption}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="index__group">
        <div className="index__group-head">
          <h3 className="index__group-title">Output contexts</h3>
          <span className="index__group-note">— the same marks, tuned for paper and e-paper</span>
        </div>
        <div className="specimen-row">
          <div className="specimen" data-mc-theme="print">
            <span className="specimen__label">Print</span>
            <div className="specimen__charts">
              <Sparkline data={springRunUp} width={64} height={20} summary={false} dots="none" />
              <Delta value={priceNow} from={priceYearAgo} positive="down" summary={false} />
            </div>
          </div>
          <div className="specimen" data-mc-theme="eink">
            <span className="specimen__label">E-ink</span>
            <div className="specimen__charts">
              <Sparkline data={springRunUp} width={64} height={20} summary={false} dots="none" />
              <Delta value={priceNow} from={priceYearAgo} positive="down" summary={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
