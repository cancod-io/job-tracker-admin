import type { ToastMessage } from "@/hooks/use-toast";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ToastBanner } from "@/components/ui/toast-banner";

type ListNotificationsProps = {
  toast: ToastMessage | null;
  error: string | null;
  onDismissToast?: () => void;
};

export function ListNotifications({ toast, error, onDismissToast }: ListNotificationsProps) {
  return (
    <div className="space-y-3">
      <ToastBanner toast={toast} layout="inline" onDismiss={onDismissToast} />
      {error ? <AlertBanner>{error}</AlertBanner> : null}
    </div>
  );
}
