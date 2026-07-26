"use client";
// The playground's screen-reader pane: what assistive tech is handed for the
// props currently on screen, read live out of the rendered DOM (see
// `a11y-probe.ts`) and optionally spoken aloud.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  EMPTY_SNAPSHOT,
  canSpeak,
  isSpeaking,
  pushAnnouncement,
  readA11y,
  speak,
  stopSpeaking,
  voiceCount,
  type A11ySnapshot,
  type Announcement,
  type SpeechStatus,
} from "./a11y-probe";

/**
 * Watch the chart inside `ref` and report its accessibility surface.
 *
 * One MutationObserver over the subtree catches everything that matters: the
 * live region's text (characterData + childList) and the wrapper's naming
 * attributes. `key` re-reads when the playground remounts the chart with new
 * props but no mutation follows (e.g. a knob that only changes the summary).
 */
function useA11yProbe(
  ref: React.RefObject<HTMLElement | null>,
  key: string,
): { snapshot: A11ySnapshot; log: Announcement[] } {
  const [snapshot, setSnapshot] = useState<A11ySnapshot>(EMPTY_SNAPSHOT);
  const [log, setLog] = useState<Announcement[]>([]);
  const idRef = useRef(0);
  // The region's last raw text, CLEARS INCLUDED. One mutation can fire several
  // records, and `"Point 3"` → `""` → `"Point 3"` is genuinely two utterances,
  // so the transition — not the text — decides what counts as new.
  const rawRef = useRef<string | null>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const sync = (): void => {
      const next = readA11y(host);
      setSnapshot(next);
      if (next.live === rawRef.current) return;
      rawRef.current = next.live;
      setLog((l) => pushAnnouncement(l, next.live, idRef.current++));
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(host, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "aria-labelledby", "aria-hidden", "role", "tabindex"],
    });
    return () => mo.disconnect();
  }, [ref, key]);

  // A remount (new props) starts a new reading — the old chart's announcements
  // aren't this chart's.
  useEffect(() => {
    rawRef.current = null;
    setLog([]);
  }, [key]);

  return { snapshot, log };
}

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "on" }) {
  return (
    <span
      className={cn(
        "rounded border px-1 py-px font-mono text-[0.5rem] uppercase leading-[1.4] tracking-wide",
        tone === "on"
          ? "border-fd-primary/30 bg-fd-primary/10 text-fd-primary"
          : "border-hairline text-fd-muted-foreground/70",
      )}
    >
      {children}
    </span>
  );
}

/**
 * What makes THIS chart speak.
 *
 * `rove` — a multi-unit picker: every unit you hover or arrow to is announced.
 *
 * `scalar` — one value, nothing to rove between. These entries announce on
 * CHANGE (the live region is fed by a value-changed effect, not by the pointer),
 * so pointing at them is silent by design and Shuffle is what makes them talk.
 *
 * `none` — no interactive entry, or no per-unit reading at all.
 */
export type AnnounceMode = "rove" | "scalar" | "none";

const WAITING: Record<AnnounceMode, string> = {
  rove: "Hover the chart, or focus it and use the arrow keys.",
  scalar:
    "One value — nothing to rove between. This chart announces when its value CHANGES, so hit Shuffle (or a knob) to hear it; click or Enter fires onSelect.",
  none: "No per-unit reading to announce — the name above is the whole reading.",
};

