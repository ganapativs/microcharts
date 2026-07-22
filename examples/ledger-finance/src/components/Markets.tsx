import { useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { CometTrail } from "@microcharts/react/comet-trail/interactive";
import { HeartbeatBlip } from "@microcharts/react/heartbeat-blip/interactive";
import { TapeGauge } from "@microcharts/react/tape-gauge/interactive";
import { Horizon } from "@microcharts/react/horizon/interactive";
import {
  markets,
  spxTicks,
  pulseEvents,
  pulseWindow,
  pulseNow,
  vixValue,
  vixRate,
  vixZones,
  monitorRows,
} from "../data";

const num2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const POS = "#45a385"; // microcharts dark-theme positive
const NEG = "#df7856"; // microcharts dark-theme negative
const ACCENT = "#e6b04a"; // gold signal accent — reserved for live data

const spxLast = spxTicks[spxTicks.length - 1];
const spxPrev = markets[0].prev;
const printsPerMin = pulseEvents.length;

export function Markets() {
  const [pulse, setPulse] = useState<{ index: number; value: number | null } | null>(null);

  return (
    <section className="view" aria-label="Markets">
      <div className="section-head">
        <h2>Market pulse</h2>
        <span className="aside">Live tape · {printsPerMin} prints / min</span>
      </div>

      <div className="grid pulse-band">
        <div className="panel pad-lg pulse-ticker">
          <div className="mini-head">
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>
                <span className="live-dot" aria-hidden="true" />
                S&amp;P 500 · live
              </p>
              <div className="pulse-value">{num2.format(spxLast)}</div>
            </div>
            <Delta value={spxLast} from={spxPrev} positive="up" summary={false} />
          </div>
          <CometTrail
            data={spxTicks}
            trail={16}
            label="last"
            color={ACCENT}
            title="S&P 500 recent ticks with a fading momentum trail"
            format={{ maximumFractionDigits: 0 }}
            style={{ width: "100%", height: "auto" }}
            width={520}
            height={96}
            onActive={setPulse}
          />
          <span className="picker-readout">
            {pulse?.value != null ? `Scrub · ${num2.format(pulse.value)}` : "Hover to scrub"}
          </span>
        </div>

        <div className="panel pad-lg pulse-cell">
          <p className="eyebrow" style={{ margin: 0 }}>
            Tape activity
          </p>
          <p className="pulse-mini-note">Trade prints, last 60s</p>
          <HeartbeatBlip
            events={pulseEvents}
            window={pulseWindow}
            now={pulseNow}
            label="count"
            color="#6fb0e0"
            title="Trade prints across the last sixty seconds"
            style={{ width: "100%", height: "auto" }}
            width={260}
            height={72}
          />
        </div>

        <div className="panel pad-lg pulse-cell">
          <p className="eyebrow" style={{ margin: 0 }}>
            VIX
          </p>
          <p className="pulse-mini-note">Volatility · calm / stress bands</p>
          <TapeGauge
            value={vixValue}
            rate={vixRate}
            zones={vixZones}
            span={24}
            orientation="horizontal"
            label="value"
            title="CBOE volatility index reading against its calm and stress bands"
            format={{ maximumFractionDigits: 2 }}
            animate
            style={{ width: "100%", height: "auto" }}
            width={260}
            height={72}
          />
        </div>
      </div>

      <div className="section-head">
        <h2>Markets</h2>
        <span className="aside">Indices, crypto &amp; rates · intraday</span>
      </div>

      <div className="grid cards">
        {markets.map((m) => {
          const up = m.last >= m.prev;
          return (
            <div key={m.symbol} className="panel mkt">
              <div className="mkt-top">
                <div>
                  <div className="mkt-name">{m.symbol}</div>
                  <div className="mkt-sub">{m.name}</div>
                </div>
                <Delta value={m.last} from={m.prev} positive="up" summary={false} />
              </div>
              <div className="mkt-last">{num2.format(m.last)}</div>
              <div className="mkt-chart">
                <Sparkline
                  data={m.spark}
                  width={240}
                  height={52}
                  curve="smooth"
                  color={up ? POS : NEG}
                  title={`${m.symbol} intraday`}
                  animate
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-head">
        <h2>Global monitor</h2>
        <span className="aside">Intraday deviation from open · folded bands</span>
      </div>

      <div className="panel table-wrap" style={{ paddingTop: 8 }}>
        <table className="table monitor">
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Last</th>
              <th className="col-horizon">Session</th>
              <th>Day</th>
            </tr>
          </thead>
          <tbody>
            {monitorRows.map((r) => (
              <tr key={r.symbol}>
                <td>
                  <div className="asset">
                    <div className="badge badge-sm">{r.symbol}</div>
                    <div>
                      <div className="nm">{r.symbol}</div>
                      <div className="sub">{r.name}</div>
                    </div>
                  </div>
                </td>
                <td>{num2.format(r.last)}</td>
                <td className="col-horizon">
                  <span className="mc-inline">
                    <Horizon
                      data={r.series}
                      folds={2}
                      mode="mirror"
                      baseline={0}
                      color={r.changePct >= 0 ? POS : NEG}
                      title={`${r.name} intraday deviation from the open`}
                      summary={false}
                      width={200}
                      height={26}
                    />
                  </span>
                </td>
                <td>
                  <Delta value={100 + r.changePct} from={100} positive="up" summary={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
