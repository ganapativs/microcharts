/**
 * Playground a11y probe — reads the rendered DOM (never re-derives announcements).
 */

export type NamingMode = "aria-label" | "aria-labelledby" | "none";

export interface A11ySnapshot {
  role: string | null;
  name: string;
  naming: NamingMode;
  title: string | null;
  desc: string | null;
  /** `summary={false}` ⇒ decorative / aria-hidden. */
  hidden: boolean;
  focusable: boolean;
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
 * First `role="img"` wins. Interactive: the wrapper (inner composed svg is
 * `aria-hidden` via `summary={false}`). Static: the `<svg>` itself.
 */
export function readA11y(root: ParentNode | null): A11ySnapshot {
  if (!root) return EMPTY_SNAPSHOT;
  const live = text(root.querySelector("[aria-live]")) ?? "";
  const el = root.querySelector('[role="img"]');
  if (!el) {
    // Static `summary={false}` ⇒ only an aria-hidden svg/span.
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

export interface Announcement {
  id: number;
  text: string;
}

/** Append non-empty live-region text; empties are clears (not utterances). Repeats kept. */
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

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export type SpeechStatus =
  | { kind: "off" }
  | { kind: "starting" }
  | { kind: "speaking" }
  | { kind: "done" }
  | { kind: "error"; detail: string };

export const voiceCount = (): number =>
  canSpeak() ? window.speechSynthesis.getVoices().length : 0;

export const isSpeaking = (): boolean =>
  canSpeak() && (window.speechSynthesis.speaking || window.speechSynthesis.pending);

/** Chrome loads voices async — first getVoices() can be `[]` and drop the utterance. */
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
 * Interrupt-and-speak (don't queue — scrubbing would lag). Quirks:
 * - Chromium: cancel()+speak() same task → silent; delay replacement one tick.
 * - Safari: speech must start inside a user gesture (no setTimeout hop when idle).
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
        // Interrupt/cancel from our own stop — expected.
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
