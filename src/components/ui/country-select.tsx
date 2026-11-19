"use client";

import { useEffect, useMemo, useState } from "react";
import { COUNTRIES, countryFlagEmoji, countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";

type CountrySelectProps = {
  id?: string;
  value: string | null;
  onChange: (code: string | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export function CountrySelect({
  id,
  value,
  onChange,
  disabled,
  className,
  placeholder = "Select country…",
}: CountrySelectProps) {
  const [open, setOpen] = useState(!value);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!value) setOpen(true);
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  const inputClass =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (value && !open) {
    return (
      <div className={cn("space-y-2", className)}>
        <div
          id={id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
        >
          <span className="text-xl leading-none" aria-hidden>
            {countryFlagEmoji(value)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{countryName(value) ?? value}</p>
            <p className="font-mono text-xs text-muted-foreground">{value}</p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setQuery("");
                setOpen(true);
              }}
              className="rounded-md px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
            >
              Change
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange(null);
                setQuery("");
                setOpen(true);
              }}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search countries…"
        disabled={disabled}
        className={inputClass}
        aria-label="Search countries"
        autoFocus={Boolean(value)}
      />
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onChange(null);
            setQuery("");
            setOpen(true);
          }}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
            value == null && "bg-primary/10 font-semibold text-primary",
          )}
        >
          <span aria-hidden>🏳️</span>
          <span className="text-muted-foreground">{placeholder}</span>
        </button>
        {filtered.map((c) => (
          <button
            key={c.code}
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(c.code);
              setQuery("");
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
              value === c.code && "bg-primary/10 font-semibold text-primary",
            )}
          >
            <span className="text-base leading-none" aria-hidden>
              {countryFlagEmoji(c.code)}
            </span>
            <span className="flex-1 truncate">{c.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
          </button>
        ))}
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No countries match.</p>
        ) : null}
      </div>
      {value ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="text-xs font-semibold text-primary hover:underline disabled:opacity-60"
        >
          Keep {countryFlagEmoji(value)} {countryName(value) ?? value}
        </button>
      ) : null}
    </div>
  );
}
