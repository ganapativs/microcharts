"use client";
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

/** MutationObserver + `key` re-read when remount changes props without DOM mutation. */
function useA11yProbe(
  ref: React.RefObject<HTMLElement | null>,
  key: string,
): { snapshot: A11ySnapshot; log: Announcement[] } {
  const [snapshot, setSnapshot] = useState<A11ySnapshot>(EMPTY_SNAPSHOT);
  const [log, setLog] = useState<Announcement[]>([]);
  const idRef = useRef(0);
  // Last raw live text (clears included) — transition detects re-utterances.
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

  // Reset the probe when it is pointed at a different chart. Derived from `key`
  // rather than synced to it, so the pane never paints one frame of the previous
  // chart's log against the new target.
  const [probed, setProbed] = useState(key);
  if (probed !== key) {
    setProbed(key);
    setLog([]);
  }
  useEffect(() => {
    rawRef.current = null;
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

/** `rove` = per-unit; `scalar` = announce on value change; `none` = name only. */
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
  probeKey: string;
  interactive: boolean;
  announce?: AnnounceMode;
  hint?: string;
  controls?: ReactNode;
}) {
  const { snapshot, log } = useA11yProbe(chartRef, probeKey);
  const [voice, setVoice] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>({ kind: "off" });
  const spokenRef = useRef<number>(-1);
  const saidNameRef = useRef<string>("");

  const sayName = (name: string): void => {
    saidNameRef.current = name;
    speak(`${name}. Image.`, { onStatus: setStatus });
  };

  // Speak promptly when idle; debounce ~140ms while mid-utterance (scrub stutter).
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

  // Re-speak name on focus / rename. Voice-on speak is in the click handler (Safari gesture).
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

  // Don't speak inside setState updaters — StrictMode double-invoke.
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
