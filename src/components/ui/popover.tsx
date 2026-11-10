"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Align = "start" | "end";

export type PopoverRenderProps = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

type PopoverProps = {
  button: (props: PopoverRenderProps) => ReactNode;
  children: (props: PopoverRenderProps) => ReactNode;
  align?: Align;
  gap?: number;
  panelClassName?: string;
};

const VIEWPORT_MARGIN = 8;

export function Popover({
  button,
  children,
  align = "end",
  gap = 8,
  panelClassName,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const r = trigger.getBoundingClientRect();
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;

    let left = align === "end" ? r.right - pw : r.left;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - pw - VIEWPORT_MARGIN));

    let top = r.bottom + gap;
    if (top + ph > window.innerHeight - VIEWPORT_MARGIN) {
      const above = r.top - gap - ph;
      top =
        above >= VIEWPORT_MARGIN
          ? above
          : Math.max(VIEWPORT_MARGIN, window.innerHeight - ph - VIEWPORT_MARGIN);
    }

    setCoords({ top, left });
  }, [align, gap]);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    reposition();

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, reposition]);

  const rp: PopoverRenderProps = { open, toggle, close };

  return (
    <div ref={triggerRef} className="relative inline-flex">
      {button(rp)}
      {open
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                top: coords?.top ?? 0,
                left: coords?.left ?? 0,
                visibility: coords ? "visible" : "hidden",
              }}
              className={cn("z-[300]", panelClassName)}
            >
              {children(rp)}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
