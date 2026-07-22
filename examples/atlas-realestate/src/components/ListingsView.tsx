import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { EventTimeline } from "@microcharts/react/event-timeline/interactive";
import { MiniBar } from "@microcharts/react/mini-bar/interactive";
import { MicroBox } from "@microcharts/react/micro-box/interactive";
import { Thermometer } from "@microcharts/react/thermometer/interactive";
import { PictogramRow } from "@microcharts/react/pictogram-row/interactive";
import { CalendarStrip } from "@microcharts/react/calendar-strip/interactive";
import {
  listings,
  featured,
  lifecycle,
  timelineDomain,
  today,
  closings,
  usd,
  money,
  type Listing,
} from "../data";

function FeaturedSpotlight() {
  const f = featured;
  const compLo = Math.min(...f.comps);
  const compHi = Math.max(...f.comps);
  // Adjustments are signed moves off list — MiniBar (shared baseline) so each
  // bump's size reads; list → offer lives in the caption (list would dwarf a
  // waterfall domain that includes zero).
  const wfOpen = f.adjustments[0]!.value;
  const wfSteps = f.adjustments.slice(1);
  const wfNet = wfSteps.reduce((s, d) => s + d.value, 0);
  const wfEnd = wfOpen + wfNet;

  return (
    <section className="card spotlight reveal">
      <div className="spotlight-mast">
        <span className="pill pill-hot">Bidding war · 5% over ask</span>
        <div className="spotlight-addr">{f.address}</div>
        <div className="spotlight-hood">{f.neighborhood}</div>
        <div className="spotlight-meta">
          {f.beds} bd · {f.baths} ba · {f.sqft.toLocaleString()} sqft · {f.dom} days on market
        </div>
      </div>

      <div className="spotlight-body">
        <div className="spotlight-top">
          <div>
            <div className="stat-label">Accepted offer</div>
            <div className="spotlight-price">{money(f.offer)}</div>
            <div className="stat-foot">
              <Delta
                value={f.offer}
                from={f.list}
                positive="up"
                format={{ style: "percent", maximumFractionDigits: 1 }}
                summary={false}
              />
              <span>over ${money(f.list).replace("$", "")} list</span>
            </div>
          </div>
          <div className="spotlight-facts">
            <div className="fact">
              <span className="fact-lbl">Beds</span>
              <span className="mc-inline">
                <PictogramRow
                  value={f.beds}
                  total={5}
                  shape="square"
                  width={78}
                  height={16}
                  summary={false}
                />
              </span>
            </div>
            <div className="fact">
              <span className="fact-lbl">Baths</span>
              <span className="mc-inline">
                <PictogramRow
                  value={f.baths}
                  total={5}
                  shape="square"
                  width={78}
                  height={16}
                  summary={false}
                />
              </span>
            </div>
            <div className="fact">
              <span className="fact-lbl">Size</span>
              <span className="fact-val">{f.sqft.toLocaleString()} sqft</span>
            </div>
          </div>
        </div>

        <div className="spotlight-charts">
          <div className="mini-block">
            <div className="mini-head">
              <span className="lbl">List vs. estimate</span>
              <span className="sub">
                {money(f.list)} list · {money(f.estimate)} est.
              </span>
            </div>
            <Thermometer
              value={f.list}
              target={f.estimate}
              domain={[compLo, compHi]}
              orientation="horizontal"
              bulb={false}
              label="value"
              format={usd}
              width={300}
              height={44}
              title={`List price ${money(f.list)} against estimate ${money(f.estimate)}`}
              style={{ width: "100%", height: "auto" }}
            />
          </div>

          <div className="mini-block">
            <div className="mini-head">
              <span className="lbl">Comparable sales</span>
              <span className="sub">{f.comps.length} recent · $/spread</span>
            </div>
            <MicroBox
              data={f.comps}
              format={usd}
              width={300}
              height={44}
              title="Comparable recent sale prices near this home"
              style={{ width: "100%", height: "auto" }}
            />
          </div>

          <div className="mini-block wide">
            <div className="mini-head">
              <span className="lbl">Listing lifecycle</span>
              <span className="sub">listed → pending in {f.dom} days</span>
            </div>
            <EventTimeline
              data={lifecycle}
              now={today}
              domain={timelineDomain}
              label="spans"
              width={520}
              height={52}
              title="Lifecycle of the featured listing"
              style={{ width: "100%", height: "auto" }}
              animate
            />
          </div>

          <div className="mini-block wide">
            <div className="mini-head">
              <span className="lbl">Price adjustments</span>
              <span className="sub">
                {money(wfOpen)} list → {money(wfEnd)} offer · net {wfNet >= 0 ? "+" : "−"}
                {money(Math.abs(wfNet)).replace("$", "")}
              </span>
            </div>
            <MiniBar
              data={wfSteps}
              positive="up"
              color={wfSteps.every((s) => s.value >= 0) ? "var(--mc-positive)" : undefined}
              format={usd}
              width={520}
              height={72}
              title={`Price moves from ${money(wfOpen)} list to ${money(wfEnd)} offer`}
              style={{ width: "100%", height: "auto" }}
              animate
            />
            <div className="legend" style={{ marginTop: 8 }}>
              {wfSteps.map((s) => (
                <span key={s.label}>
                  <i
                    style={{
                      background: s.value >= 0 ? "var(--mc-positive)" : "var(--mc-negative)",
                    }}
                  />
                  {s.label} · {s.value >= 0 ? "+" : "−"}
                  {money(Math.abs(s.value)).replace("$", "")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ListingCard({ item }: { item: Listing }) {
  const lo = Math.min(item.list, item.offer, item.estimate) * 0.97;
  const hi = Math.max(item.list, item.offer, item.estimate) * 1.03;
  return (
    <article className="card listing reveal">
      <div className="listing-mast">
        <div className="listing-addr">{item.address}</div>
        <div className="listing-hood">{item.neighborhood}</div>
        <span className="listing-badge">{item.dom} days on market</span>
      </div>
      <div className="listing-body">
        <div className="listing-top">
          <div className="listing-meta">
            <span>{item.beds} bd</span>
            <span>{item.baths} ba</span>
            <span>{item.sqft.toLocaleString()} sqft</span>
          </div>
          <div className="listing-price">{money(item.list)}</div>
        </div>

        <div className="spark-row">
          <span className="lbl">8-week price</span>
          <span className="mc-inline">
            <Sparkline
              data={item.history}
              width={110}
              height={28}
              dots="auto"
              curve="smooth"
              summary={false}
            />
          </span>
          <Delta
            value={item.offer}
            from={item.list}
            positive="up"
            format={{ style: "percent", maximumFractionDigits: 1 }}
            summary={false}
          />
        </div>

        <div className="bullet-row">
          <span className="lbl">Offer vs. asking vs. estimate</span>
          <Bullet
            value={item.offer}
            target={item.list}
            bands={[item.estimate]}
            domain={[lo, hi]}
            format={usd}
            width={240}
            height={30}
            title={`Offer ${money(item.offer)} against list ${money(item.list)} and estimate ${money(item.estimate)}`}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>
    </article>
  );
}

export function ListingsView() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Portfolio · {listings.length} plots</div>
          <h1>Homes on the record</h1>
          <p>
            Every active listing with its price history, offer strength, and estimate spread — read
            at a glance.
          </p>
        </div>
        <span className="pill">Sorted by momentum</span>
      </div>

      <FeaturedSpotlight />

      <section className="card card-pad reveal" style={{ margin: "18px 0" }}>
        <div className="card-head">
          <h2>Closings calendar</h2>
          <span className="sub">homes closing per day · last 6 weeks</span>
        </div>
        <div className="chart-frame chart-frame-center">
          <CalendarStrip
            data={closings}
            weeks={6}
            end="2026-07-18"
            weekStart={1}
            shape="round"
            cell={10}
            gap={2}
            title="Homes closing per day over the last six weeks"
            style={{ width: "100%", height: "auto", maxWidth: 460 }}
          />
        </div>
        <p className="note">
          Closings bunch mid-week and spike at month-end as contracts race to fund before the
          cutoff.
        </p>
      </section>

      <div className="listing-grid">
        {listings.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
