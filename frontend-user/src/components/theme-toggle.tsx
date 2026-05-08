"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted";

const options: { value: "light" | "dark" | "system"; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const TriggerIcon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted",
          open && "bg-muted",
        )}
        aria-label="Theme"
      >
        <TriggerIcon className="size-[1.125rem]" aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-border bg-card py-1 shadow-lg"
          role="menu"
          aria-orientation="vertical"
        >
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Appearance
          </p>
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={mode === value}
              className={menuItemClass}
              onClick={() => {
                setMode(value);
                setOpen(false);
              }}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {label}
              <Check
                className={cn(
                  "ml-auto size-4 shrink-0 text-primary",
                  mode !== value && "invisible",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
