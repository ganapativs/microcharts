export type View = "feature" | "overnight" | "almanac" | "index";

const SECTIONS: { id: View; label: string }[] = [
  { id: "feature", label: "The Feature" },
  { id: "overnight", label: "Cities" },
  { id: "almanac", label: "The Almanac" },
  { id: "index", label: "Specimen" },
];

export function Masthead({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  return (
    <header className="masthead">
      <div className="masthead__bar">
        <span className="masthead__issue">Vol. XIV · No. 6</span>
        <span className="masthead__ornament" aria-hidden="true">
          ✦ ✦ ✦
        </span>
        <span className="masthead__date">Sat, June 14, 2025 · Price 4¢</span>
      </div>
      <div className="masthead__nameplate">
        <h1 className="masthead__title">Dispatch</h1>
        <p className="masthead__tagline">
          Field notes on markets, climate, and the arithmetic between them
        </p>
      </div>
      <nav className="masthead__nav" aria-label="Sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={view === s.id ? "tab tab--active" : "tab"}
            aria-current={view === s.id ? "page" : undefined}
            onClick={() => onNavigate(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
