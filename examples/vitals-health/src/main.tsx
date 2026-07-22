import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@microcharts/react/styles.css";
import "@microcharts/react/motion";
import "./app.css";
import "./analytics";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
