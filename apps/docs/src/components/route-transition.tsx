"use client";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

/**
 * Fades + lifts page content on navigation. Keyed so the animation re-runs
 * each route change — except within a surface that should feel continuous
 * (gallery hubs share one key so the floating dock never remounts).
 *
 * The entry route never fades: on a cold load the fade would hold the whole
 * page at opacity 0 for its duration, pushing LCP out by that much for no gain
 * (there is nothing to transition *from*). The latch is monotonic, so coming
 * back to the entry path later still fades. Decided in render, not an effect —
 * adding the class after mount would restart the animation on painted content.
 */
function transitionKey(path: string): string {
  if (path === "/charts" || path.startsWith("/charts/")) return "/charts";
  return path;
}

export function RouteTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const path = usePathname();
  const key = transitionKey(path);
  const entry = useRef(key);
  const navigated = useRef(false);
  if (key !== entry.current) navigated.current = true;

  const cls = [navigated.current && "route-fade", className].filter(Boolean).join(" ");
  return (
    <div key={key} className={cls || undefined}>
      {children}
    </div>
  );
}
