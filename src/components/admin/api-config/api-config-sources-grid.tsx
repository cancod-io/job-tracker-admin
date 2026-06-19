"use client";

import { CheckCircle2, Coins, KeyRound, XCircle } from "lucide-react";
import { formatCredits, sourceAccent } from "@/components/admin/api-config/constants";
import { cn } from "@/lib/utils";
import type { ApiConfigSource, ApiKeyListItem } from "@/types/api-config-api";

type ApiConfigSourcesGridProps = {
  sources: ApiConfigSource[];
  keys: ApiKeyListItem[];
  selectedSourceId: string;
  onSelectSource: (sourceId: string) => void;
};

export function ApiConfigSourcesGrid({
  sources,
  keys,
  selectedSourceId,
  onSelectSource,
}: ApiConfigSourcesGridProps) {
  if (sources.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Source status</h2>
        <p className="text-xs text-muted-foreground">Click a source to filter saved keys</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => {
          const accent = sourceAccent(source.id);
          const activeKey = keys.find((key) => key.id === source.active_key_id);
          const credits = formatCredits(activeKey?.credits_remaining);
          const selected = selectedSourceId === source.id;

          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onSelectSource(source.id)}
              className={cn(
                "rounded-2xl border bg-gradient-to-br p-4 text-left shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                accent.gradient,
                selected ? "ring-2 ring-primary/50" : "",
              )}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", accent.dot)} aria-hidden />
                    <h3 className="truncate text-sm font-semibold text-foreground">{source.label}</h3>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{source.config_key}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                    source.is_set
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-destructive/25 bg-destructive/10 text-destructive",
                  )}
                >
                  {source.is_set ? (
                    <CheckCircle2 className="size-3" aria-hidden />
                  ) : (
                    <XCircle className="size-3" aria-hidden />
                  )}
                  {source.is_set ? "Configured" : "No key"}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {activeKey ? (
                  <p className="flex items-center gap-1.5 truncate font-mono text-xs text-foreground">
                    <KeyRound className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                    {activeKey.masked_key}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No active key for {source.label}. Add a key or activate one from the list.
                  </p>
                )}

                {credits !== null ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <Coins className="size-3 shrink-0" aria-hidden />
                    {credits} credits remaining
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
