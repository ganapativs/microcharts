"use client";

import { CitySkyline } from "@microcharts/react/city-skyline/interactive";
import { DataDiff } from "@microcharts/react/data-diff/interactive";
import { SproutRow } from "@microcharts/react/sprout-row/interactive";
import { MiniBar } from "@microcharts/react/mini-bar/interactive";
import { Topbar, PageHead, Card, SectionHead } from "../components/ui";
import { accounts, syncDiff, compact } from "../data";

const fill = { width: "100%", height: "auto" } as const;
// Cell-sized charts render at natural size (see page.tsx note) — stretching
// them to 100% magnifies the viewBox and balloons their category labels.
const centered = {
  maxWidth: "100%",
  height: "auto",
  display: "block",
  margin: "0 auto",
} as const;

export default function AccountsPage() {
  const skyline = accounts.map((a) => ({
    label: a.short,
    value: a.mrr,
    lit: a.activation,
  }));
  const maturity = accounts.map((a) => ({
    label: a.short,
    value: a.maturity,
  }));
  const active = [...accounts]
    .sort((x, y) => y.wau - x.wau)
    .map((a) => ({ label: a.short, value: a.wau }));

  return (
    <>
      <Topbar title="Accounts" crumb="Pulse" />
      <div className="content">
        <PageHead
          index="05"
          eyebrow="Customer base"
          title="Accounts"
          sub="The book of business at a glance — who's big, who's activated, who's maturing, and what the sync jobs are moving."
        />

        <div className="grid two-col section">
          <Card
            title="Accounts by size & activation"
            sub="MRR height · lit = activated"
            className="hover reveal reveal-1"
          >
            <CitySkyline
              animate
              data={skyline}
              labels
              unit="accounts"
              format={compact}
              height={200}
              bw={46}
              gap={26}
              style={centered}
              title="Accounts by MRR, with lit windows showing activation"
            />
            <p className="chart-note">
              Northwind towers on MRR <b>and</b> lights up nearly every window — big and deeply
              adopted. Solace is the opposite read.
            </p>
          </Card>

          <Card
            title="Nightly sync churn"
            sub="Rows added / removed per job"
            className="hover reveal reveal-2"
          >
            <DataDiff
              animate
              data={syncDiff}
              labels
              net
              label="totals"
              format={compact}
              width={480}
              height={220}
              style={fill}
              title="Rows added and removed per dataset in the nightly import"
            />
            <p className="chart-note">
              Events and Sessions dominate the churn — expected for high-volume streams. Watch{" "}
              <b>Sessions</b>: removals are creeping up.
            </p>
          </Card>
        </div>

        <Card
          title="Account maturity"
          sub="Lifecycle stage · seed → established"
          className="section hover reveal reveal-1"
        >
          <SproutRow
            animate
            data={maturity}
            labels
            height={72}
            step={96}
            style={centered}
            title="Account maturity stage across the top accounts"
          />
          <p className="chart-note">
            Two Enterprise accounts are fully established; the Starter pair are still seedlings —
            prime targets for a success touch.
          </p>
        </Card>

        <SectionHead index="§ 01" title="Most active accounts" sub="Weekly active users" />
        <Card className="hover reveal reveal-2">
          <MiniBar
            animate
            data={active}
            orientation="horizontal"
            highlight={active[0].label}
            format={compact}
            width={1040}
            height={240}
            style={fill}
            title="Accounts ranked by weekly active users"
          />
        </Card>
      </div>
    </>
  );
}
