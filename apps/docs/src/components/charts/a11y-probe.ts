/**
 * The screen-reader probe behind the playground's accessibility pane.
 *
 * It never re-derives what a chart "would" announce — that would be a second
 * implementation free to drift from the library. It READS the rendered DOM:
 * the role, the accessible name (`aria-label`, or the resolved
 * `aria-labelledby` chain), `<title>`/`<desc>`, and the polite live region's
 * current text. What the pane shows is therefore exactly what assistive tech
 * gets, for whatever props the knobs are currently passing.
 */

/** How the accessible name is wired, verbatim from the DOM. */
export type NamingMode = "aria-label" | "aria-labelledby" | "none";

export interface A11ySnapshot {
  /** `"img"` — the library's only role — or `null` when nothing is exposed. */
  role: string | null;
  /** The composed accessible name a screen reader reads on arrival. */
  name: string;
  naming: NamingMode;
  /** `<title>` / `<desc>` text, when the chart renders them. */
  title: string | null;
  desc: string | null;
  /** `summary={false}` ⇒ decorative: hidden from assistive tech entirely. */
  hidden: boolean;
  /** The element is in the tab order (every interactive entry is). */
  focusable: boolean;
  /** Current polite live-region text; `""` = nothing pending. */
  live: string;
}

export const EMPTY_SNAPSHOT: A11ySnapshot = {
  role: null,
  name: "",
  naming: "none",
  title: null,
  desc: null,
  hidden: false,
  focusable: false,
  live: "",
};

const text = (el: Element | null): string | null => {
  const t = el?.textContent?.trim();
  return t ? t : null;
};

