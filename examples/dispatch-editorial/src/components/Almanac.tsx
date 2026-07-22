import type { ReactNode } from "react";
import { StationGlyph } from "@microcharts/react/station-glyph/interactive";
import { WindBarb } from "@microcharts/react/wind-barb";
import { MoonPhase } from "@microcharts/react/moon-phase/interactive";
import { Hourglass } from "@microcharts/react/hourglass/interactive";
import { FillWord } from "@microcharts/react/fill-word/interactive";
import { DicePips } from "@microcharts/react/dice-pips/interactive";
import { GardenGrid } from "@microcharts/react/garden-grid/interactive";
import { MusicStaff } from "@microcharts/react/music-staff/interactive";
import { useReveal } from "./useReveal";
import {
  airSeverity,
  fireDanger,
  migrationFlow,
  moonNewIn,
  moonTonight,
  prevailingWind,
  rainRhythm,
  reservoirFraction,
  snowpackFraction,
  solsticeElapsed,
  stations,
  tideHighs,
  weekHighs,
} from "../data";

/** One almanac entry: a glyph plate, a small-caps label, an almanac reading. */
function Entry({
  label,
  reading,
  children,
  wide = false,
}: {
  label: string;
  reading: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={wide ? "alm-entry alm-entry--wide" : "alm-entry"}>
      <span className="alm-entry__label">{label}</span>
      <div className="alm-entry__glyph">{children}</div>
      <p className="alm-entry__reading">{reading}</p>
    </div>
  );
}

function Section({
  index,
  title,
  blurb,
  children,
}: {
  index: string;
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <section className="alm-section">
      <div className="alm-section__head">
        <span className="alm-section__index">{index}</span>
        <h3 className="alm-section__title">{title}</h3>
        <p className="alm-section__blurb">{blurb}</p>
      </div>
      <div className="alm-grid">{children}</div>
    </section>
  );
}

