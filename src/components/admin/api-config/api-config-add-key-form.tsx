"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, Plus } from "lucide-react";
import type { ApiConfigSource, ApiKeyCreateRequest } from "@/types/api-config-api";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type ApiConfigAddKeyFormProps = {
  sources: ApiConfigSource[];
  defaultSource?: string;
  submitting?: boolean;
  onSubmit: (payload: ApiKeyCreateRequest) => Promise<void>;
};

export function ApiConfigAddKeyForm({
  sources,
  defaultSource,
  submitting = false,
  onSubmit,
}: ApiConfigAddKeyFormProps) {
  const [source, setSource] = useState(defaultSource ?? sources[0]?.id ?? "");
  const [mailbox, setMailbox] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultSource && sources.some((item) => item.id === defaultSource)) {
      setSource(defaultSource);
    } else if (!sources.some((item) => item.id === source)) {
      setSource(sources[0]?.id ?? "");
    }
  }, [defaultSource, sources, source]);

  const selectedSource = sources.find((item) => item.id === source);
  const isFirstKeyForSource =
    selectedSource !== undefined && !selectedSource.is_set && selectedSource.active_key_id === null;

  const canSubmit = Boolean(source && mailbox.trim() && apiKey.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedKey = apiKey.trim();
    const trimmedMailbox = mailbox.trim();
    if (!source) {
      setError("Select a source.");
      return;
    }
    if (!trimmedMailbox) {
      setError("Enter an email address.");
      return;
    }
    if (!isValidEmail(trimmedMailbox)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!trimmedKey) {
      setError("Enter an API key.");
      return;
    }

    try {
      await onSubmit({ source, api_key: trimmedKey, mailbox: trimmedMailbox });
      setMailbox("");
      setApiKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key.");
    }
  }

  if (sources.length === 0) return null;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-4 md:p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="size-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Add API key</h3>
          <p className="text-xs text-muted-foreground">
            The first key for a source is activated automatically.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-[10rem] flex-1 space-y-1.5 lg:max-w-xs">
          <label htmlFor="vault-add-source" className="text-xs font-medium text-muted-foreground">
            Source
          </label>
          <select
            id="vault-add-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-border/80 bg-card px-3 py-2.5 text-sm text-foreground disabled:opacity-60"
          >
            {sources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 lg:max-w-sm">
          <label htmlFor="vault-add-mailbox" className="text-xs font-medium text-muted-foreground">
            Email <span className="text-destructive">*</span>
          </label>
          <input
            id="vault-add-mailbox"
            type="email"
            autoComplete="email"
            value={mailbox}
            onChange={(e) => setMailbox(e.target.value)}
            disabled={submitting}
            required
            placeholder="user@example.com"
            className="w-full rounded-lg border border-border/80 bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60"
          />
        </div>

        <div className="min-w-0 flex-[2] space-y-1.5">
          <label htmlFor="vault-add-key" className="text-xs font-medium text-muted-foreground">
            API key
          </label>
          <input
            id="vault-add-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={submitting}
            placeholder="Paste the full API key value"
            className="w-full rounded-lg border border-border/80 bg-card px-3 py-2.5 font-mono text-sm text-foreground placeholder:font-sans disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60 lg:min-w-[8.5rem]"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          Add key
        </button>
      </div>

      {isFirstKeyForSource ? (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
          This will be the first key for {selectedSource?.label} — it will be activated automatically.
        </p>
      ) : null}

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
