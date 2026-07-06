"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Fades + lifts page content on navigation. Keyed on the pathname so the
 * animation re-runs each route change. Gated on reduced-motion by CSS.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div key={path} className="route-fade">
      {children}
    </div>
  );
}
