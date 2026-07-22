import { SparkGroup } from "@microcharts/react";
import { Dumbbell } from "@microcharts/react/dumbbell/interactive";
import { Slope } from "@microcharts/react/slope/interactive";
import { StackedArea } from "@microcharts/react/stacked-area/interactive";
import { PairedBars } from "@microcharts/react/paired-bars/interactive";
import { VolumeProfile } from "@microcharts/react/volume-profile/interactive";
import { BenchmarkStrip } from "@microcharts/react/benchmark-strip/interactive";
import { PartitionStrip } from "@microcharts/react/partition-strip/interactive";
import {
  listToSale,
  yearOverYear,
  salesMix,
  listVsSale,
  typeComposition,
  salesByPrice,
  benchmarks,
  usd,
  usdSqft,
} from "../data";

// Materials categorical palette — driven by Atlas --mc-cat-* so dark mode flips.
const mixColors = ["var(--mc-cat-1)", "var(--mc-cat-2)", "var(--mc-cat-3)"];
const typeColors = ["var(--mc-cat-1)", "var(--mc-cat-2)", "var(--mc-cat-3)", "var(--mc-cat-4)"];

export function CompareView() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Comparison · 6 regions</div>
          <h1>Neighborhood against neighborhood</h1>
          <p>
            List-to-sale spread, appreciation, buyer mix, and where the money is quietly moving.
          </p>
        </div>
        <span className="pill">6 regions</span>
      </div>

      <div className="compare-grid">
        {/* List → sale ------------------------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>List price to sale price</h2>
            <span className="sub">median, by neighborhood</span>
          </div>
          <div className="chart-frame">
            <Dumbbell
              data={listToSale}
              positive="up"
              label="value"
              highlight="Lakeside"
              format={usd}
              width={420}
              height={220}
              title="List price versus sale price by neighborhood"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <p className="note">
            Lakeside homes clear well over asking; Sunset Terrace is the lone segment settling below
            list.
          </p>
        </section>

        {/* Year over year ---------------------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Median price, YoY</h2>
            <span className="sub">last year → this year</span>
          </div>
          <div className="chart-frame">
            <Slope
              data={yearOverYear}
              positive="up"
              label="value"
              highlight="Lakeside"
              format={(n) => "$" + Math.round(n / 1000) + "k"}
              width={420}
              height={240}
              title="Median price last year versus this year by neighborhood"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <div className="legend">
            {yearOverYear.map((d) => {
              const hi = d.label === "Lakeside";
              const swatch = hi
                ? "var(--mc-accent)"
                : d.to > d.from
                  ? "var(--mc-positive)"
                  : d.to < d.from
                    ? "var(--mc-negative)"
                    : "var(--mc-neutral)";
              return (
                <span
                  key={d.label}
                  style={hi ? { color: "var(--ink)", fontWeight: 600 } : undefined}
                >
                  <i style={{ background: swatch }} />
                  {d.label}
                </span>
              );
            })}
          </div>
          <p className="note">
            Lakeside led appreciation at +14%, while Cedar Park cooled slightly against last year.
          </p>
        </section>

        {/* Paired bars: list vs sale ----------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>List vs. sale by region</h2>
            <span className="sub">sale bar, list reference</span>
          </div>
          <div className="chart-frame paired-frame">
            <div className="paired-labels" aria-hidden>
              {listVsSale.map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
            </div>
            <PairedBars
              data={listVsSale}
              mode="grouped"
              orientation="horizontal"
              positive="up"
              format={usd}
              width={320}
              height={240}
              title="Median list price versus sale price by region"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <p className="note">
            Five of six regions close above their list reference; only Sunset Terrace prints a
            shortfall.
          </p>
        </section>

        {/* Benchmark: three homes vs their own comp sets, one shared scale */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Home vs. comp set</h2>
            <span className="sub">3 flagged listings · $/sqft</span>
          </div>
          <SparkGroup domain="shared" width={150} height={48} className="bench-row">
            {benchmarks.map((b) => (
              <BenchmarkStrip
                key={b.name}
                data={b.cohort}
                value={b.value}
                range="p5p95"
                label="value"
                format={usdSqft}
                title={`${b.name} at $${b.value} per foot against its comparable set`}
                style={{ width: "100%", height: "auto" }}
              />
            ))}
          </SparkGroup>
          <div className="bench-labels">
            {benchmarks.map((b) => (
              <span key={b.name}>{b.name}</span>
            ))}
          </div>
          <p className="note">
            Marlowe prices in the upper third of its comp set; Harborview and Lakeside have more
            room to negotiate — all three read off the same metro $/sqft scale.
          </p>
        </section>

        {/* Partition: type composition --------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Inventory composition</h2>
            <span className="sub">type → subtype, all active listings</span>
          </div>
          <div className="chart-frame">
            <PartitionStrip
              data={typeComposition}
              colors={typeColors}
              labels
              width={420}
              height={96}
              title="Active inventory by property type and subtype"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <div className="legend">
            {typeComposition.map((d, i) => (
              <span key={d.label}>
                <i style={{ background: typeColors[i] }} />
                {d.label}
              </span>
            ))}
          </div>
        </section>

        {/* Volume profile: sales by price level ------------------------ */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Sales by price level</h2>
            <span className="sub">closed sales · shaded value area</span>
          </div>
          <div className="chart-frame">
            <VolumeProfile
              data={salesByPrice}
              align="left"
              format={usd}
              width={420}
              height={240}
              title="Closed sales volume by price level"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <p className="note">
            The market’s center of gravity sits in the $500K–$575K band — where the most deals
            actually close.
          </p>
        </section>

        {/* Sales mix over time ----------------------------------------- */}
        <section className="card card-pad chart-block full reveal">
          <div className="card-head">
            <h2>Sales mix over time</h2>
            <span className="sub">units closed by buyer segment · trailing 12 months</span>
          </div>
          <div className="chart-frame">
            <StackedArea
              data={salesMix}
              colors={mixColors}
              label="last"
              width={720}
              height={220}
              title="Monthly closed sales by buyer segment"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <div className="legend">
            {salesMix.map((s, i) => (
              <span key={s.label}>
                <i style={{ background: mixColors[i] }} />
                {s.label} buyers
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
