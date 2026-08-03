/**
 * Per-chart "how you drive it" sentence — one source for React (`interaction-note.tsx`)
 * and Markdown mirrors (`md-transform` → `/llms-full.txt`). Kind comes from registry
 * fields; full contract lives at /docs/accessibility#one-interaction-contract.
 */

export type InteractionKind = "picker" | "single" | "none";

export interface InteractionEntryLike {
  slug: string;
  interactiveImport?: string;
  picker?: false;
  readout?: false;
}

/** Opt out of generated wording — pages document their own behavior. */
const CONTRACT_EXCEPTIONS = new Set(["minimap-strip", "token-confidence"]);

export function interactionKind(entry: InteractionEntryLike): InteractionKind {
  if (!entry.interactiveImport) return "none";
  if (CONTRACT_EXCEPTIONS.has(entry.slug)) return "none";
  return entry.picker === false ? "single" : "picker";
}

const CONTRACT_HREF = "/docs/accessibility#one-interaction-contract";

/** Appended to single-unit notes when the chart paints a readout chip on hover/focus. */
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

export function interactionNote(entry: InteractionEntryLike): string | null {
  const kind = interactionKind(entry);
  if (kind === "none") return null;
  // Picker charts always carry a chip (library-side gate), and their sentence
  // already says the readout pins — only the scalar half needs the clause.
  if (kind === "picker" || entry.readout === false) return INTERACTION_NOTES[kind];
  return `${INTERACTION_NOTES[kind]}\n${REVEAL_NOTE}`;
}
