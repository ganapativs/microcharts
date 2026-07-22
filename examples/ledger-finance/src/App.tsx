import { useEffect, useState } from "react";
import { Portfolio } from "./components/Portfolio";
import { Markets } from "./components/Markets";
import { Asset } from "./components/Asset";
import { Analytics } from "./components/Analytics";

type Tab = "portfolio" | "markets" | "asset" | "analytics";

const TABS: { id: Tab; label: string }[] = [
  { id: "portfolio", label: "Portfolio" },
  { id: "markets", label: "Markets" },
  { id: "asset", label: "NVDA" },
  { id: "analytics", label: "Analytics" },
];

/** A precise ledger mark: a hairline rule with a rising close — an OHLC in miniature. */
function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 22 24" fill="none" aria-hidden="true">
      <line x1="1" y1="20.5" x2="21" y2="20.5" stroke="currentColor" strokeWidth="1.4" />
      <line x1="4.5" y1="20.5" x2="4.5" y2="13" stroke="currentColor" strokeWidth="1.4" />
      <line x1="10.5" y1="20.5" x2="10.5" y2="8" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.7" y="8" width="3.6" height="6.5" fill="currentColor" />
      <line x1="16.5" y1="20.5" x2="16.5" y2="3" stroke="currentColor" strokeWidth="1.4" />
      <rect x="14.7" y="3" width="3.6" height="9" fill="currentColor" />
    </svg>
  );
}

/** UTC session clock — the one live readout in the chrome. */
function SessionClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  return (
    <span className="session-clock" aria-label="Session time, coordinated universal">
      <b>
        {hh}:{mm}
      </b>
      :{ss}
      <span>UTC</span>
    </span>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>("portfolio");

  return (
    <div className="ledger">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#" aria-label="Ledger Terminal">
            <BrandMark />
            <span className="brand-name">Ledger</span>
            <span className="brand-tag">Terminal</span>
          </a>

          <nav className="tabs" role="tablist" aria-label="Views">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className="tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="session">
            <span className="session-status">
              <span className="live-dot" aria-hidden="true" />
              Night session
            </span>
            <SessionClock />
          </div>
        </div>
      </header>

      <div className="wrap">
        {tab === "portfolio" && <Portfolio />}
        {tab === "markets" && <Markets />}
        {tab === "asset" && <Asset />}
        {tab === "analytics" && <Analytics />}

        <footer className="foot">
          <span>Ledger Terminal · a microcharts instrument. Figures are simulated.</span>
          <a href="https://microcharts.dev" rel="noreferrer">
            @microcharts/react
          </a>
        </footer>
      </div>
    </div>
  );
}
