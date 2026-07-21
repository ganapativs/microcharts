"use client";
import { useCallback, useRef, type MouseEvent, type PointerEvent } from "react";
import { useRouter } from "next/navigation";

const MOVE_PX = 6;

/**
 * Pointer-scrub-aware navigation for the card AREA the real anchor doesn't sit
 * over (the raised interactive chart stage). A click with almost no pointer
 * travel opens `href`; a scrub (moved, e.g. hovering/dragging a mark) does not.
 *
 * The card's accessible link + keyboard nav live on a real `<a>` overlay, so
 * this hook returns pointer handlers only — no `role`/`tabIndex`/`onKeyDown`.
 * Clicks that land on the anchor are ignored here (`closest("a")` guard) so the
 * anchor's native navigation is never doubled.
 */
export function useClickableCard(href: string) {
  const router = useRouter();
  const origin = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(() => {
    router.push(href);
  }, [href, router]);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    origin.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      // Nested real links (if any) keep their own navigation.
      if ((e.target as HTMLElement).closest("a")) return;
      const o = origin.current;
      origin.current = null;
      if (!o) return;
      if (Math.abs(e.clientX - o.x) > MOVE_PX || Math.abs(e.clientY - o.y) > MOVE_PX) return;
      e.preventDefault();
      // ⌘/Ctrl/Shift-click opens a background/new tab, matching a real link.
      if (e.metaKey || e.ctrlKey || e.shiftKey) {
        window.open(href, "_blank", "noopener");
        return;
      }
      go();
    },
    [go, href],
  );

  // Middle-click (button 1) fires `auxclick`, not `click` — open a new tab.
  const onAuxClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (e.button !== 1) return;
      if ((e.target as HTMLElement).closest("a")) return;
      const o = origin.current;
      origin.current = null;
      if (!o) return;
      if (Math.abs(e.clientX - o.x) > MOVE_PX || Math.abs(e.clientY - o.y) > MOVE_PX) return;
      e.preventDefault();
      window.open(href, "_blank", "noopener");
    },
    [href],
  );

  return {
    onPointerDown,
    onClick,
    onAuxClick,
  };
}
