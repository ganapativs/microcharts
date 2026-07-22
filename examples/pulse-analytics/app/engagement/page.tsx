"use client";

import { StackedArea } from "@microcharts/react/stacked-area/interactive";
import { RetentionCurve } from "@microcharts/react/retention-curve/interactive";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { BumpStrip } from "@microcharts/react/bump-strip/interactive";
import { CohortTriangle } from "@microcharts/react/cohort-triangle/interactive";
import { ControlStrip } from "@microcharts/react/control-strip/interactive";
import { ChangePoint } from "@microcharts/react/change-point/interactive";
import { Threshold, TargetZone, Callout } from "@microcharts/react/annotations";
import { Topbar, PageHead, Card, SectionHead, Legend } from "../components/ui";
import {
  featureAdoption,
  featureRanks,
  cohorts,
  apiLatency,
  errorRate,
  errorRateBreak,
  retention,
  retentionBenchmark,
  featureUsage,
  compact,
  ms,
} from "../data";

const fill = { width: "100%", height: "auto" } as const;
// Cell-sized charts render at natural size (see page.tsx note) — stretching
// them to 100% magnifies the viewBox and balloons the in-cell labels.
const centered = {
  maxWidth: "100%",
  height: "auto",
  display: "block",
  margin: "0 auto",
} as const;
const rate1 = { maximumFractionDigits: 1 } as const;

export default function EngagementPage() {
  return (
    <>
      <Topbar title="Engagement" crumb="Pulse" />
      <div className="content">
        <PageHead
          index="03"
          eyebrow="Product usage"
          title="Engagement"
          sub="What people do after they sign up — which features win, how cohorts retain, and where the system strains."
        />

        <div className="grid two-col section">
          <Card
            title="Feature adoption"
            sub="Weekly active · 16 weeks"
            className="hover reveal reveal-1"
          >
            <StackedArea
              animate
              data={featureAdoption.series}
              colors={featureAdoption.colors}
              label="last"
              width={480}
              height={200}
              format={compact}
              style={fill}
              title="Weekly active users by feature"
            />
            <Legend
              items={featureAdoption.labels.map((label, i) => ({
                label,
                color: featureAdoption.colors[i],
              }))}
            />
          </Card>

          <Card
            title="Cohort retention"
            sub="vs. industry benchmark"
            className="hover reveal reveal-2"
          >
            <RetentionCurve
              animate
              data={retention}
              benchmark={retentionBenchmark}
              label="last"
              unit="week"
              width={480}
              height={200}
              style={fill}
              title="Weekly cohort retention against the industry benchmark"
            />
          </Card>
        </div>

        <SectionHead
          index="§ 01"
          title="Feature rank"
          sub="Position by weekly active · last 8 weeks"
        />
        <Card className="section hover reveal reveal-1">
          <div className="rank-list">
            {featureRanks.map((f) => (
              <div key={f.name} className="rank-row">
                <span className="rank-name">{f.name}</span>
                <BumpStrip
                  animate
                  data={f.ranks}
                  maxRank={featureRanks.length}
                  label="ends"
                  dots="changes"
                  width={960}
                  height={34}
                  style={fill}
                  summary={`${f.name} rank over the last 8 weeks`}
                />
              </div>
            ))}
          </div>
          <p className="chart-note">
            Dashboards has held #1 all quarter; <b>Alerts overtook Reports</b> in week 3 and
            hasn&apos;t given the spot back.
          </p>
        </Card>

        <SectionHead
          index="§ 02"
          title="Under load"
          sub="Where the system strains when usage climbs"
        />
        <div className="grid two-col section">
          <Card
            title="API p95 latency"
            sub="Hourly · milliseconds"
            className="hover reveal reveal-1"
          >
            <ControlStrip
              animate
              data={apiLatency}
              format={ms}
              width={480}
              height={180}
              style={fill}
              title="API p95 latency with statistical process-control limits"
            >
              <Threshold y={200} label="SLO" />
              <TargetZone y={[120, 180]} label="comfort" />
            </ControlStrip>
            <p className="chart-note">
              Two readings breached the <b>±3σ control band</b> during the 09:00 deploy — inside the
              200ms SLO, but worth a look.
            </p>
          </Card>

          <Card
            title="Error rate"
            sub="Percent · stepped after deploy"
            className="hover reveal reveal-2"
          >
            <ChangePoint
              animate
              data={errorRate}
              breaks={[errorRateBreak]}
              label="delta"
              format={rate1}
              width={480}
              height={180}
              style={fill}
              title="Error rate with a detected regime shift after the deploy"
            >
              <Callout x={errorRateBreak} y={errorRate[errorRateBreak]} label="regime" />
            </ChangePoint>
            <p className="chart-note">
              A bad deploy stepped the baseline error rate from <b>~0.8% to ~1.9%</b>. The regime
              shift is the story, not any single spike.
            </p>
          </Card>
        </div>

        <SectionHead
          index="§ 03"
          title="Who stays"
          sub="Retention by cohort, and usage per feature"
        />
        <Card
          title="Retention cohorts"
          sub="Monthly · % still active"
          className="section hover reveal reveal-1"
        >
          <CohortTriangle
            animate
            data={cohorts}
            unit="month"
            highlight="Apr"
            cell={38}
            gap={5}
            style={centered}
            title="Monthly signup cohorts by retention age"
          />
          <p className="chart-note">
            The <b>April cohort</b> retains best at equal maturity — it landed just after the guided
            onboarding shipped.
          </p>
        </Card>

        <Card
          title="Feature usage"
          sub="Weekly, per feature · own scale each"
          className="hover reveal reveal-2"
        >
          <div className="grid feature-grid">
            {featureUsage.map((f) => (
              <div key={f.name} className="feature-cell">
                <div className="feature-top">
                  <span className="feature-name">{f.name}</span>
                  <Delta value={f.weekly} from={f.from} positive={f.positive} summary={false} />
                </div>
                <span className="feature-num">{f.weekly.toLocaleString("en-US")}</span>
                <Sparkline
                  animate
                  data={f.usage}
                  dots="auto"
                  width={320}
                  height={40}
                  style={fill}
                  summary={`${f.name} weekly usage trend`}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
