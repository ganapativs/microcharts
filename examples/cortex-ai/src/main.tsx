import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MicroProvider } from "@microcharts/react";
import { defineTheme } from "@microcharts/react/theme";
import "@microcharts/react/styles.css";
import "@microcharts/react/motion";
import "./app.css";
import "./analytics";
import { App } from "./App";

// Cortex brand: blueprint-cobalt accent, slightly heavier stroke.
// `dark: "auto"` derives a brighter twin for the near-black surface — picked
// at render time below so charts track the OS scheme, same as the rest of
// the CSS-var-driven dark mode in app.css.
const brand = defineTheme({ accent: "#3b6ea5", strokeWidth: 1.15, dark: "auto" });

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
    <MicroProvider style={dark ? brand.darkVars : brand.vars}>
      <App />
    </MicroProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