export function Almanac() {
  return (
    <div className="almanac" data-mc-theme="editorial">
      <header className="almanac__head">
        <p className="article__kicker">The Almanac</p>
        <h2 className="almanac__title">The Reckoning of the Week</h2>
        <p className="almanac__standfirst">
          A field ledger for the days ahead: the skies overhead, the winds that move through them,
          the water in the ground, and the odds of trouble. Every mark below is a small chart,
          printed to read in gray.
        </p>
      </header>

      <Section
        index="I"
        title="State of the Skies"
        blurb="Station models for four regional posts, read at a glance: the disc gives sky cover, the barb gives wind, the corners give temperature, dew point, and pressure."
      >
        {stations.map((s) => (
          <Entry
            key={s.station}
            label={s.place}
            reading={
              <>
                <b>{s.station}</b> · {s.temp}°F, wind {s.wind.magnitude} mph,{" "}
                {Math.round(s.cloud * 100)}% sky cover.
              </>
            }
          >
            <StationGlyph
              station={s.station}
              cloud={s.cloud}
              wind={s.wind}
              temp={s.temp}
              dewpoint={s.dewpoint}
              pressure={s.pressure}
              size={72}
              summary={false}
            />
          </Entry>
        ))}
      </Section>

      <Section
        index="II"
        title="Winds & Wanderers"
        blurb="What moves through the region this week — the prevailing wind off the coast, and the net bearing of the season's songbird passage overhead."
      >
        <Entry
          label="Prevailing Wind"
          reading={
            <>
              From the <b>southwest</b>, steady near {prevailingWind.magnitude} mph. Each barb
              counts ten.
            </>
          }
        >
          <WindBarb
            direction={prevailingWind.direction}
            magnitude={prevailingWind.magnitude}
            step={10}
            label="value"
            size={72}
            summary={false}
          />
        </Entry>
        <Entry
          label="Migration Flow"
          reading={
            <>
              Net southerly passage, <b>heavy</b> — roughly 340 birds an hour crossing the ridge
              line after dusk.
            </>
          }
        >
          <WindBarb
            direction={migrationFlow.direction}
            magnitude={migrationFlow.magnitude}
            step={10}
            label="value"
            size={72}
            summary={false}
          />
        </Entry>
      </Section>

      <Section
        index="III"
        title="The Sky Calendar"
        blurb="Time and light: the moon tonight, the slow drain of the season toward the solstice, and the shape of the week's forecast highs as a short melody."
      >
        <Entry
          label="The Moon Tonight"
          reading={
            <>
              <b>Waning gibbous</b>, {Math.round(moonTonight * 100)}% lit. New moon in{" "}
              {Math.round(moonNewIn * 28)} days.
            </>
          }
        >
          <MoonPhase value={moonTonight} mode="cycle" size={72} summary={false} />
        </Entry>
        <Entry
          label="Toward the Solstice"
          reading={
            <>
              The autumn season runs <b>two-thirds</b> elapsed; the sand marks what light is left
              before the year turns.
            </>
          }
        >
          <Hourglass
            value={solsticeElapsed}
            label="remaining"
            width={54}
            height={72}
            summary={false}
          />
        </Entry>
        <Entry
          label="The Week in Weather"
          wide
          reading={
            <>
              Forecast highs, Monday through Sunday (°F). A midweek peak at 63, then a cool slide
              into the weekend.
            </>
          }
        >
          <MusicStaff
            data={weekHighs}
            mode="ledger"
            label="last"
            width={220}
            height={72}
            format={{ maximumFractionDigits: 0 }}
            summary={false}
          />
        </Entry>
      </Section>

      <Section
        index="IV"
        title="Water & Ground"
        blurb="What the land is holding: mountain snowpack and reservoir storage as inked words, and five weeks of measurable rain printed as a grayscale rhythm."
      >
        <Entry
          label="Snowpack"
          reading={
            <>
              <b>{Math.round(snowpackFraction * 100)}%</b> of the April-1 normal in the headwaters —
              a lean start to the water year.
            </>
          }
        >
          <FillWord
            word="SNOWPACK"
            value={snowpackFraction}
            mode="fill"
            label="value"
            fontSize={26}
            summary={false}
          />
        </Entry>
        <Entry
          label="Reservoir"
          reading={
            <>
              Storage at <b>{Math.round(reservoirFraction * 100)}%</b> of capacity, and holding
              through the dry stretch.
            </>
          }
        >
          <FillWord
            word="RESERVOIR"
            value={reservoirFraction}
            mode="fill"
            label="value"
            fontSize={26}
            summary={false}
          />
        </Entry>
        <Entry
          label="Rain Rhythm"
          wide
          reading={
            <>
              Measurable-rain days over five weeks, darker for heavier fall. The wet middle week
              stands out against the dry flanks.
            </>
          }
        >
          <GardenGrid
            data={rainRhythm}
            rows={7}
            steps={5}
            unit="rain days"
            cell={13}
            summary={false}
          />
        </Entry>
      </Section>

      <Section
        index="V"
        title="The Odds of Trouble"
        blurb="Two hazard readings on the almanac's old six-point dice, and the coming week's tide highs as a second melody for those who work the water."
      >
        <Entry
          label="Fire Weather"
          reading={
            <>
              <b>Four of six</b> on the danger die — elevated, on account of low humidity and a
              persistent offshore breeze.
            </>
          }
        >
          <DicePips value={fireDanger} size={56} summary={false} />
        </Entry>
        <Entry
          label="Air Quality"
          reading={
            <>
              <b>Two of six</b> — good to moderate, with a little haze settling in the valleys
              overnight.
            </>
          }
        >
          <DicePips value={airSeverity} size={56} summary={false} />
        </Entry>
        <Entry
          label="The Week in Tides"
          wide
          reading={
            <>
              Predicted high tides, in feet, Monday through Sunday. Spring tides crest midweek
              before the range eases off.
            </>
          }
        >
          <MusicStaff
            data={tideHighs}
            mode="ledger"
            label="last"
            width={220}
            height={72}
            format={{ maximumFractionDigits: 1 }}
            summary={false}
          />
        </Entry>
      </Section>
    </div>
  );
}
