import { Bullet } from "@microcharts/react/bullet/interactive";
import { Sparkline as StaticSparkline } from "@microcharts/react/sparkline";
import { RugStrip } from "@microcharts/react/rug-strip/interactive";
import { PercentileTrace } from "@microcharts/react/percentile-trace/interactive";
import { ForecastCone } from "@microcharts/react/forecast-cone/interactive";
import { Delta } from "@microcharts/react/delta";

import { Card, Lede, fluid } from "./ui";
import {
  goals,
  weightTrend,
  weightDomain,
  weightForecast,
  weightTarget,
  stepDistribution,
  stepDistributionDomain,
  totalStepsToday,
  avgDailySteps,
  fitnessPercentile,
  C,
} from "../data";

export function TrendsView() {
  return (
    <div className="grid">
      <Lede kicker="The slow lines">
        Weight easing toward the target, fitness climbing the pack, and today&rsquo;s steps already
        better than most days. The question is whether the next eight weeks clear 72&nbsp;kg.
      </Lede>

      <Card title="Weekly goals" hint="This week" span="full">
        <ul className="bullets">
          {goals.map((g) => (
            <li key={g.label} className="bullet">
              <span className="bullet__label">{g.label}</span>
              <Bullet
                value={g.value}
                target={g.target}
                bands={g.bands}
                domain={g.domain}
                color={g.color}
                width={320}
                height={28}
                format={{ notation: "compact", maximumFractionDigits: 1 }}
                title={`${g.label}: ${g.value.toLocaleString()} of ${g.target.toLocaleString()} ${g.unit}`}
                style={fluid}
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Weight path" hint="12 weeks actual · 8 ahead" span="full">
        <ForecastCone
          data={weightTrend}
          forecast={weightForecast}
          target={weightTarget}
          unit="week"
          label="landing"
          domain={weightDomain}
          color={C.amber}
          format={{ maximumFractionDigits: 1 }}
          width={920}
          height={168}
          title="Body-weight history and 8-week forecast against the 72 kg target"
          animate
          style={fluid}
        />
        <p className="caption">
          Median lands just under target; the 80% band still straddles it — clear only if the recent
          slope holds.
        </p>
      </Card>

      <Card title="Fitness percentile" hint="vs peers · 26 weeks">
        <PercentileTrace
          data={fitnessPercentile}
          positive="up"
          unit="week"
          label="last"
          showBands
          color={C.green}
          width={460}
          height={128}
          title="Fitness percentile against peers, drifting over 26 weeks"
          animate
          style={fluid}
        />
        <p className="caption">
          Shaded fields are the middle half and the outer edges of the pack. You climbed into the
          top third.
        </p>
      </Card>

      <Card title="Where today sits" hint={`${totalStepsToday.toLocaleString()} steps`}>
        <RugStrip
          data={stepDistribution}
          markValue={totalStepsToday}
          domain={stepDistributionDomain}
          orientation="horizontal"
          width={460}
          height={60}
          color={C.coral}
          format={{ notation: "compact", maximumFractionDigits: 1 }}
          title="Daily step counts over 90 days, with today marked"
          animate
          style={fluid}
        />
        <p className="caption">
          Each tick is a day&rsquo;s step count. The bold tick is today — better than usual.
        </p>
      </Card>

      <Card span="full" className="card--prose">
        <p className="prose">
          Zooming out, the last six weeks of weight have settled into a gentle{" "}
          <span className="mc-inline">
            <StaticSparkline
              data={weightTrend.slice(-6)}
              width={96}
              height={24}
              color={C.amber}
              format={{ maximumFractionDigits: 1 }}
              summary={false}
              style={{ width: "4.2em", height: "1.1em" }}
            />
          </span>{" "}
          slide, and today&rsquo;s steps landed{" "}
          <Delta
            value={totalStepsToday}
            from={avgDailySteps}
            positive="up"
            format={{ style: "percent", maximumFractionDigits: 0 }}
            summary={false}
          />{" "}
          above a typical day.
        </p>
      </Card>
    </div>
  );
}
