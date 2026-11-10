import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DataTableProps = {
  loading?: boolean;
  loadingMessage?: string;
  minWidth?: string;
  children: React.ReactNode;
  className?: string;
  tableClassName?: string;
};

export function DataTable({
  loading = false,
  loadingMessage = "Loading…",
  minWidth = "720px",
  children,
  className,
  tableClassName,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-sm",
        className,
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin motion-reduce:animate-none" aria-hidden />
          {loadingMessage}
        </div>
      ) : (
        <table className={cn("w-full text-left text-sm", tableClassName)} style={{ minWidth }}>
          {children}
        </table>
      )}
    </div>
  );
}
