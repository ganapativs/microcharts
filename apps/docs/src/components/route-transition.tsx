"use client";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

/**
 * Fades + lifts page content on navigation. Keyed on the pathname so the
 * animation re-runs each route change. Gated on reduced-motion by CSS.
 *
 * The entry route never fades: on a cold load the fade would hold the whole
 * page at opacity 0 for its duration, pushing LCP out by that much for no gain
 * (there is nothing to transition *from*). The latch is monotonic, so coming
 * back to the entry path later still fades. Decided in render, not an effect —
 * adding the class after mount would restart the animation on painted content.
 */
export function RouteTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const path = usePathname();
  const entry = useRef(path);
  const navigated = useRef(false);
  if (path !== entry.current) navigated.current = true;

  const cls = [navigated.current && "route-fade", className].filter(Boolean).join(" ");
  return (
    <div key={path} className={cls || undefined}>
      {children}
    </div>
  );
}
