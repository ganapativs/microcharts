import { useMemo, useState } from "react";
import { StatusDot } from "@microcharts/react/status-dot/interactive";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { services, mttrTrend, type Health } from "./data";
import { ServicesView } from "./components/ServicesView";
import { SlosView } from "./components/SlosView";
import { IncidentsView } from "./components/IncidentsView";
import { FleetView } from "./components/FleetView";

type Tab = "services" | "slos" | "incidents" | "fleet";
type Scrub = { index: number; value: number | null; formatted?: string } | null;

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "services", label: "Services", hint: "8 online" },
  { id: "slos", label: "SLOs", hint: "6 objectives" },
  { id: "incidents", label: "Incidents", hint: "28 · 20wk" },
  { id: "fleet", label: "Fleet", hint: "7 nodes" },
];

export function App() {
  const [tab, setTab] = useState<Tab>("services");
  const [pulse, setPulse] = useState<Scrub>(null);

  const hc = useMemo(
    () =>
      services.reduce((a, s) => ((a[s.status] += 1), a), { ok: 0, warn: 0, error: 0 } as Record<
        Health,
        number
      >),
    [],
  );
  const fleetPulse = useMemo(() => {
    const n = services[0].latency.length;
    return Array.from({ length: n }, (_, i) => {
      const sum = services.reduce((a, s) => a + s.latency[i], 0);
      return Math.round(sum / services.length);
    });
  }, []);

  const p95 = pulse?.formatted ?? `${fleetPulse[fleetPulse.length - 1]}`;

  return (
    <div className="shipyard">
      <header className="masthead">
        <div className="masthead-rail">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              ◇
            </span>
            <span className="brand-name">SHIPYARD</span>
            <span className="brand-sub">service-health console</span>
          </div>
          <div className="rail-readout">
            <div className="tally" role="group" aria-label="Service health tally">
              <span className="tally-item ok">
                <StatusDot status="ok" summary={false} />
                <b>{hc.ok}</b>
                <i>ok</i>
              </span>
              <span className="tally-item warn">
                <StatusDot status="warn" summary={false} />
                <b>{hc.warn}</b>
                <i>warn</i>
              </span>
              <span className="tally-item error">
                <StatusDot status="error" pulse summary={false} />
                <b>{hc.error}</b>
                <i>err</i>
              </span>
            </div>
            <span className="coord">
              <span className="live-dot" aria-hidden="true" />
              us-east-1<span className="coord-sep">/</span>14:08 UTC
            </span>
          </div>
        </div>

        <div className="scope">
          <div className="scope-chan">
            <span className="chan-name">Fleet p95</span>
            <span className="chan-unit">last 60 min · mean of 8 services</span>
          </div>
          <div className="scope-trace">
            <Sparkline
              data={fleetPulse}
              width={700}
              height={48}
              fill
              animate
              readout={false}
              onActive={setPulse}
              summary="Fleet-wide p95 latency, last 60 minutes"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
          <div className="scope-readout">
            <span className="readout-v num">
              {p95}
              <i>ms</i>
            </span>
            <span className="readout-k">
              mttr <b className="good">{mttrTrend[mttrTrend.length - 1]}m</b> · 24 inc
            </span>
          </div>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Console sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={"tab" + (tab === t.id ? " is-active" : "")}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-label">{t.label}</span>
            <span className="tab-hint">{t.hint}</span>
          </button>
        ))}
      </nav>

      <main className="view" key={tab}>
        {tab === "services" && <ServicesView />}
        {tab === "slos" && <SlosView />}
        {tab === "incidents" && <IncidentsView />}
        {tab === "fleet" && <FleetView />}
      </main>

      <footer className="footer">
        <span>@microcharts/react · mono preset · zero runtime deps</span>
        <span>p95 windows: last 60m · budgets: 30d rolling</span>
      </footer>
    </div>
  );
}
