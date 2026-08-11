import type { ReactNode } from "react";

/** A visibly-constrained box so a "fills its container" recipe reads as fluid.
 *  No directive: rendered by the server Sizing wrapper for the pre-rendered
 *  HTML and by the client island for the live swap — same box either way. */
export function FluidFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      <div
        className="mx-auto rounded-md border border-dashed border-fd-border p-3"
        style={{ width: "100%", maxWidth: 320 }}
      >
        {children}
      </div>
    </div>
  );
}
