"use client";

import { AlertBanner } from "@/components/ui/alert-banner";
import { Loader2 } from "lucide-react";

type AnalyticsPageStateProps = {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
};

export function AnalyticsPageState({
  loading,
  error,
  empty = false,
  emptyMessage = "No data yet for the selected range.",
  children,
}: AnalyticsPageStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return <AlertBanner variant="warning">{error}</AlertBanner>;
  }

  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
}
