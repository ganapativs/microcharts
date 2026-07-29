"use client";
// oxlint-disable react/no-array-index-key -- segment order is append-only while
// a reply streams, so the index is the stable identity; a content-derived key
// would remount every already-rendered chart on each chunk.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { RugStrip } from "@microcharts/react/rug-strip/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { TrendArrow } from "@microcharts/react/trend-arrow/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { StatusDot } from "@microcharts/react/status-dot/interactive";
import { MiniBar } from "@microcharts/react/mini-bar/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { Seismogram } from "@microcharts/react/seismogram/interactive";
import { LIVE_SAMPLES, parseLiveReply, speakLiveReply, type ChartSpec } from "@/lib/live-grammar";
import type { useLiveModel } from "@/components/charts/use-live-model";

/**
 * The on-device tab: Chrome's Gemini Nano writes the reply, and the grammar
 * parser turns what it writes into shipped components.
 *
 * These are the INTERACTIVE entries, unlike the scripted tabs. A scripted reply
 * is a recording and its marks are decoration (`summary={false}`); this one is
 * real content the reader asked for, so every mark scrubs, announces its own
 * value, and keeps the summary a screen reader is handed.
 *
 * Only a validated `ChartSpec` reaches the renderer — a malformed chart stays
 * visible as the literal text the model wrote, which is the honest failure mode
 * for a page whose claim is that the grammar is easy to emit.
 */

type Live = ReturnType<typeof useLiveModel>;

/** Block charts fill their container (the interactive entries set width:100%),
 *  so a standalone mark needs a box to fill. */
const BLOCK_W = 240;

/** Accent-tint the neutral marks; valence marks keep their own colour. */
const ACCENT = "var(--mc-accent)";

function renderSpec(spec: ChartSpec, block: boolean): ReactNode {
  switch (spec.type) {
    case "sparkline":
      return (
        <Sparkline
          data={spec.values}
          curve="smooth"
          width={block ? BLOCK_W : 54}
          height={block ? 44 : 15}
          dots={block ? "minmax" : undefined}
          color={ACCENT}
        />
      );
    case "sparkbar":
      return (
        <SparkBar
          data={spec.values}
          width={block ? BLOCK_W : 46}
          height={block ? 44 : 15}
          color={ACCENT}
        />
      );
    case "rug-strip":
      return (
        <RugStrip
          data={spec.values}
          width={block ? BLOCK_W : 56}
          height={block ? 20 : 12}
          color={ACCENT}
        />
      );
    case "delta":
      return <Delta value={spec.value} />;
    case "trend-arrow":
      return <TrendArrow value={spec.value} />;
    case "bullet":
      return (
        <Bullet
          value={spec.value}
          target={spec.target}
          bands={spec.bands}
          width={block ? BLOCK_W : 58}
          height={block ? 26 : 11}
        />
      );
    case "status-dot":
      return <StatusDot status={spec.status} style={{ width: 11, height: 11 }} />;
    case "mini-bar":
      return (
        <MiniBar
          title={spec.title}
          data={spec.items}
          width={BLOCK_W}
          height={Math.max(28, spec.items.length * 11)}
          color={ACCENT}
        />
      );
    case "segmented":
      return <SegmentedBar title={spec.title} data={spec.items} width={BLOCK_W} height={16} />;
    case "histogram":
      return (
        <HistogramStrip
          title={spec.title}
          data={spec.values}
          width={BLOCK_W}
          height={44}
          color={ACCENT}
        />
      );
    case "seismogram":
      return (
        <Seismogram
          title={spec.title}
          data={spec.values}
          width={BLOCK_W}
          height={44}
          color={ACCENT}
        />
      );
  }
}

const RAW_CODE = "font-mono text-[0.82em] text-fd-muted-foreground";

