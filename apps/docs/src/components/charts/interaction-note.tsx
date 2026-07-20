import Link from "next/link";
import type { ReactNode } from "react";
import { getChart } from "@/lib/catalog";
import { interactionNote } from "@/lib/charts/interaction-note";

/**
 * The shared "how you drive it" sentence at the end of a chart page's
 * `## Accessibility` section. The wording lives once in
 * `lib/charts/interaction-note.ts` and is chosen from the registry entry, so a
 * chart can never claim an interaction it doesn't have. Renders nothing for
 * static-only charts and for the two documented contract exceptions.
 */
export function InteractionNote({ slug }: { slug: string }) {
  const chart = getChart(slug);
  if (!chart) return null;
  const note = interactionNote(chart);
  if (!note) return null;
  return <p>{renderInline(note)}</p>;
}

/** Inline-Markdown for the note strings: `code` spans and [text](href) links. */
const INLINE = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;

function renderInline(md: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of md.matchAll(INLINE)) {
    const at = m.index;
    if (at > last) out.push(md.slice(last, at));
    if (m[1] !== undefined) {
      out.push(
        <code key={at} className="text-xs">
          {m[1]}
        </code>,
      );
    } else {
      out.push(
        <Link key={at} prefetch={false} href={m[3]!} className="underline">
          {m[2]}
        </Link>,
      );
    }
    last = at + m[0].length;
  }
  if (last < md.length) out.push(md.slice(last));
  // Elements carry their match offset as a key; plain strings need none.
  return out;
}
