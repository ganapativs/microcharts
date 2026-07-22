"use client";

import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { ActivityGrid } from "@microcharts/react/activity-grid/interactive";
import { FatDigits } from "@microcharts/react/fat-digits/interactive";
import { Progress } from "@microcharts/react/progress/interactive";
import { IconArray } from "@microcharts/react/icon-array/interactive";
import { RateVolume } from "@microcharts/react/rate-volume/interactive";
import { NetFlow } from "@microcharts/react/net-flow/interactive";
import { ParetoStrip } from "@microcharts/react/pareto-strip/interactive";
import { QueueDepth } from "@microcharts/react/queue-depth/interactive";
import { Topbar, PageHead, Card, SectionHead } from "./components/ui";
import {
  kpis,
  mrrGoal,
  trafficSources,
  dau,
  usd,
  compact,
  pct,
  eventsTracked,
  activation,
  alertsAdoption,
  activationRateVolume,
  userFlow,
  dropoffReasons,
  supportBacklog,
  supportCapacity,
} from "./data";

const fill = { width: "100%", height: "auto" } as const;
// Cell-sized charts (fixed px per cell) must NOT be stretched to 100% — that
// magnifies the whole viewBox and balloons the labels. Render at natural size,
// shrink only on narrow viewports, and center in the wide card.
const centered = {
  maxWidth: "100%",
  height: "auto",
  display: "block",
  margin: "0 auto",
} as const;

export default function OverviewPage() {
  return (
    <>
      <Topbar title="Overview" crumb="Pulse" />
      <div className="content">
        <PageHead
          index="01"
          eyebrow="This month · to date"
          title="Overview"
          sub="Everything moving through the product — acquisition, activation, revenue, and the support load carrying it."
        />

        <div className="kpi-strip section reveal reveal-1">
          {kpis.map((k) => (
            <div key={k.key} className="kpi-cell">
              <span className="kpi-label">{k.label}</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{k.display}</span>
                <Delta value={k.value} from={k.from} positive={k.positive} summary={false} />
              </div>
              <div className="kpi-spark">
                <Sparkline
                  animate
                  data={k.spark}
                  fill
                  width={220}
                  height={40}
                  dots="none"
                  style={fill}
                  summary={`${k.label} trend over the last 30 days`}
                />
              </div>
            </div>
          ))}
        </div>

        <SectionHead index="§ 01" title="Headline" sub="The three numbers we brief the team on" />
        <div className="bento section">
          <Card className="c5 hover reveal reveal-1">
            <div className="stat">
              <span className="stat-eyebrow">Events tracked · month to date</span>
              <FatDigits
                animate
                value={eventsTracked}
                format={compact}
                fontSize={40}
                summary="48.2 million analytics events tracked this month"
              />
              <span className="stat-foot">
                <Delta value={eventsTracked} from={41_900_000} positive="up" summary={false} />
                vs. last month
              </span>
            </div>
          </Card>

          <Card
            title="Onboarding activation"
            sub="Activated of signed-up"
            className="c4 hover reveal reveal-2"
          >
            <Progress
              animate
              value={activation.value}
              max={activation.max}
              label="percent"
              width={320}
              height={30}
              style={fill}
              title="Onboarding activation rate"
            />
            <p className="chart-note">
              <b>{activation.value.toLocaleString("en-US")}</b> of{" "}
              {activation.max.toLocaleString("en-US")} new users reached the activation milestone.
            </p>
          </Card>

          <Card title="Alerts adoption" sub="Active accounts" className="c3 hover reveal reveal-3">
            <IconArray
              animate
              value={alertsAdoption}
              total={20}
              label="ratio"
              width={220}
              height={120}
              style={fill}
              title="Share of active accounts using Alerts"
            />
          </Card>
        </div>

        <SectionHead index="§ 02" title="Flow" sub="Where growth is really coming from" />
        <div className="bento section">
          <Card
            title="Signups vs. churn"
            sub="Weekly · net users"
            className="c6 hover reveal reveal-1"
          >
            <NetFlow
              animate
              data={userFlow}
              label="last"
              width={520}
              height={190}
              style={fill}
              title="Weekly signups against churned users, with the net line"
            />
            <p className="chart-note">
              Net user growth held positive every week this quarter — the widening gap is churn
              falling faster than signups slowed.
            </p>
          </Card>

          <Card
            title="Activation rate"
            sub="On its signup volume"
            className="c6 hover reveal reveal-2"
          >
            <RateVolume
              animate
              data={activationRateVolume}
              unit="signups"
              format={pct}
              volumeFormat={compact}
              width={520}
              height={190}
              style={fill}
              title="Weekly activation rate over signup volume"
            />
            <p className="chart-note">
              Rate is climbing <b>even as volume rises</b> — the onboarding changes are holding up
              under load.
            </p>
          </Card>
        </div>

        <SectionHead
          index="§ 03"
          title="Friction"
          sub="What slows new users, and the load it creates"
        />
        <div className="bento section">
          <Card
            title="Onboarding drop-off"
            sub="Why new users churn"
            className="c7 hover reveal reveal-1"
          >
            <ParetoStrip
              animate
              data={dropoffReasons}
              unit="reasons"
              metric="drop-offs"
              width={560}
              height={200}
              style={fill}
              title="Top reasons new users abandon onboarding, cumulative share"
            />
            <p className="chart-note">
              The top three reasons account for <b>most</b> of all drop-off — fix time-to-value
              first.
            </p>
          </Card>

          <Card
            title="Support backlog"
            sub="Open tickets · 3 weeks"
            className="c5 hover reveal reveal-2"
          >
            <QueueDepth
              animate
              data={supportBacklog}
              capacity={supportCapacity}
              width={420}
              height={200}
              style={fill}
              title="Open support tickets per day against the team's WIP capacity"
            />
            <p className="chart-note">
              Backlog crossed the <b>capacity line</b> for four days after the launch spike, now
              draining.
            </p>
          </Card>
        </div>

        <SectionHead
          index="§ 04"
          title="Revenue & reach"
          sub="The goal line, and where sessions originate"
        />
        <div className="grid two-col section">
          <Card title="Quarterly MRR goal" sub="Target $90k" className="hover reveal reveal-1">
            <Bullet
              animate
              value={mrrGoal.value}
              target={mrrGoal.target}
              bands={mrrGoal.bands}
              domain={[0, 100000]}
              format={usd}
              width={480}
              height={54}
              style={fill}
              title="Monthly recurring revenue against the quarterly goal"
            />
          </Card>

          <Card title="Traffic sources" sub="New sessions" className="hover reveal reveal-2">
            <SegmentedBar
              animate
              data={trafficSources}
              label="percent"
              width={480}
              height={40}
              style={fill}
            />
          </Card>
        </div>

        <SectionHead index="§ 05" title="Rhythm" sub="Daily active users, week by week" />
        <Card title="Daily active users" sub="Last 20 weeks" className="hover reveal reveal-3">
          <ActivityGrid
            animate
            data={dau}
            anchor="2026-02-23"
            weekStart={1}
            cell={18}
            gap={3}
            style={centered}
            title="Daily active users over the last 20 weeks"
          />
        </Card>
      </div>
    </>
  );
}
