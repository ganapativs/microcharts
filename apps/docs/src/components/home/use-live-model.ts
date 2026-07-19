"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LIVE_FEW_SHOTS, LIVE_SYSTEM_PROMPT } from "@/lib/live-grammar";

/**
 * HERO LIVE MODE — Chrome's built-in Prompt API (Gemini Nano, on-device).
 *
 * What it is: when the visitor's Chrome already has its on-device model
 * installed, the hero's "assistant reply" panel gains a composer (sample
 * chips + free input). The question is answered locally by Gemini Nano —
 * nothing leaves the machine, no API key, no server. The model is taught the
 * tiny chart notation in `@/lib/live-grammar` (system prompt + few-shots
 * live there too), and its streamed reply runs through the same raw-grammar →
 * morph pipeline as the scripted tour. Invalid grammar renders as literal
 * code, never a broken chart. Everyone else sees the scripted tour, unchanged.
 *
 * How to enable it in your own Chrome (to see the composer):
 * 1. Chrome 138+ on desktop (Win 10/11, macOS 13+, Linux, Chromebook Plus).
 *    No mobile support. Hardware floor: ~22 GB free disk and 16 GB RAM with
 *    4+ cores, or a GPU with more than 4 GB VRAM.
 * 2. The model downloads once (~2–4 GB), browser-wide, after a user gesture
 *    on a page that calls the API. Quickest manual path: open DevTools on
 *    any page and run  `await LanguageModel.create()`  — Chrome starts the
 *    download. On older builds, first flip
 *    chrome://flags/#prompt-api-for-gemini-nano and
 *    chrome://flags/#optimization-guide-on-device-model to Enabled.
 *    Progress/status is visible at chrome://on-device-internals.
 * 3. When  `await LanguageModel.availability()`  returns `"available"`,
 *    reload the homepage — the composer appears under the reply panel.
 *
 * Why the gate is strict: live is offered ONLY when availability() reports
 * `available` — the model is already on disk. `downloadable` is deliberately
 * ignored: a homepage never triggers a multi-GB download. Everyone else keeps
 * the scripted tour; this hook then costs one settled promise.
 * Docs: https://developer.chrome.com/docs/ai/prompt-api
 *
 * Session strategy: one pristine base session holds the system prompt +
 * few-shot examples (created lazily on first intent — input focus / chip
 * hover); each ask clones it so replies never pollute the teaching context or
 * each other.
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

/** Nano has no output-token option — a runaway reply is cut here, kept as-is. */
const MAX_REPLY_CHARS = 1400;

/** Read pre-paint by app/layout.tsx to reserve live mode's height. Kept in
 *  sync with the real availability answer below — never written elsewhere. */
const LIVE_HINT_KEY = "mc-live";

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
          if (!on) return;
          if (a === "available") setSupported(true);
          // Remember the answer for the NEXT load: it is what lets the pre-paint
          // script in app/layout.tsx reserve live mode's space before anything
          // renders, so the panel never grows into it. Clearing on a negative
          // answer is what makes an uninstalled model self-heal — and the
          // attribute goes too, or this load keeps space nothing will fill.
          try {
            if (a === "available") localStorage.setItem(LIVE_HINT_KEY, "1");
            else {
              localStorage.removeItem(LIVE_HINT_KEY);
              delete document.documentElement.dataset.mcLive;
            }
          } catch {
            /* private mode — the prediction is an optimisation, never a need */
          }
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

  /** Pre-create the base session on intent so the first token lands fast. */
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
