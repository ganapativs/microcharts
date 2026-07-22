import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@microcharts/react/styles.css";
import "@microcharts/react/motion";
import "./app.css";
import "./analytics";
import { MicroProvider } from "@microcharts/react";
import { App } from "./App";
import { atlasTheme } from "./theme";

function usePrefersDark(): boolean {
  const [dark, setDark] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}

function Root() {
  const dark = usePrefersDark();
  return (
    <MicroProvider style={dark ? atlasTheme.darkVars : atlasTheme.vars}>
      <App />
    </MicroProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
