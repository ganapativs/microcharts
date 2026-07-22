import { useState } from "react";
import { ProgressRing } from "@microcharts/react/progress-ring/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { MicroDonut } from "@microcharts/react/micro-donut/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { BreathingDot } from "@microcharts/react/breathing-dot/interactive";
import { TimeInRange } from "@microcharts/react/time-in-range/interactive";
import { PictogramRow } from "@microcharts/react/pictogram-row/interactive";
import { TallyMarks } from "@microcharts/react/tally-marks/interactive";
import { Thermometer } from "@microcharts/react/thermometer/interactive";
import { EtaBar } from "@microcharts/react/eta-bar/interactive";

import { Card, Kpi, Lede, fluid } from "./ui";
import {
  rings,
  hourlySteps,
  totalStepsToday,
  macros,
  macroColors,
  restingHrDelta,
  activeCalDelta,
  recovery,
  hrZones,
  water,
  streakDays,
  energyGoal,
  activeWorkout,
  C,
} from "../data";

const hrZoneStrings = {
  noData: "No data.",
  tirNames: ["rest", "light", "fat-burn", "cardio", "peak"] as [
    string,
    string,
    string,
    string,
    string,
  ],
  tirClause: (pct: string, name: string) => `${pct} ${name}`,
  timeInRange: (list: string) => `${list}.`,
  tirZone: (name: string, pct: string) => `${name}: ${pct}.`,
};

const hrZoneKeys = (["severeBelow", "below", "in", "above", "severeAbove"] as const).filter(
  (k) => typeof hrZones[k as keyof typeof hrZones] === "number",
);

export function TodayView() {
  const [selectedRing, setSelectedRing] = useState<string | null>(null);
  const [hrFocus, setHrFocus] = useState<{ name: string; minutes: number } | null>(null);

  return (
    <div className="grid">
      <Lede kicker="The morning read">
        You&rsquo;re moving well and resting easy: 88&nbsp;kcal from a closed Move ring, with room
        to spare before the day even warms up.
      </Lede>

      <Card title="Activity" hint="Daily goals" span="full" className="card--rings">
        <div className="rings">
          {rings.map((r) => {
            const selected = selectedRing === r.key;
            return (
              <figure
                className={`ring${selected ? " ring--selected" : selectedRing ? " ring--dim" : ""}`}
                key={r.key}
              >
                <ProgressRing
                  value={r.value}
                  max={r.max}
                  label="percent"
                  color={r.color}
                  size={112}
                  weight={12}
                  title={`${r.label} goal`}
                  className="ring__dial"
                  onSelect={() => setSelectedRing(selected ? null : r.key)}
                  animate
                />
                <figcaption className="ring__cap">
                  <span className="ring__name">{r.label}</span>
                  <span className="ring__val" style={{ color: r.color }}>
                    {r.value.toLocaleString()}
                    <span className="ring__unit">
                      {" "}
                      / {r.max} {r.unit}
                    </span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Card>

      <div className="kpi-row">
        <Kpi label="Recovery" value="Well rested" sub="31% strain" accent={C.green}>
          <BreathingDot
            value={recovery}
            size={58}
            title="Recovery — how strained your body is right now"
          />
        </Kpi>

        <Kpi
          label="Heart zones"
          value={hrFocus ? `${hrFocus.minutes} min` : "486 min"}
          sub={hrFocus ? hrFocus.name : "in fat-burn today"}
        >
          <TimeInRange
            data={hrZones}
            orientation="vertical"
            label="none"
            width={34}
            height={92}
            title="Time in each heart-rate zone today"
            strings={hrZoneStrings}
            animate
            onActive={(d) => {
              if (!d?.label) {
                setHrFocus(null);
                return;
              }
              const key = hrZoneKeys[d.index];
              const minutes = key ? hrZones[key as keyof typeof hrZones] : undefined;
              setHrFocus(typeof minutes === "number" ? { name: d.label, minutes } : null);
            }}
          />
        </Kpi>

        <Kpi label="Hydration" value={`${water.value} / ${water.total}`} sub="2 glasses to go">
          <PictogramRow
            value={water.value}
            total={water.total}
            shape="dot"
            color={C.blue}
            height={26}
            title="Water intake — glasses toward the daily goal"
            animate
          />
        </Kpi>

        <Kpi label="Streak" value={`${streakDays} days`} sub="best: 18" accent={C.coral}>
          <TallyMarks value={streakDays} pen="drawn" height={40} title="Logged-workout streak" />
        </Kpi>
      </div>

      <Card title="Steps" hint={`${totalStepsToday.toLocaleString()} today`}>
        <SparkBar
          data={hourlySteps}
          color={C.coral}
          title="Steps per hour"
          width={480}
          height={60}
          style={fluid}
        />
        <p className="axis">
          <span>12a</span>
          <span>6a</span>
          <span>12p</span>
          <span>6p</span>
          <span>11p</span>
        </p>
      </Card>

      <Card title="Fuel" hint="Macros">
        <div className="donut">
          <MicroDonut
            data={macros}
            colors={macroColors}
            size={128}
            weight={18}
            title="Macronutrient split"
            animate
          />
          <ul className="legend">
            {macros.map((m, i) => (
              <li key={m.label}>
                <span className="swatch" style={{ background: macroColors[i] }} />
                <span className="legend__label">{m.label}</span>
                <span className="legend__val">{m.value}g</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card title="Daily energy" hint="512 / 600 kcal" span="wide" className="card--therm">
        <div className="therm">
          <Thermometer
            value={energyGoal.value}
            target={energyGoal.target}
            domain={energyGoal.domain}
            ticks={[0, 200, 400, 600, 800]}
            orientation="vertical"
            label="value"
            color={C.coral}
            width={68}
            height={188}
            format={{ maximumFractionDigits: 0 }}
            title="Active energy burned toward today's 600 kcal goal"
            animate
          />
          <p className="caption caption--tall">
            88 kcal from closing your Move ring. A brisk walk after dinner does it.
          </p>
        </div>
      </Card>

      <Card
        title="Active workout"
        hint={
          <span className="live">
            <span className="live__dot" aria-hidden="true" />
            Live
          </span>
        }
        span="narrow"
        className="card--eta"
      >
        <EtaBar
          progress={activeWorkout.progress}
          elapsed={activeWorkout.elapsed}
          rate={activeWorkout.rate}
          label="eta"
          etaFormat={(t) => `${Math.round(t)} min`}
          width={480}
          height={48}
          title="Evening run progress and estimated time remaining"
          animate
          style={fluid}
        />
        <p className="caption">
          Evening run, 22 min in. About 13 minutes left at your current pace.
        </p>
      </Card>

      <Card span="full" className="card--prose">
        <p className="prose">
          Nice pace today. Your resting heart rate is{" "}
          <Delta
            value={restingHrDelta}
            positive="down"
            format={(n) => `${Math.round(n)} bpm`}
            summary={false}
          />{" "}
          versus last week, and you&rsquo;ve burned{" "}
          <Delta
            value={activeCalDelta.value}
            from={activeCalDelta.from}
            positive="up"
            summary={false}
          />{" "}
          more active calories than yesterday. Keep it rolling.
        </p>
      </Card>
    </div>
  );
}
