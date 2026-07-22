"use client";

// Side-effect import of the motion engine so `animate` works on interactive
// charts. Mounted once in the root layout — keeps the Server Component pages
// free of any motion import.
import "@microcharts/react/motion";

export function MotionInit() {
  return null;
}
