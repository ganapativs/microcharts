import { useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { MicroDonut } from "@microcharts/react/micro-donut/interactive";
import { NetFlow } from "@microcharts/react/net-flow/interactive";
import { BalanceBeam } from "@microcharts/react/balance-beam/interactive";
import { TreeRings } from "@microcharts/react/tree-rings/interactive";
import { BubbleRow } from "@microcharts/react/bubble-row/interactive";
import {
  holdings,
  allocation,
  portfolioSeries,
  portfolioValue,
  portfolioPrevValue,
  cashFlow,
  orderFlow,
  accountRings,
  accountOpenedYear,
  marketCaps,
} from "../data";

const usd = {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
} as const;
const usd2 = { style: "currency", currency: "USD" } as const;
const usdCompact = {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
} as const;

const fmtUsd = new Intl.NumberFormat("en-US", usd);
const fmtUsd2 = new Intl.NumberFormat("en-US", usd2);
const fmtCompact = new Intl.NumberFormat("en-US", usdCompact);

// Allocation classes on the microcharts matte palette: equities steel-blue,
// crypto gold, bonds sage, cash mauve. Gold (the accent) lands on crypto by design.
const catColors = ["#6fb0e0", "#e2b45c", "#4fb08d", "#c486b0"];
const POS = "#45a385"; // microcharts dark-theme positive — never re-tinted
const NEG = "#df7856"; // microcharts dark-theme negative

const accountAge = new Date().getFullYear() - accountOpenedYear;
const lifetimeContrib = accountRings.reduce((s, v) => s + v, 0);
const netThisMonth = cashFlow[cashFlow.length - 1];

type Scrub = { index: number; value: number | null; formatted?: string } | null;

export function Portfolio() {
  const dayGain = portfolioValue - portfolioPrevValue;
  const [active, setActive] = useState<Scrub>(null);
  const [selected, setSelected] = useState<Scrub>(null);
  const scrubbed = selected ?? active;
  const heroValue =
    scrubbed?.formatted ??
    (scrubbed?.value != null ? fmtUsd2.format(scrubbed.value) : fmtUsd2.format(portfolioValue));

  return (
    <section className="view" aria-label="Portfolio">
      <div className="grid hero">
        <div className="panel pad-lg">
          <div className="hero-head">
            <p className="eyebrow" style={{ margin: 0 }}>
              Total portfolio value
            </p>
            <span className="chip">
              {scrubbed ? (active ? "scrubbing" : "pinned") : "vs. prior close"}
            </span>
          </div>
          <div className="hero-value">{heroValue}</div>
          <div className="hero-sub">
            <Delta value={portfolioValue} from={portfolioPrevValue} positive="up" animate />
            <span className="num">
              {dayGain >= 0 ? "+" : "−"}
              {fmtUsd2.format(Math.abs(dayGain))} today
            </span>
            <span className={`scrub-chip${scrubbed ? "" : " is-idle"}`}>
              {scrubbed
                ? `${selected && !active ? "Pinned" : "Scrub"} · day ${scrubbed.index + 1}`
                : "Hover to scrub"}
            </span>
          </div>

          <div className="hero-chart">
            <Sparkline
              data={portfolioSeries}
              width={560}
              height={132}
              curve="smooth"
              fill
              dots="auto"
              color={POS}
              title="Portfolio value, last 90 days"
              format={usd2}
              animate
              style={{ width: "100%", height: "auto" }}
              readout={false}
              onActive={setActive}
              onSelect={setSelected}
              selectedIndex={selected?.index ?? null}
            />
          </div>

          <div className="strip">
            <div className="stat">
              <div className="k">Day change</div>
              <div className="v">
                <Delta
                  value={portfolioValue}
                  from={portfolioPrevValue}
                  positive="up"
                  summary={false}
                />
              </div>
            </div>
            <div className="stat">
              <div className="k">Holdings</div>
              <div className="v">{holdings.length} assets</div>
            </div>
            <div className="stat">
              <div className="k">90-day low</div>
              <div className="v">{fmtUsd.format(Math.min(...portfolioSeries))}</div>
            </div>
            <div className="stat">
              <div className="k">90-day high</div>
              <div className="v">{fmtUsd.format(Math.max(...portfolioSeries))}</div>
            </div>
          </div>
        </div>

        <div className="panel pad-lg">
          <p className="eyebrow">Allocation by asset class</p>
          <div className="donut-wrap">
            <MicroDonut
              data={allocation}
              size={168}
              colors={catColors}
              title="Portfolio allocation by asset class"
              format={usd}
              animate
            />
            <div className="legend" style={{ marginTop: 0 }}>
              {allocation.map((a, i) => {
                const total = allocation.reduce((s, x) => s + x.value, 0);
                return (
                  <span key={a.label}>
                    <i style={{ background: catColors[i] }} />
                    {a.label}
                    <b style={{ color: "var(--text-mute)", fontWeight: 500 }}>
                      {" "}
                      {Math.round((a.value / total) * 100)}%
                    </b>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>Flows &amp; footprint</h2>
        <span className="aside">Contributions, order flow &amp; tenure</span>
      </div>

      <div className="grid bento-flows">
        <div className="panel pad-lg cell-flow">
          <div className="mini-head">
            <div>
              <p className="panel-title">Cash in / out</p>
              <p className="panel-note">Contributions vs. withdrawals · 12 months</p>
            </div>
            <span className={netThisMonth.in - netThisMonth.out >= 0 ? "tag tag-pos" : "tag"}>
              {netThisMonth.in - netThisMonth.out >= 0 ? "+" : "−"}
              {fmtUsd.format(Math.abs(netThisMonth.in - netThisMonth.out))} net
            </span>
          </div>
          <NetFlow
            data={cashFlow}
            mode="bars"
            net
            positive="up"
            label="last"
            title="Monthly cash contributions against withdrawals over the past year"
            format={usd}
            animate
            style={{ width: "100%", height: "auto" }}
            width={640}
            height={192}
          />
        </div>

        <div className="panel pad-lg cell-beam">
          <p className="panel-title">Order-flow pressure</p>
          <p className="panel-note">Notional bought vs. sold, session</p>
          <div className="beam-hold">
            <BalanceBeam
              data={orderFlow}
              mode="difference"
              label="none"
              title="Buy pressure against sell pressure this session"
              format={usdCompact}
              animate
              style={{ width: "100%", height: "auto" }}
              width={220}
              height={120}
            />
          </div>
          <div className="beam-legend">
            <span>
              <i style={{ background: "var(--pos)" }} />
              Buys {fmtCompact.format(orderFlow[0].value)}
            </span>
            <span>
              <i style={{ background: "var(--neg)" }} />
              Sells {fmtCompact.format(orderFlow[1].value)}
            </span>
          </div>
        </div>

        <div className="panel pad-lg cell-rings">
          <p className="panel-title">Account tenure</p>
          <p className="panel-note">Net contributed per year since {accountOpenedYear}</p>
          <div className="rings-hold">
            <TreeRings
              data={accountRings}
              highlight="last"
              rings="fill"
              periodWord="year"
              unit="years"
              color="#6fb0e0"
              title={`Net contributions across ${accountAge} years since opening`}
              format={usdCompact}
              size={148}
              animate
            />
            <div className="rings-facts">
              <div className="stat">
                <div className="k">Age</div>
                <div className="v">{accountAge} yrs</div>
              </div>
              <div className="stat">
                <div className="k">Lifetime in</div>
                <div className="v">{fmtCompact.format(lifetimeContrib)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel pad-lg cell-caps">
          <p className="panel-title">Positions by market cap</p>
          <p className="panel-note">Issuer capitalization behind each holding</p>
          <BubbleRow
            data={marketCaps}
            align="baseline"
            label="both"
            color="#c486b0"
            title="Held positions sized by their issuer's market capitalization"
            format={usdCompact}
            height={132}
            animate
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </div>

      <div className="section-head">
        <h2>Holdings</h2>
        <span className="aside">Live positions · sorted by market value</span>
      </div>

      <div className="panel table-wrap" style={{ paddingTop: 8 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Price</th>
              <th>30-day</th>
              <th>Market value</th>
              <th>Day</th>
            </tr>
          </thead>
          <tbody>
            {[...holdings]
              .sort((a, b) => b.value - a.value)
              .map((h) => (
                <tr key={h.ticker}>
                  <td>
                    <div className="asset">
                      <div className="badge">{h.ticker.slice(0, 4)}</div>
                      <div>
                        <div className="nm">{h.ticker}</div>
                        <div className="sub">
                          {h.shares} · {h.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{fmtUsd2.format(h.price)}</td>
                  <td className="cell-spark">
                    <span className="mc-inline">
                      <Sparkline
                        data={h.spark}
                        width={112}
                        height={30}
                        curve="smooth"
                        color={h.price >= h.prevPrice ? POS : NEG}
                        summary={false}
                      />
                    </span>
                  </td>
                  <td>{fmtUsd2.format(h.value)}</td>
                  <td>
                    <Delta value={h.price} from={h.prevPrice} positive="up" summary={false} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
