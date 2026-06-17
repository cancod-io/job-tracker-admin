"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { CompanyImportSummary } from "@/types/company-api";

type AdminCompanyCsvImportModalProps = {
  onClose: () => void;
  onUpload: (file: File) => Promise<CompanyImportSummary>;
  /** Called after a successful import so the parent can refresh the list. */
  onImported: () => void;
};

const ACCEPTED_EXT = ".csv";
const ACCEPTED_MIME = ["text/csv", "application/vnd.ms-excel", "application/csv", ""];

function isCsv(file: File): boolean {
  if (file.name.toLowerCase().endsWith(ACCEPTED_EXT)) return true;
  return ACCEPTED_MIME.includes(file.type);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminCompanyCsvImportModal({
  onClose,
  onUpload,
  onImported,
}: AdminCompanyCsvImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CompanyImportSummary | null>(null);

  function handleFileChange(next: File | null) {
    setUploadError(null);
    setSummary(null);
    if (!next) {
      setFile(null);
      setFileError(null);
      return;
    }
    if (!isCsv(next)) {
      setFile(null);
      setFileError("Only .csv files are allowed.");
      return;
    }
    setFile(next);
    setFileError(null);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setSummary(null);
    try {
      const result = await onUpload(file);
      setSummary(result);
      onImported();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal
      aria-label="Import companies from CSV"
      title="Import companies from CSV"
      description="Upload a UTF-8 CSV. Required column: name. Optional: website_url."
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {!summary ? (
        <div className="space-y-4">
          <div
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center",
              fileError ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30",
            )}
          >
            <FileSpreadsheet className="size-8 text-muted-foreground" aria-hidden />
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a <code className="text-xs">.csv</code> file to upload.
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {file ? "Choose a different file" : "Select CSV file"}
            </button>
          </div>

          {fileError ? (
            <p
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {fileError}
            </p>
          ) : null}

          {uploadError ? (
            <p
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {uploadError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!file || uploading}
              onClick={() => void handleUpload()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <Upload className="size-4" aria-hidden />
              )}
              {uploading ? "Uploading…" : "Upload CSV"}
            </button>
          </div>
        </div>
      ) : (
        <ImportSummaryView summary={summary} onClose={onClose} />
      )}
    </Modal>
  );
}

function ImportSummaryView({
  summary,
  onClose,
}: {
  summary: CompanyImportSummary;
  onClose: () => void;
}) {
  const hadFailures = summary.failed > 0;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm",
          hadFailures
            ? "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100"
            : "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
        )}
      >
        {hadFailures ? (
          <AlertCircle className="size-4 shrink-0" aria-hidden />
        ) : (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        )}
        {hadFailures
          ? "Import finished with some rows rejected."
          : "Import finished successfully."}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <SummaryCell label="Total rows" value={summary.total_rows} />
        <SummaryCell label="Created" value={summary.created} tone="positive" />
        <SummaryCell label="Updated" value={summary.updated} tone="info" />
        <SummaryCell
          label="Failed"
          value={summary.failed}
          tone={summary.failed > 0 ? "negative" : undefined}
        />
      </dl>

      {summary.errors.length > 0 ? (
        <details className="rounded-lg border border-border/80 bg-muted/30 p-3 text-sm" open>
          <summary className="cursor-pointer font-medium text-foreground">
            Show {summary.errors.length} failed row{summary.errors.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
            {summary.errors.slice(0, 25).map((entry) => (
              <li key={entry.row} className="rounded-md border border-border/60 bg-card px-2 py-1.5">
                <span className="font-medium text-foreground">Row {entry.row}</span>
                <ul className="mt-1 list-disc pl-4">
                  {entry.errors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </li>
            ))}
            {summary.errors.length > 25 ? (
              <li>… and {summary.errors.length - 25} more</li>
            ) : null}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "positive" | "negative" | "warn" | "info";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "negative"
        ? "text-destructive"
        : tone === "warn"
          ? "text-amber-700 dark:text-amber-300"
          : tone === "info"
            ? "text-sky-700 dark:text-sky-300"
            : "text-foreground";

  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("text-lg font-semibold tabular-nums", toneClass)}>{value}</dd>
    </div>
  );
}
