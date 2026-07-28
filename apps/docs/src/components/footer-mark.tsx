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
        className="wordmark-face absolute inset-0 touch-pan-y select-none"
        role="img"
        aria-label="microcharts"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      </div>
      {/* The reserved band under the links. It is the only thing that sets the
          footer's height, so growing it moves the link grid up and the legal bar
          down relative to the wordmark, and the canvas (inset-0) stretches with
          it for free.

          200 → 240 → 268 → 295 → 325 → 354. Growing THIS is how air is added above the
          word and nowhere else: the word is anchored off the footer's BOTTOM edge
          (`WORD_FLOOR`), so the space under it is fixed and every pixel added here
          lands between the link grid and the wordmark. The air above works out as
          `spacer - 265` — 295 gave 30px, 325 gave 60, 354 gives 89. Padding the link
          grid instead does nothing: it moves the grid and the word down together.

          The LAST step is the exception and does not follow that rule: 325 → 354 went
          in together with `WORD_FLOOR` 169 → 198, and the two cancel. The word stays
          exactly where it was, the footer gets ~5% taller, and all 29px land UNDER the
          word — it was sitting low in its own field. Measured at 1440: 101px of air
          above the word, 105 below before, 134 after.

          259 under `sm`, paired with `WORD_FLOOR_NARROW`: both airs cut ~30% for a
          phone, which has none of that height to spare. The pair has to switch on the
          SAME query — the canvas matches `(min-width: 640px)` rather than its own
          width, because a scrollbar makes the element narrower than the viewport and
          a mismatched pair does not shrink the air, it moves the word. */}
      <div aria-hidden className="h-[259px] sm:h-[354px]" />
    </>
  );
}
