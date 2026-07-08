import type { ReactNode } from "react";

/**
 * Shared shell for a chart's interactive demo — header (with an optional
 * action control), grid-paper stage, and the interaction hint. Chart registry
 * modules compose this; the panel itself owns no per-chart knowledge.
 */
export function DemoPanel({
  hint,
  action,
  children,
}: {
  hint: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="panel not-prose my-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <span className="mono-label">Interactive</span>
        {action}
      </div>
      <div className="grid-paper flex min-h-40 items-center justify-center px-6 py-10">
        {children}
      </div>
      <div className="border-t border-hairline px-4 py-2.5 text-sm text-fd-muted-foreground">
        {hint}
      </div>
    </div>
  );
}
