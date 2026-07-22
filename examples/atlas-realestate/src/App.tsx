import { useEffect, useState } from "react";
import { MarketView } from "./components/MarketView";
import { ListingsView } from "./components/ListingsView";
import { CompareView } from "./components/CompareView";

type Tab = "market" | "listings" | "compare";

const TABS: { id: Tab; label: string }[] = [
  { id: "market", label: "Market" },
  { id: "listings", label: "Listings" },
  { id: "compare", label: "Compare" },
];

/** Reveal `.reveal` blocks as they scroll in. Re-scans whenever the view changes. */
function useReveal(key: string) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.in)"));
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
}

export function App() {
  const [tab, setTab] = useState<Tab>("market");
  useReveal(tab);

  return (
    <div className="atlas">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Atlas home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
              <path
                d="M4 20 L12 4 L20 20"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d="M8 20 L12 12 L16 20"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="0.5"
              />
            </svg>
          </span>
          <span className="brand-word">
            <b>Atlas</b>
            <small>Market Intelligence</small>
          </span>
        </a>
        <nav className="tabs" aria-label="Views">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="tab"
              aria-current={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="topbar-spacer" />
        <label className="search">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span>Search neighborhoods, MLS #…</span>
          <kbd>/</kbd>
        </label>
        <div className="avatar" aria-hidden="true">
          AV
        </div>
      </header>

      <main key={tab} className="view-swap">
        {tab === "market" && <MarketView />}
        {tab === "listings" && <ListingsView />}
        {tab === "compare" && <CompareView />}
      </main>
    </div>
  );
}
