"use client";
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { MicroBox } from "@microcharts/react/micro-box";
import { PRESETS } from "@/lib/mc-tokens";
import { ACCENTS } from "@/lib/token-export";
import { BOOKINGS_WEEKS, SHARES } from "./home-data";
import { DefineThemeLine } from "./define-theme-line";

/**
 * The theming beat, as an instrument rather than a claim.
 *
 * The paragraph above it used to say the masthead palette button ran
 * `defineTheme`, and then showed one static line of code. A reader had to find a
 * popover behind an icon to see any of it happen, so the section asserted the
 * product's most visible capability and demonstrated none of it.
 *
 * Both controls here are the REAL ones. They write `data-accent` and
 * `data-mc-preset` on `<html>` and store the choice under the same two
 * localStorage keys the masthead uses, so this is not a sandboxed preview: the
 * hero, the specimen sheet and every other mark on the page re-theme with the
 * four specimens below. That is the argument, and the only way to make it is to
 * let the reader run it.
 *
 * The four specimens are one per TOKEN FAMILY, which is what turns a colour
 * picker into an explanation. Three of them read the same thirteen weeks, so what
 * changes between two clicks is the theme and never the data:
 *
 *   `--mc-accent`                    the seed, and the marks that take it
 *   `--mc-positive` / `--mc-negative` valence, which no accent may move
 *   `--mc-cat-1…6`                   derived from the seed
 *   `--mc-stroke` + `--mc-stroke-width` the default ink, which presets retune
 *
 * Nothing here animates and nothing is hidden at rest: the controls are `<button>`
 * elements with `data-state`, the marks are STATIC entries, and the whole block
 * is complete in server HTML at the site's own default.
 */

/** Week-over-week change, from the array the line and the box both draw. */
const WOW = BOOKINGS_WEEKS.slice(1).map((v, i) => v - BOOKINGS_WEEKS[i]!);

/** The five shares the composition beat already uses, given their labels. */
const PARTS = SHARES.map((value, i) => ({ label: `Share ${i + 1}`, value }));

const W = 108;
const H = 26;

/**
 * Write one choice. The default of each pair carries no attribute, exactly as the
 * masthead menu writes it, and the reader's choice survives a reload under the
 * same two localStorage keys. Nothing calls `setState` here: the observer above
 * reads the attribute back, so the switch cannot claim a value the page is not
 * actually wearing.
 */
function pick(key: "accent" | "mcPreset", id: string, fallback: string) {
  const root = document.documentElement;
  if (id === fallback) delete root.dataset[key];
  else root.dataset[key] = id;
  try {
    localStorage.setItem(key === "accent" ? "mc-accent" : "mc-preset", id);
  } catch {}
}

export function ThemeBench() {
  const [accent, setAccent] = useState("cobalt");
  const [preset, setPreset] = useState("modern");

  // Read the live attributes rather than owning the state: the masthead control
  // sets the same two, and two switches disagreeing about what the page is
  // wearing is worse than no second switch at all.
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      setAccent(root.dataset.accent ?? "cobalt");
      setPreset(root.dataset.mcPreset ?? "modern");
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributeFilter: ["data-accent", "data-mc-preset"] });
    return () => mo.disconnect();
  }, []);

  // The preset's own one-line summary, from the list the library ships. There is
  // no second description here to drift from the bundle it names.
  const note = (PRESETS.find((p) => p.id === preset) ?? PRESETS[0]!).note;

  return (
    <div className="bench u-lede">
      <div className="bench-controls">
        <div className="bench-group">
          <span className="kicker" id="bench-accent">
            accent
          </span>
          <div className="bench-chips" role="group" aria-labelledby="bench-accent">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className="bench-sw"
                data-state={a.id === accent ? "on" : "off"}
                aria-pressed={a.id === accent}
                onClick={() => pick("accent", a.id, "cobalt")}
                style={{ "--sw-l": a.light, "--sw-d": a.dark } as CSSProperties}
              >
                <span aria-hidden className="bench-dot" />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bench-group">
          <span className="kicker" id="bench-style">
            chart style
          </span>
          <div className="bench-chips" role="group" aria-labelledby="bench-style">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="bench-chip"
                data-state={p.id === preset ? "on" : "off"}
                aria-pressed={p.id === preset}
                onClick={() => pick("mcPreset", p.id, "modern")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two lines reserved: the notes run one line or two at this measure, and a
          self-sizing caption would move the code and the specimens under it every
          time a reader crossed the row. */}
      <p className="bench-note mono-s">{note}</p>

      <DefineThemeLine />

      <div className="bench-specs">
        <figure className="bench-spec">
          <span className="bench-mark">
            <Sparkline
              curve="smooth"
              color="var(--mc-accent)"
              data={[...BOOKINGS_WEEKS]}
              dots="auto"
              width={W}
              height={H}
              title="Bookings by week, drawn in the accent"
            />
          </span>
          <figcaption>
            <code className="bench-token">--mc-accent</code>
            <span className="bench-what">The color you pass. Emphasis marks take it.</span>
          </figcaption>
        </figure>

        <figure className="bench-spec">
          <span className="bench-mark">
            <SparkBar
              mode="winloss"
              data={WOW}
              width={W}
              height={H}
              title="Week-over-week change, up or down"
            />
          </span>
          <figcaption>
            <code className="bench-token">--mc-positive --mc-negative</code>
            <span className="bench-what">Valence holds. No accent reaches these two.</span>
          </figcaption>
        </figure>

        <figure className="bench-spec">
          <span className="bench-mark">
            <SegmentedBar
              data={PARTS}
              label="none"
              width={W}
              height={14}
              title="Five shares of a whole"
            />
          </span>
          <figcaption>
            <code className="bench-token">--mc-cat-1…6</code>
            <span className="bench-what">Six categories, derived from that one color.</span>
          </figcaption>
        </figure>

        <figure className="bench-spec">
          <span className="bench-mark">
            <MicroBox
              data={[...BOOKINGS_WEEKS]}
              width={W}
              height={H}
              title="Spread of weekly bookings"
            />
          </span>
          <figcaption>
            <code className="bench-token">--mc-stroke --mc-stroke-width</code>
            <span className="bench-what">Default ink and weight. A style retunes both.</span>
          </figcaption>
        </figure>
      </div>

      {/* "above", not "on this page": the seven plates below are pinned to their
          own presets by `preset-scope-style`, which is that wall's whole point. */}
      <p className="bench-foot mono-s">
        {`both controls write two attributes on `}
        <code>{"<html>"}</code>
        {` · every mark above follows · `}
        <Link prefetch={false} href="/docs/theming" className="ulink">
          the whole token contract
        </Link>
      </p>
    </div>
  );
}