function LiveReply({ text }: { text: string }) {
  const segs = parseLiveReply(text);
  return (
    <div className="max-w-xl whitespace-pre-wrap text-[0.98rem] leading-relaxed text-fd-foreground/85">
      {segs.map((s, i) => {
        if (s.kind === "text") return <span key={i}>{s.text}</span>;
        if (s.kind === "code")
          return (
            <code key={i} className={RAW_CODE}>
              {s.text}
            </code>
          );
        if (!s.complete || !s.spec)
          return (
            <code key={i} className={`${RAW_CODE} ${s.block ? "my-1 block" : ""}`}>
              {s.raw}
            </code>
          );
        if (s.block)
          return (
            <span key={i} className="mc-stream-chart my-2 flex justify-start whitespace-normal">
              <figure className="not-prose flex flex-col gap-1.5" style={{ width: BLOCK_W }}>
                {s.spec.type === "mini-bar" ||
                s.spec.type === "segmented" ||
                s.spec.type === "histogram" ||
                s.spec.type === "seismogram" ? (
                  <figcaption className="mono-label opacity-55">{s.spec.title}</figcaption>
                ) : null}
                {renderSpec(s.spec, true)}
              </figure>
            </span>
          );
        // `.mc-inline` seats an SVG mark on the text baseline. Delta and
        // TrendArrow are text metrics that own their own baseline, so they take
        // the optical lift twice and ride high — the same rule /docs/ai states.
        const bare = s.spec.type === "delta" || s.spec.type === "trend-arrow";
        return (
          <span key={i} className={bare ? "mx-1" : "mc-inline mc-morph"}>
            {renderSpec(s.spec, false)}
          </span>
        );
      })}
    </div>
  );
}

export function LiveTab({ live }: { live: Live }) {
  const [asked, setAsked] = useState("");
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);

  // Keep the newest line in view while streaming, unless the reader scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && followRef.current) el.scrollTop = el.scrollHeight;
  }, [live.text]);

  // Announce the finished reply as prose (charts flattened to their summaries),
  // once, rather than spamming the live region on every chunk.
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    if (live.phase === "thinking") setAnnounce("Generating a report…");
    else if (live.phase === "done") setAnnounce(speakLiveReply(live.text));
    else if (live.phase === "error") setAnnounce("The on-device model didn’t answer. Ask again.");
    else setAnnounce("");
    // live.text is final by the time phase settles; keying on it would announce
    // every chunk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.phase]);

  const submit = (q: string) => {
    const question = q.trim();
    if (!question || live.phase === "thinking") return;
    followRef.current = true;
    setAsked(question);
    setQuery("");
    void live.ask(question);
  };

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        // Roughly double the scripted tabs' reply box. A live reply runs longer
        // than a scripted one and the charts inside it are full-size, so at the
        // old height the answer was reading through a letterbox — three lines of
        // prose and a fenced chart filled it and everything after scrolled.
        className="grid-paper max-h-[46rem] min-h-[28rem] overflow-y-auto overscroll-contain px-5 py-6"
      >
        {asked === "" ? (
          <p className="max-w-xl text-[0.98rem] leading-relaxed text-fd-muted-foreground">
            Chrome&rsquo;s on-device model is available here. Ask it for a small report and it will
            write one in the same grammar — the charts below the answer are the shipped components,
            not a picture of them.
          </p>
        ) : (
          <>
            <p className="mb-2.5 text-[0.85em] text-fd-muted-foreground">
              <span className="mono-label mr-1.5 opacity-70">you</span>
              {asked}
            </p>
            {live.phase === "error" ? (
              <p className="text-fd-muted-foreground">
                The on-device model didn&rsquo;t answer this time. Ask again, or pick one of the
                scripted examples above.
              </p>
            ) : live.text === "" ? (
              // Nano can think for a few seconds before the first token, and an
              // empty box under the question reads as nothing having happened.
              // The live region already announces this, so the visible copy is
              // decoration and stays out of the accessibility tree.
              <p aria-hidden className="mono-label flex items-center gap-2">
                <span className="live-dot" />
                thinking
              </p>
            ) : (
              <LiveReply text={live.text} />
            )}
          </>
        )}
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>

      <div className="border-t border-hairline px-4 pb-3.5 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {LIVE_SAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              onMouseEnter={live.warm}
              onFocus={live.warm}
              className="rounded-full border border-hairline px-2.5 py-1 text-[0.72rem] leading-none text-fd-muted-foreground transition-colors hover:border-fd-primary/45 hover:text-fd-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="mt-2.5 flex items-center gap-2 rounded-full border border-hairline bg-fd-card py-1 pl-4 pr-1.5 transition-colors focus-within:border-fd-primary/60"
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={live.warm}
            maxLength={140}
            placeholder="ask for a tiny report of your own…"
            aria-label="Ask the on-device model for a report"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground/60"
          />
          <button
            type="submit"
            aria-label="Ask"
            title="Ask"
            disabled={!query.trim() || live.phase === "thinking"}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground transition-transform hover:-translate-y-px disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </form>
        <p className="mono-label mt-2 opacity-50">
          live · Gemini Nano in your Chrome · numbers are illustrative
        </p>
      </div>
    </>
  );
}
