"use client";

import { useId, useRef } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ListSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Commit immediately (Enter). Optional when the parent already debounces `value`. */
  onSearch?: () => void;
  /** Clear the query and any applied search. Defaults to `onChange("")`. */
  onClear?: () => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  /** True while draft differs from the applied query (debounce in flight). */
  pending?: boolean;
  /** True while a network fetch for the current query is running. */
  loading?: boolean;
  /** Applied query currently reflected in results. */
  appliedQuery?: string;
  /** Result count for the applied query (shown under the field). */
  resultCount?: number | null;
  autoFocus?: boolean;
};

export function ListSearchInput({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder,
  ariaLabel,
  className,
  pending = false,
  loading = false,
  appliedQuery,
  resultCount = null,
  autoFocus = false,
}: ListSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const statusId = useId();
  const hasValue = value.trim().length > 0;
  const applied = (appliedQuery ?? "").trim();
  const showStatus = Boolean(applied) || pending || (loading && hasValue);

  function clear() {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
    inputRef.current?.focus();
  }

  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <div
        className={cn(
          "group relative flex items-center rounded-xl border bg-card shadow-sm transition-shadow",
          "border-border/80 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20",
        )}
      >
        <span className="pointer-events-none absolute left-3.5 text-muted-foreground">
          {loading ? (
            <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
          ) : (
            <Search className="size-4" aria-hidden />
          )}
        </span>

        <input
          ref={inputRef}
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch?.();
            }
            if (e.key === "Escape" && hasValue) {
              e.preventDefault();
              clear();
            }
          }}
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 bg-transparent py-2.5 pl-10 text-sm text-foreground",
            "placeholder:text-muted-foreground focus-visible:outline-none",
            "[&::-webkit-search-cancel-button]:hidden",
            hasValue ? "pr-20" : "pr-3.5",
          )}
          aria-label={ariaLabel}
          aria-describedby={showStatus ? statusId : undefined}
          autoComplete="off"
          spellCheck={false}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {pending && hasValue ? (
            <span className="hidden rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
              Typing…
            </span>
          ) : null}
          {hasValue ? (
            <button
              type="button"
              onClick={clear}
              className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
          {onSearch ? (
            <button
              type="button"
              onClick={onSearch}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Search
            </button>
          ) : null}
        </div>
      </div>

      {showStatus && (
        <p id={statusId} className="mt-1.5 px-0.5 text-xs text-muted-foreground" aria-live="polite">
          {pending && hasValue
            ? "Updating results as you type…"
            : loading && applied
              ? `Searching for “${applied}”…`
              : applied && resultCount != null
                ? resultCount === 0
                  ? `No matches for “${applied}”`
                  : `${resultCount} match${resultCount === 1 ? "" : "es"} for “${applied}”`
                : applied
                  ? `Showing results for “${applied}”`
                  : null}
        </p>
      )}
    </div>
  );
}
