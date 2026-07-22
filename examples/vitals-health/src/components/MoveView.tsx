import { ActivityGrid } from "@microcharts/react/activity-grid/interactive";
import { StreakSpark } from "@microcharts/react/streak-spark/interactive";
import { CyclePlot } from "@microcharts/react/cycle-plot/interactive";
import { SpiralYear } from "@microcharts/react/spiral-year/interactive";
import { GradeProfile } from "@microcharts/react/grade-profile/interactive";

import { Card, Lede, fluid } from "./ui";
import {
  workoutStreak,
  workoutStart,
  workoutDone,
  weekdayMinutes,
  weekdayNames,
  yearActivity,
  yearStart,
  runRoute,
  C,
} from "../data";

export function MoveView() {
  const active = workoutStreak.filter((m) => m > 0).length;

  return (
    <div className="grid">
      <Lede kicker="In motion">
        Sixteen steady weeks. Saturdays carry the long run; Mondays and Fridays stay kind on
        purpose.
      </Lede>

      <Card title="Workout minutes" hint={`${active} active days`} span="full">
        <ActivityGrid
          data={workoutStreak}
          layout="grid"
          shape="round"
          anchor={workoutStart}
          weekStart={1}
          cell={13}
          color={C.green}
          title="Workout minutes per day, last 16 weeks"
          style={fluid}
        />
      </Card>

      <Card title="Training consistency" hint="Did I train? · 9 weeks" span="full">
        <StreakSpark
          data={workoutDone}
          positive="up"
          label="both"
          color={C.green}
          width={920}
          height={58}
          title="Pass/fail workout days — current run versus record"
          animate
          style={fluid}
        />
        <p className="caption">
          Each block is a run of days. The bright block on the right is your current streak.
        </p>
      </Card>

      <Card title="The shape of your week" hint="12 weeks" span="narrow">
        <CyclePlot
          data={weekdayMinutes}
          period={7}
          slots={weekdayNames}
          center="mean"
          cycleUnit="weeks"
          color={C.green}
          width={460}
          height={136}
          format={{ maximumFractionDigits: 0 }}
          title="Workout minutes by weekday, averaged across 12 weeks"
          animate
          style={fluid}
        />
        <p className="caption">Saturdays carry the long run; Mondays and Fridays stay easy.</p>
      </Card>

      <Card title="The year in one square" hint="365 days" span="wide" className="card--center">
        <SpiralYear
          data={yearActivity}
          startDate={yearStart}
          size={188}
          color={C.coral}
          title="A full year of daily active minutes on a calendar spiral"
          animate
        />
        <p className="caption caption--center">
          Denser through spring and late summer; a quieter mid-winter stretch.
        </p>
      </Card>

      <Card title="Saturday's route" hint="10 km · +148 m climb" span="full">
        <GradeProfile
          data={runRoute}
          label="max"
          width={920}
          height={140}
          title="Elevation and grade along the 10 km long run"
          animate
          style={fluid}
        />
        <p className="caption">
          Colour marks how steep each pitch is. The hard climb lands just past halfway, then
          it&rsquo;s downhill home.
        </p>
      </Card>
    </div>
  );
}
