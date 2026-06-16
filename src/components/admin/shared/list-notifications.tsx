import type { ToastMessage } from "@/hooks/use-toast";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ToastBanner } from "@/components/ui/toast-banner";

type ListNotificationsProps = {
  toast: ToastMessage | null;
  error: string | null;
};

export function ListNotifications({ toast, error }: ListNotificationsProps) {
  return (
    <>
      <ToastBanner toast={toast} />
      {error ? <AlertBanner>{error}</AlertBanner> : null}
    </>
  );
}
