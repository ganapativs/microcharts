"use client";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Client island for the chart chooser: the decision-question chips and which
 *  server-rendered sections are shown. The section bodies (with their per-chart
 *  glyphs) arrive pre-rendered from the server, so no chart component graph
 *  ships to the client. */
export interface ChooserSection {
  id: string;
  q: string;
  body: ReactNode;
}

export function ChooserFilter({ sections }: { sections: ChooserSection[] }) {
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? sections.filter((s) => s.id === active) : sections;

  return (
    <div className="not-prose my-8">
      <div className="mb-8 flex flex-wrap gap-2">
        <Chip label="All charts" activeState={active === null} onClick={() => setActive(null)} />
        {sections.map((s) => (
          <Chip
            key={s.id}
            label={s.q}
            activeState={active === s.id}
            onClick={() => setActive((a) => (a === s.id ? null : s.id))}
          />
        ))}
      </div>

      <div className="flex flex-col gap-10">
        {shown.map((s) => (
          <div key={s.id}>{s.body}</div>
        ))}
      </div>
    </div>
  );
}

function Chip({
  label,
  activeState,
  onClick,
}: {
  label: string;
  activeState: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={activeState}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        activeState
          ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
          : "border-hairline text-fd-muted-foreground hover:border-fd-primary/30 hover:text-fd-foreground",
      )}
    >
      {label}
    </button>
  );
}
