"use client";
import { useRef } from "react";
import { useFooterMarkCanvas } from "@/components/use-footer-mark-canvas";

/** Footer canvas: living chart mosaic masked by the wordmark. */
export function FooterMark() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useFooterMarkCanvas(hostRef, canvasRef);

  return (
    <>
      {/* touch-pan-y: vertical drags still scroll the page, horizontal ones
          drive the torch instead of being stolen as a scroll gesture (which
          cancels the pointer stream and freezes the lens mid-field) */}
      <div
        ref={hostRef}
        className="display absolute inset-0 touch-pan-y select-none"
        role="img"
        aria-label="microcharts"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      </div>
      <div aria-hidden className="h-[200px]" />
    </>
  );
}
