"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { Modal } from "@/components/ui/modal";
import type { ApiKeyListItem } from "@/types/api-config-api";

type AdminApiKeyViewModalProps = {
  apiKey: ApiKeyListItem;
  onClose: () => void;
  onCopied?: () => void;
  onCopyError?: (message: string) => void;
};

export function AdminApiKeyViewModal({
  apiKey,
  onClose,
  onCopied,
  onCopyError,
}: AdminApiKeyViewModalProps) {
  const fullKey = apiKey.api_key?.trim() ?? "";
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!fullKey) return;
    setCopying(true);
    try {
      await copyTextToClipboard(fullKey);
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not copy to clipboard.";
      onCopyError?.(message);
    } finally {
      setCopying(false);
    }
  }

  return (
    <Modal
      aria-label="View API key"
      title="API key"
      description={apiKey.source_label}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{apiKey.source_label}</p>
            {apiKey.mailbox ? (
              <p className="text-xs text-muted-foreground">{apiKey.mailbox}</p>
            ) : null}
            <p className="font-mono text-xs text-muted-foreground">{apiKey.masked_key}</p>
          </div>
        </div>

        {!fullKey ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            The full API key is not available for this entry.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Full API key</p>
            <div className="max-h-40 overflow-auto rounded-lg border border-border/80 bg-card px-3 py-2.5 font-mono text-sm text-foreground break-all">
              {fullKey}
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border/80 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!fullKey || copying}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy key"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