export function A11yPane({
  chartRef,
  probeKey,
  interactive,
  announce = "rove",
  hint,
  controls,
}: {
  chartRef: React.RefObject<HTMLElement | null>;
  /** Changes whenever the chart is remounted with different props. */
  probeKey: string;
  interactive: boolean;
  announce?: AnnounceMode;
  /** Per-chart affordance line, e.g. "focus it and walk points with ← →". */
  hint?: string;
  /** The naming knobs (`summary` / `title` / `id`) — they belong to this pane. */
  controls?: ReactNode;
}) {
  const { snapshot, log } = useA11yProbe(chartRef, probeKey);
  const [voice, setVoice] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>({ kind: "off" });
  // Keyed by utterance id, not text: re-entering the same point is a second
  // announcement, and a screen reader speaks it again.
  const spokenRef = useRef<number>(-1);
  const saidNameRef = useRef<string>("");

  const sayName = (name: string): void => {
    saidNameRef.current = name;
    speak(`${name}. Image.`, { onStatus: setStatus });
  };

  // Voice each new announcement. When nothing is speaking it goes out at once —
  // a reader who hovers one point must hear it immediately. When the engine is
  // already mid-sentence, wait for the stream to settle instead: a mouse scrub
  // fires one announcement per unit crossed, and voicing every one means each is
  // cut off ~40 ms in, so the reader hears a stutter and never a value.
  useEffect(() => {
    if (!voice) return;
    const head = log[0];
    if (!head || head.id === spokenRef.current) return;
    const say = (): void => {
      spokenRef.current = head.id;
      speak(head.text, { onStatus: setStatus });
    };
    if (!isSpeaking()) {
      say();
      return;
    }
    const t = setTimeout(say, 140);
    return () => clearTimeout(t);
  }, [voice, log]);

  // The name is re-spoken when the chart takes focus, and when a naming knob
  // changes what the name IS. Switching the voice on says it too — but from the
  // CLICK HANDLER, not here: Safari only starts speech inside a user gesture,
  // and a passive effect runs after that gesture has ended.
  useEffect(() => {
    if (!voice || !snapshot.name) return;
    const name = snapshot.name;
    if (saidNameRef.current && saidNameRef.current !== name) sayName(name);
    const host = chartRef.current;
    const onFocus = (): void => sayName(name);
    host?.addEventListener("focusin", onFocus);
    return () => host?.removeEventListener("focusin", onFocus);
  }, [chartRef, voice, snapshot.name]);

  useEffect(() => () => stopSpeaking(), []);

  // Side effects stay OUT of the updater — React double-invokes it in
  // StrictMode, which spoke the name twice.
  const toggleVoice = (): void => {
    if (voice) {
      stopSpeaking();
      setStatus({ kind: "off" });
      setVoice(false);
      return;
    }
    setVoice(true);
    if (snapshot.name) sayName(snapshot.name);
  };

  const speechNote =
    status.kind === "error"
      ? `speech blocked: ${status.detail}`
      : status.kind === "speaking"
        ? "speaking…"
        : status.kind === "starting"
          ? "queued…"
          : voiceCount() === 0
            ? "no voices installed"
            : null;

  const wiring = snapshot.hidden
    ? "aria-hidden"
    : snapshot.naming === "aria-labelledby"
      ? "<title> + <desc> · aria-labelledby"
      : snapshot.naming === "aria-label"
        ? "role=img · aria-label"
        : "—";

  return (
    <div>
      {controls && (
        <div className="flex flex-wrap items-start gap-x-6 gap-y-4 px-4 pb-1 pt-3">{controls}</div>
      )}
      <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-3">
        <span className="mono-label text-[0.55rem] opacity-70">what it announces</span>
        <div className="flex items-center gap-1.5">
          {snapshot.hidden ? (
            <Badge>decorative</Badge>
          ) : (
            <>
              {snapshot.role && <Badge>role=img</Badge>}
              {snapshot.focusable && <Badge>focusable</Badge>}
            </>
          )}
          {/* Speech fails silently in browsers more often than it should — no
              voices installed, an engine that refuses without a gesture, a muted
              output. Report what the engine said back, so "I hear nothing" is
              always answerable. */}
          {voice && speechNote && (
            <span
              className={cn(
                "font-mono text-[0.55rem]",
                status.kind === "error" ? "text-fd-primary" : "text-fd-muted-foreground/70",
              )}
            >
              {speechNote}
            </span>
          )}
          {canSpeak() && (
            <button
              type="button"
              onClick={toggleVoice}
              aria-pressed={voice}
              title={voice ? "Stop reading aloud" : "Read the chart aloud"}
              className={cn(
                "ghost-ctrl flex h-7 items-center gap-1.5 px-2 text-[0.68rem]",
                voice && "text-fd-primary",
              )}
            >
              {voice ? (
                <Volume2 className="size-3.5" aria-hidden />
              ) : (
                <VolumeX className="size-3.5" aria-hidden />
              )}
              {voice ? "Reading" : "Read aloud"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-3 px-4 pb-4 pt-1 sm:grid-cols-2">
        <div className="min-w-0">
          <span className="mono-label text-[0.55rem] opacity-70">accessible name</span>
          <p
            className={cn(
              "mt-1 text-[0.82rem] leading-snug",
              snapshot.hidden || !snapshot.name
                ? "italic text-fd-muted-foreground/70"
                : "text-fd-foreground",
            )}
          >
            {snapshot.hidden
              ? "Hidden from assistive tech — summary={false} marks the chart decorative, so a screen reader skips it entirely."
              : snapshot.name || "—"}
          </p>
          <p className="mt-1.5 font-mono text-[0.58rem] text-fd-muted-foreground/70">{wiring}</p>
        </div>

        <div className="min-w-0">
          <span className="mono-label text-[0.55rem] opacity-70">
            live region · aria-live=&quot;polite&quot;
          </span>
          {log.length === 0 ? (
            <p className="mt-1 text-[0.72rem] italic leading-snug text-fd-muted-foreground/60">
              {snapshot.hidden
                ? "Decorative charts announce nothing."
                : interactive
                  ? announce === "rove"
                    ? (hint ?? WAITING.rove)
                    : WAITING[announce]
                  : "Static charts have no live region — the name above is the whole reading. Switch to Interactive."}
            </p>
          ) : (
            <ol className="mt-1 flex flex-col gap-px">
              {log.map((a, i) => (
                <li
                  key={a.id}
                  className="truncate font-mono text-[0.62rem] leading-snug text-fd-foreground/80 tabular-nums"
                  style={{ opacity: Math.max(0.4, 1 - i * 0.15) }}
                >
                  {a.text}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
