"use client";

import { Check, Coins, Eye, KeyRound, Loader2, Trash2 } from "lucide-react";
import { formatCredits } from "@/components/admin/api-config/constants";
import { DataTable } from "@/components/ui/data-table";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { ApiKeyListItem } from "@/types/api-config-api";

type ApiConfigKeysTableProps = {
  keys: ApiKeyListItem[];
  loading: boolean;
  hasLoaded: boolean;
  canManage: boolean;
  sourceFilterActive: boolean;
  activatingId: number | null;
  onView: (key: ApiKeyListItem) => void;
  onActivate: (key: ApiKeyListItem) => void;
  onDelete: (key: ApiKeyListItem) => void;
};

function CreditsCell({ keyItem }: { keyItem: ApiKeyListItem }) {
  const credits = formatCredits(keyItem.credits_remaining);
  if (credits === null) {
    return <span className="text-xs text-muted-foreground">Not synced yet</span>;
  }

  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
        <Coins className="size-3 shrink-0" aria-hidden />
        {credits}
      </span>
      {keyItem.credits_updated_at ? (
        <p className="text-xs text-muted-foreground">
          Synced {formatDateTime(keyItem.credits_updated_at)}
        </p>
      ) : null}
    </div>
  );
}

export function ApiConfigKeysTable({
  keys,
  loading,
  hasLoaded,
  canManage,
  sourceFilterActive,
  activatingId,
  onView,
  onActivate,
  onDelete,
}: ApiConfigKeysTableProps) {
  const emptyMessage =
    sourceFilterActive && hasLoaded
      ? "No keys stored for this source yet. Add a key above or activate one from another source."
      : "No API keys saved yet. Add a key above. Keys take effect on the api-service's next config refresh or scrape run.";

  return (
    <DataTable loading={loading} loadingMessage="Loading key vault…" minWidth="1080px">
      {!loading ? (
        <>
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Masked key</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Credits</th>
              <th className="px-4 py-3 font-medium">Added</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <KeyRound className="size-8 text-muted-foreground/60" aria-hidden />
                    <p>{emptyMessage}</p>
                    {canManage ? <p className="text-xs">Use the form above to add a key.</p> : null}
                  </div>
                </td>
              </tr>
            ) : (
              keys.map((key) => {
                const busy = activatingId === key.id;
                return (
                  <tr
                    key={key.id}
                    className={cn(
                      "border-b border-border/60 last:border-b-0 hover:bg-muted/20",
                      key.is_active && "bg-emerald-500/[0.06] ring-1 ring-inset ring-emerald-500/20",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{key.source_label}</div>
                      <div className="font-mono text-xs text-muted-foreground">{key.source}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {key.mailbox ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-mono text-xs text-foreground">
                          {key.masked_key}
                        </span>
                        <button
                          type="button"
                          onClick={() => onView(key)}
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`View full API key for ${key.source_label}`}
                          title="View full API key"
                        >
                          <Eye className="size-4" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {key.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <Check className="size-3" aria-hidden />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Stored
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CreditsCell keyItem={key} />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDateTime(key.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {canManage && !key.is_active ? (
                          <button
                            type="button"
                            onClick={() => onActivate(key)}
                            disabled={busy}
                            className="rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
                          >
                            {busy ? (
                              <Loader2
                                className="size-3.5 animate-spin motion-reduce:animate-none"
                                aria-hidden
                              />
                            ) : (
                              "Use this API key"
                            )}
                          </button>
                        ) : null}
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => onDelete(key)}
                            disabled={busy}
                            className="rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-60"
                            aria-label={`Delete API key ${key.masked_key}`}
                            title="Delete"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </>
      ) : null}
    </DataTable>
  );
}
