import { cn } from "@/lib/utils";

type AlertBannerProps = {
  children: React.ReactNode;
  variant?: "error" | "success" | "warning" | "info";
  className?: string;
};

const variantClasses = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  info: "border-primary/30 bg-primary/10 text-primary",
} as const;

export function AlertBanner({ children, variant = "error", className }: AlertBannerProps) {
  return (
    <p
      className={cn("rounded-lg border px-3 py-2 text-sm", variantClasses[variant], className)}
      role={variant === "success" || variant === "info" ? "status" : "alert"}
    >
      {children}
    </p>
  );
}
