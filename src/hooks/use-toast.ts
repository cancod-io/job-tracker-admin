"use client";

import { useCallback, useEffect, useState } from "react";

export type ToastMessage = {
  kind: "success" | "error" | "info";
  message: string;
  title?: string;
};

const DEFAULT_DISMISS_MS = 4500;

export function useToast(dismissMs = DEFAULT_DISMISS_MS) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), dismissMs);
    return () => clearTimeout(timer);
  }, [toast, dismissMs]);

  const showSuccess = useCallback((message: string, title?: string) => {
    setToast({ kind: "success", message, title });
  }, []);

  const showError = useCallback((message: string, title?: string) => {
    setToast({ kind: "error", message, title });
  }, []);

  const showInfo = useCallback((message: string, title?: string) => {
    setToast({ kind: "info", message, title });
  }, []);

  return { toast, setToast, showSuccess, showError, showInfo };
}
