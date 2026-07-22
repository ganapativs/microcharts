import { useState } from "react";
import { Hypnogram } from "@microcharts/react/hypnogram/interactive";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { CalendarStrip } from "@microcharts/react/calendar-strip/interactive";
import { PolarClock } from "@microcharts/react/polar-clock/interactive";
import { FoldedDayBand } from "@microcharts/react/folded-day-band/interactive";
import { MoonPhase } from "@microcharts/react/moon-phase/interactive";

import { Card, Lede, fluid } from "./ui";
import {
  sleepStages,
  sleepStates,
  sleepStateColors,
  sleepDuration,
  sleepConsistency,
  TODAY,
  dayCycle,
  dayCycleNow,
  foldedHr,
  foldedHrToday,
  cyclePhase,
  C,
} from "../data";

/** Compact "9p" / "6a" style hour label, matching the app's axis voice. */
const hourLabel = (h: number): string => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;

export function SleepView() {
  const avg = sleepDuration.reduce((a, b) => a + b, 0) / sleepDuration.length;
  const [stage, setStage] = useState<{
    label?: string;
    value: number | null;
    formatted?: string;
  } | null>(null);

  return (
    <div className="grid">
      <Lede kicker="Overnight">
        Seven and a half restful hours, and your heart found its usual quiet trough right on
        schedule.
      </Lede>

      <Card title="Last night" hint="7h 35m asleep" span="full">
        <Hypnogram
          data={sleepStages}
          states={sleepStates}
          mode="lanes"
          colors={sleepStateColors}
          connectors
          labels
          width={920}
          height={140}
          title="Sleep stages overnight"
          onActive={setStage}
          readout={false}
          animate
          style={fluid}
        />
        <p className="axis axis--wide">
          <span>11p</span>
          <span>1a</span>
          <span>3a</span>
          <span>5a</span>
          <span>7a</span>
        </p>
        <p className="picker-readout">
          {stage
            ? (stage.formatted ?? `${stage.label} · ${Math.round(stage.value ?? 0)} min`)
            : "Hover or focus a stage — reading lives here"}
        </p>
      </Card>

      <Card title="Duration" hint={`${avg.toFixed(1)}h avg`}>
        <Sparkline
          data={sleepDuration}
          band={[7, 9]}
          dots="auto"
          label="last"
          color={C.blue}
          width={460}
          height={72}
          format={{ maximumFractionDigits: 1 }}
          title="Sleep duration, last 14 nights"
          animate
          style={fluid}
        />
        <p className="caption">Shaded band marks the 7&ndash;9h target range.</p>
      </Card>

      <Card title="Consistency" hint="8 weeks">
        <CalendarStrip
          data={sleepConsistency}
          weeks={8}
          end={TODAY}
          weekStart={1}
          cell={11}
          color={C.blue}
          title="Sleep-consistency score by day"
          style={fluid}
        />
        <p className="caption">Darker cells are more restful nights.</p>
      </Card>

      <Card title="Day rhythm" hint="24 hours" span="wide" className="card--center">
        <PolarClock
          data={dayCycle}
          now={dayCycleNow}
          size={168}
          color={C.blue}
          segmentFormat={hourLabel}
          title="Movement around the 24-hour clock"
          animate
        />
        <p className="caption caption--center">
          Two waking peaks, a long quiet trough. You wind down around 9pm.
        </p>
      </Card>

      <Card title="Recovery cycle" hint="Day 19 of 28" span="narrow" className="card--center">
        <MoonPhase
          value={cyclePhase}
          mode="cycle"
          size={132}
          color={C.plum}
          title="Where you are in the 28-day wellness cycle"
        />
        <p className="caption caption--center">
          Past the peak of this block. Energy usually eases from here.
        </p>
      </Card>

      <Card title="Your night, most nights" hint="Resting HR, folded over 14 nights" span="full">
        <FoldedDayBand
          data={foldedHr}
          today={foldedHrToday}
          period={24}
          bins={24}
          width={920}
          height={140}
          format={{ maximumFractionDigits: 0 }}
          title="Circadian resting heart rate — typical band with last night overlaid"
          animate
          style={fluid}
        />
        <p className="axis axis--wide">
          <span>12a</span>
          <span>6a</span>
          <span>12p</span>
          <span>6p</span>
          <span>12a</span>
        </p>
        <p className="caption">
          The darker line is last night. Your heart settles into the same overnight trough almost
          every night.
        </p>
      </Card>
    </div>
  );
}
