import type { ToastMessage } from "@/hooks/use-toast";
import { AlertBanner } from "@/components/ui/alert-banner";

type ToastBannerProps = {
  toast: ToastMessage | null;
};

export function ToastBanner({ toast }: ToastBannerProps) {
  if (!toast) return null;
  return (
    <AlertBanner variant={toast.kind === "success" ? "success" : "error"}>
      {toast.message}
    </AlertBanner>
  );
}
