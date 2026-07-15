"use client";
import "@microcharts/react/motion";
import { useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";

/** Direction B headline marks — the library's own entrance motion (`animate`),
 *  drawn on load, replayed on hover via remount. Real components, real motion. */

const TREND = [3, 5, 4, 8, 6, 9, 7, 11];

export function HeadlineSpark() {
  const [nonce, setNonce] = useState(0);
  return (
    <span aria-hidden className="hx-word" onPointerEnter={() => setNonce((n) => n + 1)}>
      <Sparkline
        key={nonce}
        data={TREND}
        curve="smooth"
        width={60}
        height={20}
        animate
        summary={false}
      />
    </span>
  );
}

export function HeadlineBars() {
  const [nonce, setNonce] = useState(0);
  return (
    <span aria-hidden className="hx-word" onPointerEnter={() => setNonce((n) => n + 1)}>
      <SparkBar key={nonce} data={TREND} width={52} height={20} animate summary={false} />
    </span>
  );
}
