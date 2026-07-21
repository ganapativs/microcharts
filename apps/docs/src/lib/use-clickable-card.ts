"use client";
import { useCallback, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { useRouter } from "next/navigation";

const MOVE_PX = 6;

/**
 * Whole-card navigation that coexists with chart hover/scrub: a click with
 * almost no pointer travel opens `href`; a scrub (moved) does not. Keyboard
 * Enter/Space on the card itself still navigates.
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
      go();
    },
    [go],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      go();
    },
    [go],
  );

  return {
    role: "link" as const,
    tabIndex: 0,
    onPointerDown,
    onClick,
    onKeyDown,
  };
}
