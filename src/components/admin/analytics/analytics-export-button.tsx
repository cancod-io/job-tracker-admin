"use client";

import { Download } from "lucide-react";
import { useState } from "react";

type AnalyticsExportButtonProps = {
  label?: string;
  onExport: () => Promise<void>;
};

export function AnalyticsExportButton({
  label = "Export CSV",
  onExport,
}: AnalyticsExportButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void onExport().finally(() => setLoading(false));
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
    >
      <Download className="size-4" aria-hidden />
      {loading ? "Exporting…" : label}
    </button>
  );
}
