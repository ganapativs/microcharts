import { useState } from "react";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { QuadrantDot } from "@microcharts/react/quadrant-dot/interactive";
import { RateVolume } from "@microcharts/react/rate-volume/interactive";
import { NetFlow } from "@microcharts/react/net-flow/interactive";
import { DotPlot } from "@microcharts/react/dot-plot/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { PercentileLadder } from "@microcharts/react/percentile-ladder/interactive";
import { HeatCell } from "@microcharts/react/heat-cell/interactive";
import { RugStrip } from "@microcharts/react/rug-strip/interactive";
import { MiniBar } from "@microcharts/react/mini-bar/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import {
  priceObservations,
  medianPrice,
  listingScatter,
  focalListing,
  inventoryByType,
  daysOnMarket,
  marketStats,
  neighborhoods,
  heatMetrics,
  heatMatrix,
  heatDomain,
  ppsfLeaderboard,
  ppsfObservations,
  metroPpsf,
  absorption,
  inventoryFlow,
  usd,
  usdSqft,
  pct,
  money,
} from "../data";

// Materials categorical palette (steel / brass / patina / plum) — CSS vars so dark flips.
export const typeColors = [
  "var(--mc-cat-1)",
  "var(--mc-cat-2)",
  "var(--mc-cat-3)",
  "var(--mc-cat-4)",
];

function statValue(s: (typeof marketStats)[number]): string {
  return new Intl.NumberFormat("en-US", s.format).format(s.value);
}

type BinDatum = { index: number; value: number | null; label?: string; formatted?: string } | null;

