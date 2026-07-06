"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

const ACCENTS = [
  { id: "cobalt", label: "Cobalt", color: "#2f52d4" },
  { id: "ember", label: "Ember", color: "#c2410c" },
  { id: "clay", label: "Clay", color: "#a14a34" },
  { id: "moss", label: "Moss", color: "#4d7c1e" },
  { id: "teal", label: "Teal", color: "#0f766e" },
  { id: "plum", label: "Plum", color: "#8a3a6b" },
] as const;

const THEMES = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "system", icon: Monitor, label: "System" },
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
        className="flex size-8 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground transition-colors hover:text-fd-foreground"
      >
        <span
          className="size-3.5 rounded-full ring-2 ring-fd-background"
          style={{ background: mounted ? "var(--accent)" : current.color }}
        />
      </button>

      {open && (
        <div className="pop-in absolute right-0 top-[calc(100%+8px)] z-50 w-56 origin-top-right rounded-xl border border-fd-border bg-fd-popover p-3 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.28)]">
          <div className="mono-label mb-2 text-[0.6rem]">Theme</div>
          <div className="flex rounded-lg border border-fd-border bg-fd-muted/50 p-0.5">
            {THEMES.map((t) => {
              const active = mounted && theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  aria-label={t.label}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs transition-colors",
                    active
                      ? "bg-fd-card text-fd-foreground ring-1 ring-fd-border"
                      : "text-fd-muted-foreground hover:text-fd-foreground",
                  )}
                >
                  <t.icon className="size-3.5" />
                </button>
              );
            })}
          </div>

          <div className="mono-label mb-2 mt-4 text-[0.6rem]">Accent</div>
          <div className="grid grid-cols-6 gap-1.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.id)}
                aria-label={a.label}
                aria-pressed={accent === a.id}
                title={a.label}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md transition-transform hover:scale-110",
                  accent === a.id && "ring-2 ring-fd-ring ring-offset-2 ring-offset-fd-popover",
                )}
                style={{ background: a.color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
