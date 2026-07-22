import { useState } from "react";
import { HeartbeatBlip } from "@microcharts/react/heartbeat-blip/interactive";
import { StatusDot } from "@microcharts/react/status-dot/interactive";
import { LiveView } from "./components/LiveView";
import { TranscriptsView } from "./components/TranscriptsView";
import { EvalsView } from "./components/EvalsView";
import { TracesView } from "./components/TracesView";
import * as d from "./data";

type Tab = "live" | "transcripts" | "evals" | "traces";

const TABS: { id: Tab; label: string; count?: string }[] = [
  { id: "live", label: "Live", count: "4" },
  { id: "transcripts", label: "Transcripts", count: "1.2k" },
  { id: "evals", label: "Evals", count: "312" },
  { id: "traces", label: "Traces", count: "9f2c" },
];

function BrandMark() {
  // A tiny constellation — nodes wired into a "cortex".
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
        <path
          d="M4 5 L9 3 L14 6 M4 5 L6 11 M9 3 L11 9 M14 6 L11 9 M6 11 L11 9 M6 11 L9 15 L11 9"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
        <circle cx="4" cy="5" r="1.5" fill="currentColor" />
        <circle cx="9" cy="3" r="1.5" fill="currentColor" />
        <circle cx="14" cy="6" r="1.5" fill="currentColor" />
        <circle cx="6" cy="11" r="1.5" fill="currentColor" />
        <circle cx="11" cy="9" r="1.8" fill="currentColor" />
        <circle cx="9" cy="15" r="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <div>
            <div className="brand-name">Cortex</div>
            <div className="brand-sub">
              eval &amp; observability <b>· prod</b>
            </div>
          </div>
        </div>

        <div className="topbar-spacer" />

        <div className="live-cluster">
          <span className="live-chip hide-sm" title="Requests, last 60s">
            <HeartbeatBlip
              events={d.headerPulse.events}
              now={d.headerPulse.now}
              window={d.headerPulse.window}
              width={72}
              height={22}
              summary={false}
            />
            <span className="num">142</span> rps
          </span>
          <span className="live-chip">
            <StatusDot status="ok" pulse />
            <span className="num">4</span>&nbsp;healthy
          </span>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Console sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count && <span className="tab-count num">{t.count}</span>}
          </button>
        ))}
      </nav>

      <main>
        <div className="container">
          {tab === "live" && <LiveView />}
          {tab === "transcripts" && <TranscriptsView />}
          {tab === "evals" && <EvalsView />}
          {tab === "traces" && <TracesView />}
        </div>
      </main>

      <footer className="foot">
        <span className="mono">cortex · eval &amp; observability instrument</span>
        <span className="mono">build r24.7 · us-east-2 · instrumented by microcharts</span>
      </footer>
    </div>
  );
}
