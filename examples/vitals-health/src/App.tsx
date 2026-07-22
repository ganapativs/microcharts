import { useState } from "react";
import { TodayView } from "./components/TodayView";
import { SleepView } from "./components/SleepView";
import { MoveView } from "./components/MoveView";
import { TrendsView } from "./components/TrendsView";

type Tab = "today" | "sleep" | "move" | "trends";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "sleep", label: "Sleep" },
  { id: "move", label: "Move" },
  { id: "trends", label: "Trends" },
];

export function App() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          {/* a small rising sun — gentle momentum, not a clinical logo */}
          <svg className="brand__mark" viewBox="0 0 34 26" fill="none" aria-hidden="true">
            <path
              className="sun"
              d="M8 20 A9 9 0 0 1 26 20"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <line
              className="horizon"
              x1="2"
              y1="20"
              x2="32"
              y2="20"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <line
              className="ray"
              x1="17"
              y1="3"
              x2="17"
              y2="7.5"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <line
              className="ray"
              x1="5.5"
              y1="8"
              x2="8.5"
              y2="10.5"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <line
              className="ray"
              x1="28.5"
              y1="8"
              x2="25.5"
              y2="10.5"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <span className="brand__word">
            <span className="brand__name">Vitals</span>
            <span className="brand__tag">your day, gently measured</span>
          </span>
        </div>

        <div className="dateline">
          <span className="dateline__greet">Good morning, Mara.</span>
          <time className="dateline__date" dateTime="2026-07-15">
            Wednesday, July 15
          </time>
        </div>
      </header>

      <nav className="tabs" aria-label="Views">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab${tab === t.id ? " tab--on" : ""}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content" key={tab}>
        {tab === "today" && <TodayView />}
        {tab === "sleep" && <SleepView />}
        {tab === "move" && <MoveView />}
        {tab === "trends" && <TrendsView />}
      </main>

      <footer className="foot">
        <span className="foot__name">Vitals</span>
        <span className="foot__credit">
          Charts rendered by <code>@microcharts/react</code>
        </span>
      </footer>
    </div>
  );
}
