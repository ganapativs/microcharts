"use client";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { defineTheme, type ThemePreset } from "@microcharts/react/theme";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { StackedArea } from "@microcharts/react/stacked-area/interactive";
import { INK_PRESET_CATS } from "@/lib/token-export";

/** Live theming demo — swatches call `defineTheme` and spread vars onto the scope. */

const ACCENTS = [
  { name: "ember", hex: "#c2410c" },
  { name: "cobalt", hex: "#2f52d4" },
  { name: "violet", hex: "#6d28d9" },
  { name: "moss", hex: "#4d7c1e" },
  { name: "teal", hex: "#0f766e" },
  { name: "rose", hex: "#be123c" },
] as const;

const PRESETS: ThemePreset[] = ["modern", "editorial", "mono", "vivid", "print", "eink"];

const REVENUE = [132, 148, 141, 165, 159, 182, 176, 203];
const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
];
const AREAS = [
  { label: "api", values: [4, 5, 6, 6, 7, 8, 9, 9] },
  { label: "web", values: [3, 3, 4, 5, 5, 6, 6, 7] },
  { label: "jobs", values: [2, 2, 2, 3, 3, 3, 4, 4] },
];

export function ThemingDemo() {
  const [accent, setAccent] = useState<string>(ACCENTS[0].hex);
  const [preset, setPreset] = useState<ThemePreset>("modern");
  const { resolvedTheme } = useTheme();
  // resolvedTheme is already "dark" during hydration on a dark client, but the
  // server rendered light vars — gate the dark twins on mounted or the style
  // attribute mismatches (a real hydration error we hit).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const inkCats = INK_PRESET_CATS[preset];
  const inkPreset = inkCats !== undefined;
  const theme = useMemo(() => {
    if (inkCats) return defineTheme({ extends: preset, cat: inkCats }); // preset owns every ink
    return defineTheme(preset === "modern" ? { accent } : { extends: preset, accent });
  }, [accent, preset, inkCats]);
  const vars = mounted && resolvedTheme === "dark" ? theme.darkVars : theme.vars;

  return (
    <div className="panel-soft overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-hairline px-5 py-3.5">
        <code className="font-mono text-[0.8rem] text-fd-foreground">
          defineTheme({"{"}{" "}
          {inkPreset ? (
            <>
              extends: <span className="text-fd-primary">&quot;{preset}&quot;</span>, cat: [
              <span className="text-fd-primary">{inkCats?.map((c) => `"${c}"`).join(", ")}</span>]
            </>
          ) : (
            <>
              accent: <span className="text-fd-primary">&quot;{accent}&quot;</span>
              {preset !== "modern" ? (
                <>
                  , extends: <span className="text-fd-primary">&quot;{preset}&quot;</span>
                </>
              ) : null}
            </>
          )}{" "}
          {"}"})
        </code>
        <div className="flex gap-1.5" role="group" aria-label="Accent color">
          {ACCENTS.map((a) => (
            <button
              key={a.name}
              type="button"
              aria-label={`Accent ${a.name}`}
              aria-pressed={!inkPreset && accent === a.hex}
              aria-disabled={inkPreset}
              title={inkPreset ? `${preset} uses fixed inks, so accent doesn't apply` : a.name}
              onClick={() => {
                if (inkPreset) return;
                setAccent(a.hex);
              }}
              className={`ghost-ctrl size-8 shrink-0 transition-opacity ${inkPreset ? "opacity-35" : ""}`}
            >
              <span
                aria-hidden
                className={`block size-4 rounded-full transition-shadow ${
                  !inkPreset && accent === a.hex ? "ring-2 ring-offset-2 ring-offset-fd-card" : ""
                }`}
                style={{ background: a.hex, "--tw-ring-color": a.hex } as React.CSSProperties}
              />
            </button>
          ))}
        </div>
      </div>

      <div
        style={vars as React.CSSProperties}
        className="hv-theme-stage grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2"
      >
        <figure className="flex flex-col gap-1.5">
          <figcaption className="mono-label opacity-55">accent takes the emphasis ink</figcaption>
          <Sparkline
            data={REVENUE}
            curve="smooth"
            color="var(--mc-accent)"
            width={220}
            height={40}
            summary={false}
          />
        </figure>
        <figure className="flex flex-col gap-1.5">
          <figcaption className="mono-label opacity-55">categories derive from it</figcaption>
          <SegmentedBar data={MIX} width={220} height={16} summary={false} />
        </figure>
        <figure className="flex flex-col gap-1.5">
          <figcaption className="mono-label opacity-55">layers stay harmonized</figcaption>
          <StackedArea data={AREAS} width={220} height={40} summary={false} />
        </figure>
        <figure className="flex flex-col gap-1.5">
          <figcaption className="mono-label opacity-55">
            good and bad never move <Delta value={0.12} summary={false} />{" "}
            <Delta value={-0.08} summary={false} />
          </figcaption>
          <Bullet value={72} target={80} bands={[50, 90]} width={220} height={16} summary={false} />
        </figure>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline px-5 py-3.5">
        <span className="mono-label mr-2">presets</span>
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={preset === p}
            onClick={() => setPreset(p)}
            className={`rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.1em] transition-colors active:scale-95 ${
              preset === p
                ? "border-fd-primary/50 bg-fd-primary/10 text-fd-primary"
                : "border-hairline text-fd-muted-foreground hover:text-fd-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
