import { Ohlc } from "@microcharts/react/ohlc/interactive";
import { VolumeProfile } from "@microcharts/react/volume-profile/interactive";
import { DepthWedge } from "@microcharts/react/depth-wedge/interactive";
import { MicroScatter } from "@microcharts/react/micro-scatter/interactive";
import { PhaseTrace } from "@microcharts/react/phase-trace/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import {
  nvdaCandles,
  volumeAtPrice,
  orderBook,
  returnScatter,
  priceVolumeTrace,
  nvdaStats,
} from "../data";

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const usdOpts = { style: "currency", currency: "USD" } as const;

const first = nvdaCandles[0];
const latest = nvdaCandles[nvdaCandles.length - 1];
const mid = latest.close;
const bestBid = orderBook.demand[0].level;
const bestAsk = orderBook.supply[0].level;
const spread = Math.round((bestAsk - bestBid) * 100) / 100;

const pctFmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

export function Asset() {
  return (
    <section className="view" aria-label="Asset detail">
      <div className="asset-head">
        <div className="asset-id">
          <div className="badge badge-lg">NVDA</div>
          <div>
            <p className="asset-name">NVIDIA Corp.</p>
            <p className="asset-meta">NASDAQ · Semiconductors · Equity</p>
          </div>
        </div>
        <div className="asset-quote">
          <div className="asset-price">{usd2.format(latest.close)}</div>
          <div className="asset-quote-sub">
            <Delta value={latest.close} from={first.open} positive="up" summary={false} />
            <span className="chip">30-session window</span>
          </div>
        </div>
      </div>

      <div className="grid asset-hero">
        <div className="panel pad-lg">
          <div className="mini-head">
            <div>
              <p className="panel-title">Price action</p>
              <p className="panel-note">Daily open / high / low / close · 30 sessions</p>
            </div>
            <div className="asset-hilo">
              <span>
                H <b>{usd2.format(nvdaStats.high)}</b>
              </span>
              <span>
                L <b>{usd2.format(nvdaStats.low)}</b>
              </span>
            </div>
          </div>
          <Ohlc
            data={nvdaCandles}
            maxPeriods={30}
            mode="candle"
            label="last"
            title="NVDA daily candles, last 30 sessions"
            format={(n) => usd2.format(n)}
            animate
            style={{ width: "100%", height: "auto" }}
            width={790}
            height={356}
          />
        </div>

        <div className="panel pad-lg">
          <p className="panel-title">Volume at price</p>
          <p className="panel-note">Where the window traded · POC marked</p>
          <div className="vp-hold">
            <VolumeProfile
              data={volumeAtPrice}
              align="left"
              valueArea={0.7}
              label="poc"
              bins={14}
              title="Volume traded at each price level across the window"
              format={usdOpts}
              animate
              style={{ width: "100%", height: "auto" }}
              width={240}
              height={280}
            />
          </div>
        </div>
      </div>

      <div className="grid asset-books" style={{ marginTop: 16 }}>
        <div className="panel pad-lg">
          <div className="mini-head">
            <div>
              <p className="panel-title">Order book depth</p>
              <p className="panel-note">Cumulative bids vs. asks around the mid</p>
            </div>
            <span className="tag">spread {usd2.format(spread)}</span>
          </div>
          <DepthWedge
            data={orderBook}
            label="spread"
            normalize
            title="Order-book depth: cumulative demand against supply around the mid price"
            format={usdOpts}
            animate
            style={{ width: "100%", height: "auto" }}
            width={580}
            height={223}
          />
          <div className="book-facts">
            <div className="stat">
              <div className="k">Best bid</div>
              <div className="v" style={{ color: "var(--pos)" }}>
                {usd2.format(bestBid)}
              </div>
            </div>
            <div className="stat">
              <div className="k">Mid</div>
              <div className="v">{usd2.format(mid)}</div>
            </div>
            <div className="stat">
              <div className="k">Best ask</div>
              <div className="v" style={{ color: "var(--neg)" }}>
                {usd2.format(bestAsk)}
              </div>
            </div>
          </div>
        </div>

        <div className="panel pad-lg">
          <p className="panel-title">Beta to the index</p>
          <p className="panel-note">Daily return vs. S&amp;P 500 · trend fitted</p>
          <MicroScatter
            data={returnScatter}
            trend
            r={2}
            color="#6fb0e0"
            title="NVDA daily return against the S&P 500 daily return"
            format={pctFmt}
            animate
            style={{ width: "100%", height: "auto" }}
            width={420}
            height={280}
          />
          <div className="scatter-axes">
            <span>x · S&amp;P 500 daily %</span>
            <span>y · NVDA daily %</span>
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <div className="panel pad-lg">
          <p className="panel-title">Price × volume phase</p>
          <p className="panel-note">
            How price and session volume move together across the window · recent motion accented
          </p>
          <div className="phase-hold">
            <PhaseTrace
              data={priceVolumeTrace}
              xLabel="Close price"
              yLabel="Volume (M sh)"
              tail={0.3}
              grid
              startDot
              title="Trajectory of NVDA close price against session volume over 30 sessions"
              format={(n) => n.toFixed(1)}
              animate
              style={{ width: "100%", height: "auto" }}
              width={1040}
              height={402}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
