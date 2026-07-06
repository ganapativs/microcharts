"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { cn } from "@/lib/cn";

const ACCENTS = [
  { id: "cobalt", label: "Cobalt", color: "#2f52d4" },
  { id: "ember", label: "Ember", color: "#c2410c" },
  { id: "clay", label: "Clay", color: "#a14a34" },
  { id: "moss", label: "Moss", color: "#4d7c1e" },
  { id: "teal", label: "Teal", color: "#0f766e" },
  { id: "rose", label: "Rose", color: "#be123c" },
] as const;

const THEMES = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "system", icon: Monitor, label: "Auto" },
  { id: "dark", icon: Moon, label: "Dark" },
] as const;

export function AppearanceMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [accent, setAccentState] = useState<string>("cobalt");
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setAccentState(document.documentElement.dataset.accent ?? "cobalt");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function setAccent(id: string) {
    if (id === "cobalt") delete document.documentElement.dataset.accent;
    else document.documentElement.dataset.accent = id;
    try {
      localStorage.setItem("mc-accent", id);
    } catch {}
    setAccentState(id);
  }

  const current = ACCENTS.find((a) => a.id === accent) ?? ACCENTS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Appearance"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-md border border-fd-border transition-colors hover:bg-fd-muted"
      >
        <span
          className="size-3.5 rounded-[5px] ring-2 ring-fd-background transition-transform"
          style={{ background: mounted ? "var(--accent)" : current.color }}
        />
      </button>

      {open && (
        <div className="pop-in absolute right-0 top-[calc(100%+10px)] z-50 w-[19rem] origin-top-right overflow-hidden rounded-2xl border border-fd-border bg-fd-popover shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]">
          {/* live preview — the accent on a real microchart */}
          <div className="grid-paper relative flex items-center justify-center border-b border-fd-border px-5 py-6">
            <span className="mono-label absolute left-4 top-3 text-[0.56rem]">Preview</span>
            <span className="mono-label absolute right-4 top-3 text-[0.56rem] text-fd-primary">
              {current.label}
            </span>
            <Sparkline
              data={[6, 9, 7, 12, 10, 15, 13, 18, 16, 22]}
              width={220}
              height={52}
              curve="smooth"
              dots="minmax"
              color="var(--accent)"
              summary={false}
            />
          </div>

          <div className="p-3">
            <div className="mono-label mb-2 text-[0.58rem]">Theme</div>
            <div className="grid grid-cols-3 gap-1.5">
              {THEMES.map((t) => {
                const active = mounted && theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border py-2 text-[0.68rem] transition-colors",
                      active
                        ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
                        : "border-fd-border text-fd-muted-foreground hover:text-fd-foreground",
                    )}
                  >
                    <t.icon className="size-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="mono-label mb-2 mt-4 text-[0.58rem]">Accent</div>
            <div className="grid grid-cols-3 gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAccent(a.id)}
                  aria-pressed={accent === a.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[0.7rem] transition-colors",
                    accent === a.id
                      ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
                      : "border-fd-border text-fd-muted-foreground hover:text-fd-foreground",
                  )}
                >
                  <span
                    className="relative flex size-4 shrink-0 items-center justify-center rounded-full"
                    style={{ background: a.color }}
                  >
                    {accent === a.id && <Check className="size-2.5 text-white" strokeWidth={3.5} />}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