export function MarketView() {
  const [priceBin, setPriceBin] = useState<BinDatum>(null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Survey 001 · Q3 2026</div>
          <h1>The metro, measured</h1>
          <p>
            Median sale price, inventory, and pace across all tracked neighborhoods — one quarter of
            the record.
          </p>
        </div>
        <span className="pill pill-live">Live · updated 9m ago</span>
      </div>

      {/* KPI cards -------------------------------------------------------- */}
      <div className="stat-row reveal">
        {marketStats.map((s) => (
          <div key={s.label} className="card card-pad stat">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{statValue(s)}</div>
            <div className="stat-foot">
              <Delta value={s.value} from={s.from} positive={s.positive} summary={false} />
              <span>vs. last quarter</span>
            </div>
          </div>
        ))}
      </div>

      {/* Signature: neighborhood heat matrix ----------------------------- */}
      <section className="card card-pad reveal" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <h2>Neighborhood heat map</h2>
          <span className="sub">market intensity · 0–100 per metric</span>
        </div>
        <div
          className="heat-matrix"
          style={{
            gridTemplateColumns: `max-content repeat(${heatMetrics.length}, 72px)`,
          }}
          role="table"
          aria-label="Market intensity by neighborhood and metric"
        >
          <div className="heat-corner" role="columnheader" />
          {heatMetrics.map((m) => (
            <div key={m} className="heat-col" role="columnheader">
              {m}
            </div>
          ))}
          {heatMatrix.map((row) => (
            <HeatRow key={row.name} name={row.name} values={row.values} />
          ))}
        </div>
        <p className="note">
          Lakeside runs hot on every axis; Sunset Terrace and Cedar Park are the metro’s cooler,
          buyer-friendlier corners. Brighter cells mean stronger pressure.
        </p>
      </section>

      <div className="market-grid">
        {/* Price distribution ------------------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Price distribution</h2>
            <span className="sub">accent bin = metro median</span>
          </div>
          <div className="chart-frame">
            <HistogramStrip
              data={priceObservations}
              markValue={medianPrice}
              format={usd}
              width={420}
              height={120}
              title="Sale price distribution across the metro"
              style={{ width: "100%", height: "auto" }}
              animate
              readout={false}
              onActive={setPriceBin}
            />
          </div>
          <p className={`picker-readout${priceBin ? " is-active" : ""}`}>
            {priceBin
              ? (priceBin.formatted ?? `${priceBin.label} — ${priceBin.value ?? 0} sales`)
              : "Scrub the strip — value lives here, chip stays off"}
          </p>
          <p className="note">
            Most homes clear between $440K and $620K; the long right tail is the Lakeside and
            Harborview luxury segment.
          </p>
        </section>

        {/* Inventory by type -------------------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Inventory by type</h2>
            <span className="sub">1,040 active</span>
          </div>
          <div className="chart-frame">
            <SegmentedBar
              data={inventoryByType}
              colors={typeColors}
              label="percent"
              width={420}
              height={54}
              title="Active inventory by property type"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <div className="legend">
            {inventoryByType.map((d, i) => (
              <span key={d.label}>
                <i style={{ background: typeColors[i] }} />
                {d.label}
              </span>
            ))}
          </div>
        </section>

        {/* Price vs size ------------------------------------------------ */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Price vs. living area</h2>
            <span className="sub">each dot = one listing</span>
          </div>
          <div className="chart-frame">
            <QuadrantDot
              data={focalListing}
              field={listingScatter}
              xLabel="living area"
              yLabel="list price"
              xDomain={[1000, 2600]}
              domain={[360000, 760000]}
              format={usd}
              width={380}
              height={300}
              title="List price versus living area, one dot per listing"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <p className="note">
            The highlighted listing sits above the price/size trend: premium finish for its
            footprint.
          </p>
        </section>

        {/* Days on market ----------------------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Days on market</h2>
            <span className="sub">P50 · P90 · P99</span>
          </div>
          <div className="chart-frame">
            <PercentileLadder
              data={daysOnMarket}
              ps={[50, 90, 99]}
              label="both"
              width={380}
              height={120}
              title="Days-on-market percentiles"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <p className="note">
            Half of homes go under contract within two weeks; the slowest 10% linger past a month.
          </p>
        </section>

        {/* Absorption: rate vs volume ----------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Absorption rate</h2>
            <span className="sub">share of inventory sold vs sales volume</span>
          </div>
          <div className="chart-frame">
            <RateVolume
              data={absorption}
              format={pct}
              volumeFormat={{ maximumFractionDigits: 0 }}
              unit="sales"
              width={420}
              height={130}
              title="Monthly absorption rate over sales volume"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <p className="note">
            The market is tightening: a rising share of active inventory clears each month even as
            volume holds steady.
          </p>
        </section>

        {/* Inventory flow: net ------------------------------------------ */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Inventory flow</h2>
            <span className="sub">new listings vs homes sold</span>
          </div>
          <div className="chart-frame">
            <NetFlow
              data={inventoryFlow}
              label="last"
              width={420}
              height={130}
              title="Listings added versus homes sold, by month"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <p className="note">
            Homes are now leaving the market faster than new listings arrive — the net line has
            dipped below zero for three straight months.
          </p>
        </section>

        {/* $/sqft leaderboard ------------------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Price per square foot</h2>
            <span className="sub">median, by neighborhood</span>
          </div>
          <div className="chart-frame">
            <DotPlot
              data={ppsfLeaderboard}
              highlight="Lakeside"
              format={usdSqft}
              width={380}
              height={200}
              title="Median price per square foot by neighborhood"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>
          <p className="note">
            Lakeside commands the top per-foot premium; Sunset Terrace anchors the value end at
            nearly $90 less.
          </p>
        </section>

        {/* Rug: you are here -------------------------------------------- */}
        <section className="card card-pad chart-block reveal">
          <div className="card-head">
            <h2>Where the metro sits</h2>
            <span className="sub">$/sqft · neighborhood field, metro marked</span>
          </div>
          <div className="chart-frame chart-frame-center">
            <RugStrip
              data={ppsfObservations}
              markValue={metroPpsf}
              format={usdSqft}
              width={420}
              height={56}
              title="Metro median price per square foot against every neighborhood"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <p className="note">
            The metro median of ${metroPpsf} per foot lands just above the middle of the
            neighborhood spread.
          </p>
        </section>
      </div>

      {/* Neighborhood table with per-row inventory mix ------------------- */}
      <section className="card reveal" style={{ marginTop: 18 }}>
        <div className="card-pad card-head" style={{ marginBottom: 0 }}>
          <h2>Neighborhood detail</h2>
          <span className="sub">{neighborhoods.length} tracked · sortable in the full report</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Neighborhood</th>
                <th className="num">Median</th>
                <th className="num">$/sqft</th>
                <th className="num">DOM</th>
                <th className="num">YoY</th>
                <th className="mix-col">Inventory mix</th>
              </tr>
            </thead>
            <tbody>
              {neighborhoods.map((n) => (
                <tr key={n.name}>
                  <td className="td-name">{n.name}</td>
                  <td className="num">{money(n.median)}</td>
                  <td className="num">${n.ppsf}</td>
                  <td className="num">{n.dom}</td>
                  <td className="num">
                    <Delta
                      value={n.median * (1 + n.yoy)}
                      from={n.median}
                      positive="up"
                      summary={false}
                    />
                  </td>
                  <td className="mix-col">
                    <span className="mc-inline">
                      <MiniBar
                        data={[
                          { label: "Single-family", value: n.mix.sf },
                          { label: "Condo", value: n.mix.condo },
                          { label: "Townhouse", value: n.mix.town },
                        ]}
                        width={130}
                        height={20}
                        summary={false}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HeatRow({ name, values }: { name: string; values: number[] }) {
  return (
    <>
      <div className="heat-name" role="rowheader">
        {name}
      </div>
      {values.map((v, i) => (
        <div key={i} className="heat-cell-wrap">
          <HeatCell
            value={v}
            domain={heatDomain}
            steps={5}
            shape="square"
            label="none"
            title={`${name} ${heatMetrics[i]}: ${v} of 100`}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      ))}
    </>
  );
}
