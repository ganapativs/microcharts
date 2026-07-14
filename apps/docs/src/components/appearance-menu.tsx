"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { cn } from "@/lib/cn";

// Accent palette — Cobalt default. Charts bind `--mc-accent` to the choice.
const SOLIDS = [
  { id: "cobalt", label: "Cobalt", swatch: "#2f52d4" },
  { id: "ember", label: "Ember", swatch: "#c2410c" },
  { id: "clay", label: "Clay", swatch: "#a14a34" },
  { id: "moss", label: "Moss", swatch: "#4d7c1e" },
  { id: "teal", label: "Teal", swatch: "#0f766e" },
  { id: "rose", label: "Rose", swatch: "#be123c" },
] as const;

const THEMES = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "system", icon: Monitor, label: "Auto" },
  { id: "dark", icon: Moon, label: "Dark" },
] as const;

// Chart presets → [data-mc-preset] on <html> (modern = default, no attribute).
// print + eink are output-context bundles (paper, grayscale e-paper).
const PRESETS = [
  { id: "modern", label: "Modern" },
  { id: "editorial", label: "Editorial" },
  { id: "mono", label: "Mono" },
  { id: "vivid", label: "Vivid" },
  { id: "print", label: "Print" },
  { id: "eink", label: "E-ink" },
] as const;

function AccentChip({
  id,
  label,
  swatch,
  active,
  onSelect,
}: {
  id: string;
  label: string;
  swatch: string;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={active}
      title={label}
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[0.7rem] transition-all duration-200 hover:-translate-y-px",
        active
          ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
          : "border-fd-border text-fd-muted-foreground hover:border-fd-primary/30 hover:text-fd-foreground",
      )}
    >
      <span
        key={active ? "on" : "off"}
        className={cn(
          "relative flex size-4 shrink-0 items-center justify-center rounded-full ring-1 ring-black/10 transition-transform group-hover:scale-110 dark:ring-white/15",
          active && "chip-pop",
        )}
        style={{ background: swatch }}
      >
        {active && <Check className="size-2.5 text-white drop-shadow" strokeWidth={3.5} />}
      </span>
      {label}
    </button>
  );
}

export function AppearanceMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const [accent, setAccentState] = useState<string>("cobalt");
  const [preset, setPresetState] = useState<string>("modern");
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reused in the right-aligned marketing nav AND the left-aligned docs sidebar,
  // whose overflow would clip an in-flow panel — so the panel is portalled to
  // <body> with fixed coords, anchored toward whichever side has room.
  function toggle() {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      // approximate popover height (preview + theme + accent + chart-style rows)
      // so the up/down flip keeps it on-screen; err tall to avoid clipping.
      const PANEL_H = 510;
      const openUp = r.bottom + PANEL_H > window.innerHeight && r.top > PANEL_H;
      const vertical: CSSProperties = openUp
        ? { bottom: window.innerHeight - r.top + 10 }
        : { top: r.bottom + 10 };
      const horizontal: CSSProperties =
        r.left < window.innerWidth / 2
          ? { left: Math.max(12, r.left) }
          : { right: Math.max(12, window.innerWidth - r.right) };
      setPos({ ...vertical, ...horizontal });
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    setMounted(true);
    setAccentState(document.documentElement.dataset.accent ?? "cobalt");
    setPresetState(document.documentElement.dataset.mcPreset ?? "modern");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
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

  function setPreset(id: string) {
    if (id === "modern") delete document.documentElement.dataset.mcPreset;
    else document.documentElement.dataset.mcPreset = id;
    try {
      localStorage.setItem("mc-preset", id);
    } catch {}
    setPresetState(id);
  }

  const current = SOLIDS.find((a) => a.id === accent) ?? SOLIDS[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Appearance and accent"
        aria-expanded={open}
        onClick={toggle}
        className="group ghost-ctrl size-8"
      >
        <Palette
          className="size-[18px] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
          style={{ color: "var(--accent)" }}
        />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            style={pos}
            className="glass glass-strong pop-in fixed z-[60] w-[20rem] max-w-[calc(100vw-1.5rem)] overflow-hidden"
          >
            {/* live preview — the accent on a real microchart, no overlap */}
            <div className="border-b border-hairline">
              <div className="flex items-center justify-between px-4 pb-1.5 pt-3">
                <span className="mono-label text-[0.56rem]">Preview</span>
                <span className="mono-label text-[0.56rem] text-fd-primary">{current.label}</span>
              </div>
              <div className="grid-paper flex items-center justify-center px-5 pb-5 pt-1">
                <div key={accent + preset} className="mc-morph flex justify-center">
                  <Sparkline
                    data={[6, 9, 7, 12, 10, 15, 13, 18, 16, 22]}
                    width={240}
                    height={48}
                    curve="smooth"
                    dots="minmax"
                    color="var(--accent)"
                    summary={false}
                  />
                </div>
              </div>
              {/* a hairline accent rule under the preview — thin, never loud */}
              <div aria-hidden className="h-0.5 w-full" style={{ background: "var(--accent)" }} />
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
                {SOLIDS.map((a) => (
                  <AccentChip key={a.id} {...a} active={accent === a.id} onSelect={setAccent} />
                ))}
              </div>

              <div className="mono-label mb-2 mt-4 text-[0.58rem]">Chart style</div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => {
                  const active = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreset(p.id)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-lg border py-1.5 text-[0.7rem] transition-all duration-200 hover:-translate-y-px",
                        active
                          ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
                          : "border-fd-border text-fd-muted-foreground hover:border-fd-primary/30 hover:text-fd-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
