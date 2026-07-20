/** Shared live/static mode for the gallery plane + dock. */

export type GalleryMode = "live" | "static";

const KEY = "mc-gallery2-mode";
const listeners = new Set<() => void>();

function read(): GalleryMode {
  if (typeof window === "undefined") return "live";
  const p = new URLSearchParams(window.location.search).get("mode");
  if (p === "static" || p === "live") return p;
  const s = localStorage.getItem(KEY);
  return s === "static" ? "static" : "live";
}

let mode: GalleryMode = "live";
let primed = false;

function prime() {
  if (primed || typeof window === "undefined") return;
  primed = true;
  mode = read();
}

export function getGalleryMode(): GalleryMode {
  prime();
  return mode;
}

export function setGalleryMode(next: GalleryMode) {
  prime();
  if (next === mode) return;
  mode = next;
  localStorage.setItem(KEY, next);
  const p = new URLSearchParams(window.location.search);
  if (next === "live") p.delete("mode");
  else p.set("mode", "static");
  const qs = p.toString();
  window.history.replaceState(
    null,
    "",
    window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
  );
  listeners.forEach((l) => l());
}

export function subscribeGalleryMode(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
