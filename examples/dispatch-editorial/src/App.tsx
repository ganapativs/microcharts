import { useState } from "react";
import { Masthead, type View } from "./components/Masthead";
import { Feature } from "./components/Feature";
import { Overnight } from "./components/Overnight";
import { Almanac } from "./components/Almanac";
import { ChartsIndex } from "./components/ChartsIndex";
import { SiteFooter } from "./components/SiteFooter";

export function App() {
  const [view, setView] = useState<View>("feature");

  return (
    <div className="page">
      <Masthead view={view} onNavigate={setView} />
      {/* key forces a fresh mount per view so the entrance replays */}
      <main key={view} className="view">
        {view === "feature" && <Feature />}
        {view === "overnight" && <Overnight />}
        {view === "almanac" && <Almanac />}
        {view === "index" && <ChartsIndex />}
      </main>
      <SiteFooter />
    </div>
  );
}
