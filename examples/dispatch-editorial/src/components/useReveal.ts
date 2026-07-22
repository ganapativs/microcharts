import { useEffect, useRef } from "react";

/**
 * Adds `data-revealed="true"` to the element the first time it scrolls into
 * view, so CSS can run a one-shot entrance. All motion is defined inside
 * `@media (prefers-reduced-motion: no-preference)`, so this is a no-op for
 * readers who ask for less motion — the element is simply visible from the
 * start. One shared observer would be leaner, but figures are few here.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (or already past): reveal immediately.
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.revealed = "true";
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = "true";
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  return ref;
}
