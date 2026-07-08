"use client";
import { ErrorBudget as ErrorBudgetInteractive } from "@microcharts/react/error-budget/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import { DEMO, WINDOW } from "./error-budget";

export function InteractiveDemo() {
  // DEMO/WINDOW referenced inside the component — this module and its registry
  // parent import each other (temporal-dead-zone trap at build otherwise).
  return (
    <DemoPanel hint="Hover or arrow across the days — each announces the budget remaining and the current burn rate.">
      <ErrorBudgetInteractive
        data={DEMO}
        window={WINDOW}
        unit="day"
        label="remaining"
        title="Checkout SLO"
        width={280}
        height={30}
      />
    </DemoPanel>
  );
}
