"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Fades + lifts page content on navigation. Keyed on the pathname so the
 * animation re-runs each route change. Gated on reduced-motion by CSS.
 */
export function RouteTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const path = usePathname();
  return (
    <div key={path} className={className ? `route-fade ${className}` : "route-fade"}>
      {children}
    </div>
  );
}
