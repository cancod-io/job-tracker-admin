"use client";

type ListSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
};

export function ListSearchInput({
  value,
  onChange,
  onSearch,
  placeholder,
  ariaLabel,
  className,
}: ListSearchInputProps) {
  return (
    <div className={className ?? "flex min-w-0 flex-1 gap-2"}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch();
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={onSearch}
        className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        Search
      </button>
    </div>
  );
}
