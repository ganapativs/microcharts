/**
 * The one place the per-chart "how you drive it" sentence is written.
 *
 * 103 of the 106 charts share a single interaction contract, documented in full
 * at /docs/accessibility#one-interaction-contract. Rather than restate it — and
 * let it drift — in 106 hand-written `## Accessibility` sections, every chart
 * page renders `<InteractionNote slug="…" />`, which resolves to one of the
 * strings below from the registry entry itself.
 *
 * Registry-free and React-free on purpose: the React shell
 * (`components/charts/interaction-note.tsx`) and the Markdown mirrors
 * (`lib/md-transform.ts` → `public/docs/**.md`, `/llms-full.txt`) both read it,
 * so every surface says exactly the same thing.
 */

/** What kind of interaction the chart's `/interactive` entry actually offers. */
export type InteractionKind =
  /** The shared unit picker: roving focus + pinned selection. */
  | "picker"
  /** One unit — `onSelect` only, nothing to rove between, no pinned state. */
  | "single"
  /** No note: static-only, or a deliberate exception the page documents itself. */
  | "none";

/** The registry fields the note is derived from. */
export interface InteractionEntryLike {
  slug: string;
  /** Absent ⇒ static-only, so the chart must not claim any interaction. */
  interactiveImport?: string;
  /** `false` ⇒ no unit picker (the lean scalar set, plus the two exceptions). */
  picker?: false;
  /** `false` ⇒ the entry paints no readout chip (the value is already on the glyph). */
  readout?: false;
}

/**
 * The two charts that opt out of the picker for reasons other than being
 * scalar, so neither the picker nor the single-unit wording is true for them:
 * MinimapStrip is a viewport-window slider (`role="slider"`, `onWindowChange`),
 * and TokenConfidence moves *real* focus to per-token spans so a screen reader
 * reads the text in flow. Both pages already describe their own behavior, and
 * /docs/accessibility names them, so they get no generated sentence.
 */
const CONTRACT_EXCEPTIONS = new Set(["minimap-strip", "token-confidence"]);

export function interactionKind(entry: InteractionEntryLike): InteractionKind {
  if (!entry.interactiveImport) return "none"; // static-only (WindBarb)
  if (CONTRACT_EXCEPTIONS.has(entry.slug)) return "none";
  return entry.picker === false ? "single" : "picker";
}

const CONTRACT_HREF = "/docs/accessibility#one-interaction-contract";

/**
 * Markdown source for each note — inline links and code spans only. Wrapped at
 * the repo's 120-column prose width so the generated `.md` mirrors read like
 * the hand-written sections around them; HTML collapses the newlines away.
 */
/**
 * Appended to the single-unit sentence for every scalar that reveals its
 * reading on hover/focus — which is all of them except the handful whose glyph
 * already prints the number (`readout: false` in the registry).
 */
export const REVEAL_NOTE =
  "Hover or focus also reveals the reading itself in a floating chip, for the sizes and label modes where the mark\ndoes not print it; `readout={false}` drops the chip and keeps everything else.";

export const INTERACTION_NOTES: Record<Exclude<InteractionKind, "none">, string> = {
  picker: [
    `The interactive entry follows the shared [interaction contract](${CONTRACT_HREF}):`,
    "arrow keys rove between units on both axes, `Home` and `End` jump to the ends, and a click, tap, `Enter` or",
    "`Space` selects a unit — pinning its readout so it survives blur, until you select it again or press `Escape`.",
    "On touch, a tap pins and a drag scrubs.",
  ].join("\n"),
  single: [
    "This chart is a single unit, so there is nothing to rove between: a click, tap, `Enter` or `Space` selects it",
    "and fires `onSelect`, and no selection stays pinned. That is the scalar half of the shared",
    `[interaction contract](${CONTRACT_HREF}).`,
  ].join("\n"),
};

/** The note for one chart, or `null` when the chart gets no generated sentence. */
export function interactionNote(entry: InteractionEntryLike): string | null {
  const kind = interactionKind(entry);
  if (kind === "none") return null;
  // Picker charts always carry a chip (library-side gate), and their sentence
  // already says the readout pins — only the scalar half needs the clause.
  if (kind === "picker" || entry.readout === false) return INTERACTION_NOTES[kind];
  return `${INTERACTION_NOTES[kind]}\n${REVEAL_NOTE}`;
}
