"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LIVE_FEW_SHOTS, LIVE_SYSTEM_PROMPT } from "@/lib/live-grammar";

/**
 * Chrome's on-device Prompt API. Offered only when `LanguageModel.availability()`
 * is already `"available"` — this never triggers a model download.
 *
 * Enable locally: Chrome 138+ desktop, ~22 GB free / 16 GB RAM (or >4 GB VRAM),
 * then `await LanguageModel.create()` once in DevTools and reload.
 * https://developer.chrome.com/docs/ai/prompt-api
 */

interface LMSession {
  promptStreaming(input: string, options?: { signal?: AbortSignal }): ReadableStream<string>;
  clone?(options?: { signal?: AbortSignal }): Promise<LMSession>;
  destroy?(): void;
}

interface LMStatic {
  availability(): Promise<"unavailable" | "downloadable" | "downloading" | "available">;
  create(options?: {
    initialPrompts?: {
      role: "system" | "user" | "assistant";
      content: string;
    }[];
    temperature?: number;
    topK?: number;
  }): Promise<LMSession>;
}

declare global {
  // eslint-disable-next-line no-var
  var LanguageModel: LMStatic | undefined;
}

export type LivePhase = "idle" | "thinking" | "streaming" | "done" | "error";

/** Nano has no output-token option — a runaway reply is cut here. Sized to the
 *  prompt's 90–150 words plus two fenced charts, with room to finish a sentence. */
const MAX_REPLY_CHARS = 2200;

export function useLiveModel() {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<LivePhase>("idle");
  const [text, setText] = useState("");
  const baseRef = useRef<Promise<LMSession | null> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let on = true;
    const check = () => {
      const lm = globalThis.LanguageModel;
      if (!lm?.availability) return;
      lm.availability().then(
        (a) => {
          if (on && a === "available") setSupported(true);
        },
        () => {},
      );
    };
    check();
    // dev/testing seam: an injected stub can re-run detection after page load
    window.addEventListener("mc-live-recheck", check);
    return () => {
      on = false;
      window.removeEventListener("mc-live-recheck", check);
      abortRef.current?.abort();
      baseRef.current?.then((s) => s?.destroy?.());
      baseRef.current = null;
    };
  }, []);

  /** Pre-create the base session on intent so the first token lands fast. One
   *  base session carries the system prompt and few-shots; each ask clones it. */
  const warm = useCallback(() => {
    const lm = globalThis.LanguageModel;
    if (!lm || baseRef.current) return;
    baseRef.current = lm
      .create({
        initialPrompts: [{ role: "system", content: LIVE_SYSTEM_PROMPT }, ...LIVE_FEW_SHOTS],
        // low-ish temperature: grammar adherence over flourish
        temperature: 0.7,
        topK: 3,
      })
      .catch(() => null);
  }, []);

  const ask = useCallback(
    async (question: string) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const current = () => abortRef.current === ctrl;
      setPhase("thinking");
      setText("");
      let out = "";
      let session: LMSession | null = null;
      let base: LMSession | null = null;
      try {
        warm();
        base = (await baseRef.current) ?? null;
        if (!base) throw new Error("no session");
        session = base.clone ? await base.clone({ signal: ctrl.signal }) : base;
        const reader = session.promptStreaming(question, { signal: ctrl.signal }).getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done || ctrl.signal.aborted) break;
          out += value;
          if (current()) {
            setText(out);
            setPhase("streaming");
          }
          if (out.length > MAX_REPLY_CHARS) {
            ctrl.abort();
            break;
          }
        }
        if (current()) setPhase("done");
      } catch {
        // an abort mid-read also lands here; partial output still counts
        if (current()) setPhase(out.length > 0 ? "done" : "error");
      } finally {
        if (session && session !== base) session.destroy?.();
      }
    },
    [warm],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setText("");
  }, []);

  return { supported, phase, text, ask, warm, reset };
}
