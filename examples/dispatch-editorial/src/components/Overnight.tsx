import { Sparkline } from "@microcharts/react/sparkline";
import { Sparkline as InteractiveSparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { TrendArrow } from "@microcharts/react/trend-arrow";
import { StatusDot } from "@microcharts/react/status-dot";
import { LikertStrip } from "@microcharts/react/likert-strip/interactive";
import { PartitionStrip } from "@microcharts/react/partition-strip/interactive";
import { PairedBars } from "@microcharts/react/paired-bars/interactive";
import { Figure } from "./Figure";
import {
  budgetComposition,
  costPerRiderNow,
  costPerRiderProjected,
  districtSpend,
  fareEvasionYoY,
  incidentsWeekly,
  onTimeNights,
  overnightRidership,
  readerPoll,
  venueReopenings,
} from "../data";

export function Overnight() {
  return (
    <article className="article prose" data-mc-theme="editorial">
      <p className="article__kicker">Cities · Transit</p>
      <h2 className="article__headline">The Line That Never Sleeps</h2>
      <p className="article__dek">
        A year ago the last train left at midnight. Then Halvorsen kept the lights on until dawn,
        and a mid-size city learned what its nights were worth.
      </p>
      <p className="article__byline">
        By <span className="article__author">Dev Okonkwo</span>
        <span className="article__place"> · Halvorsen, Oregon</span>
      </p>

      <p className="article__lead">
        The 2:40 to Harbor is not a romantic train. It smells of floor cleaner and cold coffee, and
        on a Tuesday it carries maybe forty people. But a year into the city&rsquo;s overnight
        pilot, those forty have become a crowd: average overnight boardings have climbed{" "}
        <span className="mc-inline">
          <InteractiveSparkline
            data={overnightRidership}
            width={72}
            height={22}
            summary={false}
            dots="none"
            animate
            style={{ width: "3.4em", height: "1em" }}
          />
        </span>{" "}
        from four thousand a night to nearly eighteen, and the cost of moving each of them has
        fallen{" "}
        <Delta
          value={costPerRiderNow}
          from={costPerRiderProjected}
          positive="down"
          format={{ style: "currency", currency: "USD" }}
          summary={false}
        />{" "}
        against what the planners had penciled in.
      </p>

      <p>
        The worries that dominated the council hearings have mostly not materialized. Fare evasion
        is down{" "}
        <span className="mc-inline">
          <TrendArrow value={fareEvasionYoY} glyph="chevron" positive="down" summary={false} />
        </span>
        , reported incidents have thinned week over week{" "}
        <span className="mc-inline">
          <SparkBar data={incidentsWeekly} width={52} height={20} summary={false} />
        </span>
        , and on-time performance has held&nbsp;
        <span className="mc-inline">
          <StatusDot status="ok" summary={false} />
        </span>{" "}
        steady even on the nights maintenance runs long{" "}
        <span className="mc-inline">
          <SparkBar data={onTimeNights} width={56} height={20} mode="winloss" summary={false} />
        </span>
        . Along the Harbor corridor, eighteen late-night venues have reopened or extended hours{" "}
        <span className="mc-inline">
          <Sparkline data={venueReopenings} width={56} height={20} summary={false} dots="none" />
        </span>{" "}
        since the first all-night timetable took effect.
      </p>

      <blockquote className="pullquote">
        &ldquo;We didn&rsquo;t build a train for the night shift. We found out how many people were
        already living on it.&rdquo;
      </blockquote>

      <p>
        None of it is free. The overnight program runs on a forty-five-million dollar budget, and
        where that money goes says a great deal about what it takes to keep a city moving after
        midnight. Nearly half of every dollar pays the people on the platform&mdash;operators,
        mechanics, the security staff whose visible presence did more for ridership than any fare
        promotion.
      </p>

      <Figure
        caption={
          <>
            <b>Fig. 1 &mdash; Where the night&rsquo;s money goes.</b> The overnight operating
            budget, $45.9M, by program area and line item. Labor dominates operations; capital
            renewal is the second call on the purse.
          </>
        }
      >
        <PartitionStrip
          data={budgetComposition}
          labels
          width={640}
          height={148}
          summary={false}
          style={{ width: "100%", height: "auto" }}
        />
      </Figure>

      <p>
        The spend did not land evenly across the map, and the variance is the story planners now
        study most closely. Four of the five service districts came in within a whisker of budget;
        only Downtown, where a signal retrofit slipped a quarter, finished meaningfully under.
      </p>

      <Figure
        caption={
          <>
            <b>Fig. 2 &mdash; Budget against actual, by district.</b> Planned allocation (ghost)
            versus money actually spent (solid), in millions. Coming in under budget is the
            favorable outcome.
          </>
        }
      >
        <PairedBars
          data={districtSpend}
          mode="overlay"
          orientation="horizontal"
          positive="down"
          width={640}
          height={220}
          format={{ maximumFractionDigits: 1 }}
          summary={false}
          style={{ width: "100%", height: "auto" }}
        />
      </Figure>

      <p>
        Whether any of it was worth doing is, in the end, a question the ledger cannot answer. So
        Dispatch asked the people who ride. Of 2,140 readers polled along the corridor, a clear
        majority now say the overnight line has earned its keep&mdash;though a stubborn fifth remain
        unconvinced the fare box will ever catch the cost.
      </p>

      <Figure
        wide
        caption={
          <>
            <b>Fig. 3 &mdash; &ldquo;Was the overnight line worth the cost?&rdquo;</b> Reader poll,
            n = 2,140, from strongly oppose (left) to strongly support (right). The center holds
            those with no strong opinion.
          </>
        }
      >
        <LikertStrip
          data={readerPoll}
          neutral="split"
          label="ends"
          width={760}
          height={88}
          summary={false}
          style={{ width: "100%", height: "auto" }}
        />
      </Figure>

      <p>
        The council votes in the fall on whether to make the pilot permanent. The 2:40 to Harbor,
        for its part, will keep running until then&mdash;half empty on the slow nights,
        standing-room on the loud ones, a moving argument for a city that decided its dark hours
        were worth counting.
      </p>

      <p className="article__end">Dev Okonkwo covers cities and infrastructure for Dispatch.</p>
    </article>
  );
}