/** Resolve an `aria-labelledby` id list to its concatenated text. */
function resolveLabelledBy(root: ParentNode, ids: string): string {
  return ids
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => {
      const el =
        root.querySelector(`[id="${CSS.escape(id)}"]`) ??
        (root as Element).ownerDocument?.getElementById(id) ??
        null;
      return text(el) ?? "";
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Snapshot the accessibility surface of whatever chart is inside `root`.
 *
 * The exposed element is the FIRST `role="img"` in document order — for an
 * interactive entry that is the wrapper (the inner SVG is `aria-hidden`, since
 * the client entry composes the static one with `summary={false}`); for a
 * static entry it is the `<svg>` itself.
 */
export function readA11y(root: ParentNode | null): A11ySnapshot {
  if (!root) return EMPTY_SNAPSHOT;
  const live = text(root.querySelector("[aria-live]")) ?? "";
  const el = root.querySelector('[role="img"]');
  if (!el) {
    // No exposed element at all ⇒ `summary={false}` on a static chart, whose
    // only node is the `aria-hidden` svg.
    const decorative = root.querySelector('svg[aria-hidden="true"], span[aria-hidden="true"]');
    return { ...EMPTY_SNAPSHOT, hidden: !!decorative, live };
  }
  const labelledBy = el.getAttribute("aria-labelledby");
  const label = el.getAttribute("aria-label");
  const svg = el.tagName.toLowerCase() === "svg" ? el : el.querySelector("svg");
  return {
    role: "img",
    name: labelledBy ? resolveLabelledBy(root, labelledBy) : (label ?? ""),
    naming: labelledBy ? "aria-labelledby" : label ? "aria-label" : "none",
    title: text(svg?.querySelector(":scope > title") ?? null),
    desc: text(svg?.querySelector(":scope > desc") ?? null),
    hidden: false,
    focusable: el.getAttribute("tabindex") === "0",
    live,
  };
}

/** One thing the live region said, newest first in the log. */
export interface Announcement {
  id: number;
  text: string;
}

/**
 * Append `text` to the announcement log, newest first.
 *
 * Empty text is a CLEAR (the region is emptied on pointer-out), not something a
 * screen reader voices, so it returns the log unchanged — the identity tells
 * the caller nothing was said.
 *
 * Repeats are NOT filtered here. A live region that goes `"Point 3"` → `""` →
 * `"Point 3"` is two utterances: assistive tech speaks whatever lands in the
 * region, and re-entering the same point does announce again. De-duplicating
 * belongs at the source — the caller pushes only when the region's text
 * actually changed.
 */
export function pushAnnouncement(
  log: readonly Announcement[],
  value: string,
  id: number,
  cap = 6,
): Announcement[] {
  const t = value.trim();
  if (!t) return log as Announcement[];
  return [{ id, text: t }, ...log].slice(0, cap);
}

/* ── speech ──────────────────────────────────────────────────────────────── */

/** `true` when this browser can voice the readout at all. */
export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** What the speech engine is doing, reported back so silence is never a mystery. */
export type SpeechStatus =
  | { kind: "off" }
  | { kind: "starting" }
  | { kind: "speaking" }
  | { kind: "done" }
  | { kind: "error"; detail: string };

/** How many voices this browser has loaded — `0` means nothing can be spoken. */
export const voiceCount = (): number =>
  canSpeak() ? window.speechSynthesis.getVoices().length : 0;

/** `true` when the engine is mid-utterance right now. */
export const isSpeaking = (): boolean =>
  canSpeak() && (window.speechSynthesis.speaking || window.speechSynthesis.pending);

/**
 * Voices load ASYNCHRONOUSLY in Chrome: the first `getVoices()` after page load
 * returns `[]`, and an utterance queued in that window is silently dropped.
 * Resolve once they land (or give up after a second — some engines never fire
 * `voiceschanged` and speak fine regardless).
 */
function whenVoicesReady(run: () => void): void {
  const s = window.speechSynthesis;
  if (s.getVoices().length > 0) return run();
  let done = false;
  const go = (): void => {
    if (done) return;
    done = true;
    s.removeEventListener("voiceschanged", go);
    run();
  };
  s.addEventListener("voiceschanged", go);
  setTimeout(go, 1000);
}

/**
 * Voice one utterance, interrupting whatever is mid-sentence.
 *
 * Screen readers QUEUE polite announcements; scrubbing a chart with a mouse
 * produces one per point, so queueing here would leave the voice minutes behind
 * the pointer. Interrupting matches how the value actually reads back — and how
 * a screen-reader user meets it, arrowing one point at a time.
 *
 * Two engine quirks are handled here, both of which present as plain silence:
 *
 *  - `cancel()` + `speak()` in the SAME task is the long-standing Chromium
 *    silent-utterance bug. So a cancel is only issued when something is
 *    actually speaking, and the replacement is queued a tick later.
 *  - When nothing is speaking, the utterance goes out SYNCHRONOUSLY. Safari
 *    only starts speech from inside a user gesture, and a `setTimeout` hop
 *    leaves that gesture behind — which silently blocked the first utterance.
 */
export function speak(
  value: string,
  opts: { rate?: number; onStatus?: (s: SpeechStatus) => void } = {},
): void {
  if (!canSpeak()) return;
  const t = value.trim();
  if (!t) return;
  const { rate = 1.15, onStatus } = opts;
  const s = window.speechSynthesis;
  const fire = (): void => {
    whenVoicesReady(() => {
      if (s.paused) s.resume();
      const u = new SpeechSynthesisUtterance(t);
      u.rate = rate;
      u.addEventListener("start", () => onStatus?.({ kind: "speaking" }));
      u.addEventListener("end", () => onStatus?.({ kind: "done" }));
      u.addEventListener("error", (e) => {
        // An interrupt is this component cutting itself off — expected, not a fault.
        const detail = e.error ?? "unknown";
        onStatus?.(
          detail === "interrupted" || detail === "canceled"
            ? { kind: "done" }
            : { kind: "error", detail },
        );
      });
      s.speak(u);
    });
  };
  onStatus?.({ kind: "starting" });
  if (s.speaking || s.pending) {
    s.cancel();
    setTimeout(fire, 0);
  } else {
    fire();
  }
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}
