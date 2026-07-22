import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MicroProvider } from "@microcharts/react";
import "@microcharts/react/styles.css";
import "@microcharts/react/motion";
import "./app.css";
import "./analytics";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MicroProvider theme="dark">
      <App />
    </MicroProvider>
  </StrictMode>,
);
