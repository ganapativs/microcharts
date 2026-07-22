import { Sparkline } from "@microcharts/react/sparkline";
import { Sparkline as InteractiveSparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { TrendArrow } from "@microcharts/react/trend-arrow";
import { StatusDot } from "@microcharts/react/status-dot";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { Dumbbell } from "@microcharts/react/dumbbell/interactive";
import { Slope } from "@microcharts/react/slope/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { Threshold, Marker, TargetZone, Callout } from "@microcharts/react/annotations";
import { Figure } from "./Figure";
import {
  breachIndex,
  exportDestinations,
  futuresSeries,
  harvestSwing,
  priceCeiling,
  priceNow,
  priceYearAgo,
  rainfallAnomaly,
  rainfallByRegion,
  retailYoY,
  springRunUp,
  stockCover,
  yieldsByCountry,
} from "../data";

export function Feature() {
  return (
    <article className="article prose" data-mc-theme="editorial">
      <p className="article__kicker">Commodities · Climate</p>
      <h2 className="article__headline">The Bitter Arithmetic of a Warming Cup</h2>
      <p className="article__dek">
        A third failed rainy season across the coffee belt has pushed the price of a morning ritual
        to levels the trade has not seen in half a century. The math behind the mug is no longer
        reassuring.
      </p>
      <p className="article__byline">
        By <span className="article__author">Marisol Everett</span>
        <span className="article__place"> · Poços de Caldas, Brazil</span>
      </p>

      <p className="article__lead">
        For four generations the Ferraz family has read the sky over their hillside rows the way
        others read a ledger. This spring the ledger came due. Arabica futures climbed{" "}
        <span className="mc-inline">
          <Sparkline data={springRunUp} width={64} height={20} summary={false} dots="none" />
        </span>{" "}
        almost without pause through the planting months, and by the second week of June the
        benchmark contract in New York settled at 342 cents a pound{" "}
        <Delta value={priceNow} from={priceYearAgo} positive="down" summary={false} /> year over
        year. For a crop that trades on weather more than on any central bank, the number was less a
        shock than a verdict.
      </p>

      <p>
        The cause is not mysterious. Rainfall across the belt has arrived late, thin, and in the
        wrong order for three seasons running{" "}
        <span className="mc-inline">
          <TrendArrow value={-retailYoY} glyph="chevron" positive="up" summary={false} />
        </span>
        , and the supply that reaches the ports remains&nbsp;
        <span className="mc-inline">
          <StatusDot status="warn" summary={false} />
        </span>{" "}
        constrained. Warehouse stocks have thinned from eleven weeks of cover to six&nbsp;
        <span className="mc-inline">
          <SparkBar data={stockCover} width={52} height={20} summary={false} />
        </span>{" "}
        since the turn of the year, and each of the last six harvests has swung hard against the one
        before it{" "}
        <span className="mc-inline">
          <SparkBar data={harvestSwing} width={56} height={20} mode="winloss" summary={false} />
        </span>
        , so a run of bad years no longer averages out to a good decade.
      </p>

      <blockquote className="pullquote">
        &ldquo;We used to lose a branch here and there to frost. Now we lose the rain that the whole
        hill drinks.&rdquo;
      </blockquote>

      <p>
        Zoom out from any single farm and the pattern hardens into a distribution. Measured against
        the thirty-year normal, the coffee belt&rsquo;s stations this season clustered firmly on the
        dry side of the ledger&mdash;most reporting deficits of three to five hundred millimetres, a
        shortfall that arrives precisely when the cherries are setting.
      </p>

      <Figure
        caption={
          <>
            <b>Fig. 1 &mdash; A dry season, by the station.</b> Rainfall anomaly across 46 belt
            stations, millimetres below the 30-year normal. The marked bin holds the belt&rsquo;s
            median deficit of roughly 410&nbsp;mm.
          </>
        }
      >
        <HistogramStrip
          data={rainfallAnomaly}
          bins={10}
          markValue={-410}
          width={640}
          height={140}
          format={{ maximumFractionDigits: 0 }}
          summary={false}
          style={{ width: "100%", height: "auto" }}
        />
      </Figure>

      <p>
        The regions that anchor the world&rsquo;s supply were hit unevenly but without exception. In
        Minas Gerais, the state that alone grows more arabica than any country outside Brazil, the
        season delivered barely two thirds of its usual water. The wetter highlands of Vietnam fared
        better in absolute terms and still lost a third of their margin.
      </p>

      <Figure
        caption={
          <>
            <b>Fig. 2 &mdash; What the hills expected, and what they got.</b> Seasonal rainfall by
            growing region: the 30-year normal (open) against the 2025 season (filled), in
            millimetres.
          </>
        }
      >
        <Dumbbell
          data={rainfallByRegion}
          highlight="Minas Gerais"
          positive="up"
          label="value"
          domain={[700, 2100]}
          width={640}
          height={220}
          format={{ maximumFractionDigits: 0 }}
          summary={false}
          style={{ width: "100%", height: "auto" }}
        />
      </Figure>

      <blockquote className="pullquote">
        A run of bad years no longer averages out to a good decade.
      </blockquote>

      <p>
        Yields tell the same story a decade deep. Compare the bags each producing country coaxed
        from a hectare in 2015 with the harvest of 2025 and the lines mostly slope the wrong way.
        Vietnam&rsquo;s once commanding productivity has slipped hardest; only Colombia and
        Ethiopia, buoyed by replanting and altitude, held or gained ground.
      </p>

      <Figure
        wide
        caption={
          <>
            <b>Fig. 3 &mdash; Ten years, per hectare.</b> Green-coffee yield by country, bags per
            hectare, 2015 against 2025. Countries shown: Brazil, Vietnam, Colombia, Ethiopia,
            Honduras &mdash; Vietnam highlighted.
          </>
        }
      >
        <Slope
          data={yieldsByCountry}
          highlight="Vietnam"
          positive="up"
          label="value"
          width={760}
          height={320}
          format={{ maximumFractionDigits: 0 }}
          summary={false}
          style={{ width: "100%", height: "auto" }}
        />
      </Figure>

      <p>
        Where the beans finally go has barely moved, and that is its own kind of pressure. Europe
        still drinks the largest share of the world&rsquo;s green coffee, with North America and
        Japan absorbing most of the rest&mdash;a concentrated demand that leaves little slack when a
        harvest disappoints.
      </p>

      <Figure
        caption={
          <>
            <b>Fig. 4 &mdash; One crop, a few tables.</b> Destination share of green-coffee exports
            by volume. Demand stays concentrated even as supply thins.
          </>
        }
      >
        <SegmentedBar
          data={exportDestinations}
          label="percent"
          width={640}
          height={72}
          summary={false}
          style={{ width: "100%", height: "auto" }}
        />
      </Figure>

      <p>
        Traders spent the spring watching a single line and a single number. For years, three
        hundred cents a pound had served as a kind of ceiling&mdash;a level the market approached
        and retreated from. This season it stopped retreating.
      </p>

      <Figure
        wide
        caption={
          <>
            <b>Fig. 5 &mdash; The ceiling that became a floor.</b> ICE arabica futures, monthly
            close in US cents per pound, over 18 months. The hairline marks the 300¢ level the
            market kept testing; the flag marks the month it closed above and stayed.
          </>
        }
      >
        <InteractiveSparkline
          data={futuresSeries}
          width={760}
          height={210}
          fill
          dots="minmax"
          label="last"
          format={{ maximumFractionDigits: 0 }}
          summary={false}
          animate
          style={{ width: "100%", height: "auto" }}
        >
          <TargetZone y={[280, 320]} label="ceiling band" />
          <Threshold y={priceCeiling} label="300¢ ceiling" />
          <Marker x={breachIndex} label="First close above" celebrate />
          <Callout x={breachIndex} y={futuresSeries[breachIndex]} label="breach" />
        </InteractiveSparkline>
      </Figure>

      <p>
        None of this reads as a temporary squeeze to the people who grow the crop. The Ferraz family
        has begun replanting a fifth of their rows with a hardier, lower-yielding
        varietal&mdash;insurance against a climate that no longer keeps its old appointments. The
        cup on the far end of that decision will cost more, and it will keep costing more, because
        the arithmetic that used to forgive a bad year has quietly stopped doing so.
      </p>

      <p className="article__end">
        Marisol Everett is a contributing correspondent for Dispatch. Additional reporting from São
        Paulo.
      </p>
    </article>
  );
}
