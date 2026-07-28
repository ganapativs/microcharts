"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

/**
 * The chart-finder's front door: decision-phrased chips that answer "what's
 * your question?" and drive the gallery's own search. Each chip's query is a
 * substring that lives in the charts' `bestFor` entries (now indexed into the
 * card keywords), so clicking one filters to the marks that answer it.
 *
 * It stays a thin island over the existing search rather than a second filter:
 * it writes to the dock's search input the way a user would (native value
 * setter + an `input` event React hears), so all the existing filtering, URL
 * sync, and empty-state come along for free. Clicking the active chip clears.
 */

const QUESTIONS: readonly { label: string; q: string }[] = [
  { label: "Is it trending?", q: "trend" },
  { label: "Where does it rank?", q: "rank" },
  { label: "What's it made of?", q: "composition" },
  { label: "Progress to a goal?", q: "goal" },
  { label: "Is it in range?", q: "range" },
  { label: "How much did it change?", q: "change" },
  { label: "Compare two things?", q: "compar" },
  { label: "Show a distribution?", q: "distribution" },
];

const INPUT = '.g2-dock-search input[type="search"]';

function findInput(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(INPUT);
}

/**
 * Set a controlled React input the way a user would, so onChange fires.
 *
 * Nothing scrolls. An earlier version pulled the grid into view on every chip,
 * which was wrong twice: the reader is already looking at the row they clicked,
 * and once a query has cut the catalog to five cards the grid is shorter than
 * the viewport, so "scroll the grid to the top" threw the page at the footer.
 * Filtering is the whole response — the count in the dock and the cards under
 * the cursor both change where the reader is already looking.
 *
 * `preventScroll` for the same reason: focusing a control fixed to the bottom of
 * the viewport is not a request to move the document.
 */
function setSearch(value: string) {
  const input = findInput();
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  if (value) input.focus({ preventScroll: true });
}

export function ChartQuestions() {
  // Mirror the live search value so the matching chip reads as pressed, and
  // typing in the box (or landing via ?q=) lights the right chip too.
  const [active, setActive] = useState("");

  useEffect(() => {
    // The search input lives in the floating dock — a separate island that can
    // mount after this one. Listen on `document` (capture) instead of the node
    // so there's no mount-order race: every input event from the search box is
    // caught whenever the dock appears. The initial read reflects a `?q=` land.
    const onInput = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.matches(INPUT)) {
        setActive(t.value.trim().toLowerCase());
      }
    };
    document.addEventListener("input", onInput, true);
    // Initial reflect for a `?q=` landing: the dock renders its value without
    // firing an input event, and may mount a beat after this island — so poll
    // briefly until it's there, then stop.
    let tries = 0;
    let timer = 0;
    const seed = () => {
      const input = findInput();
      if (input) {
        setActive(input.value.trim().toLowerCase());
      } else if (tries++ < 20) {
        timer = window.setTimeout(seed, 50);
      }
    };
    seed();
    return () => {
      document.removeEventListener("input", onInput, true);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="kicker inline-flex items-center gap-1.5">
        <Search className="size-3" aria-hidden />
        Find by question
      </span>
      {QUESTIONS.map(({ label, q }) => {
        const on = active === q;
        return (
          <button
            key={q}
            type="button"
            aria-pressed={on}
            onClick={() => setSearch(on ? "" : q)}
            // Quieter than the collection row above it, so the primary filter
            // stays the louder one. State is never carried by colour alone: the
            // live query takes the ink AND grows the accent rule under it.
            className="q-chip"
          >
            {label}
            <span className="toggle-rule" data-state={on ? "on" : "off"} />
          </button>
        );
      })}
    </div>
  );
}
