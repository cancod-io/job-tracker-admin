import type {
  AnalyticsInvalidatePayload,
  JobsIngestedPayload,
  RealtimeEvent,
  ScraperRunUpdatedPayload,
  UserUpdatedPayload,
} from "@/types/realtime";
import { dispatchAdminPendingApprovalChanged } from "@/lib/admin-sync-events";

export const REALTIME_JOBS_INGESTED_EVENT = "sjt-realtime-jobs-ingested";
export const REALTIME_SCRAPER_RUN_UPDATED_EVENT = "sjt-realtime-scraper-run-updated";
export const REALTIME_ANALYTICS_INVALIDATE_EVENT = "sjt-realtime-analytics-invalidate";
export const REALTIME_USER_UPDATED_EVENT = "sjt-realtime-user-updated";

export function dispatchRealtimeJobsIngested(payload: JobsIngestedPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<JobsIngestedPayload>(REALTIME_JOBS_INGESTED_EVENT, { detail: payload }),
  );
}

export function dispatchRealtimeScraperRunUpdated(payload: ScraperRunUpdatedPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ScraperRunUpdatedPayload>(REALTIME_SCRAPER_RUN_UPDATED_EVENT, {
      detail: payload,
    }),
  );
}

export function dispatchRealtimeAnalyticsInvalidate(payload: AnalyticsInvalidatePayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AnalyticsInvalidatePayload>(REALTIME_ANALYTICS_INVALIDATE_EVENT, {
      detail: payload,
    }),
  );
}

export function dispatchRealtimeUserUpdated(payload: UserUpdatedPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<UserUpdatedPayload>(REALTIME_USER_UPDATED_EVENT, { detail: payload }),
  );
}

export function isJobsIngestedPayload(
  payload: Record<string, unknown>,
): payload is JobsIngestedPayload {
  return typeof payload.added === "number" && typeof payload.updated === "number";
}

export function isScraperRunUpdatedPayload(
  payload: Record<string, unknown>,
): payload is ScraperRunUpdatedPayload {
  return typeof payload.run_id === "string" && typeof payload.status === "string";
}

export function isAnalyticsInvalidatePayload(
  payload: Record<string, unknown>,
): payload is AnalyticsInvalidatePayload {
  return typeof payload.reason === "string";
}

export function isUserUpdatedPayload(
  payload: Record<string, unknown>,
): payload is UserUpdatedPayload {
  return typeof payload.user_id === "number";
}

export function formatUserUpdatedToast(payload: UserUpdatedPayload): string {
  const who = payload.full_name?.trim() || payload.email?.trim();
  if (payload.approval_status === "pending") {
    return who ? `${who} is waiting for approval.` : "A new user is waiting for approval.";
  }
  return who ? `${who} profile updated.` : "User profile updated.";
}

export function formatJobsIngestSummary(payload: JobsIngestedPayload): string {
  const parts: string[] = [];
  if (payload.added > 0) parts.push(`${payload.added} new`);
  if (payload.updated > 0) parts.push(`${payload.updated} updated`);
  return parts.length > 0 ? parts.join(", ") : "Job listings updated";
}

export function routeRealtimeEvent(event: RealtimeEvent): void {
  switch (event.type) {
    case "jobs.ingested":
      if (isJobsIngestedPayload(event.payload)) {
        dispatchRealtimeJobsIngested(event.payload);
      }
      break;
    case "scraper_run.updated":
      if (isScraperRunUpdatedPayload(event.payload)) {
        dispatchRealtimeScraperRunUpdated(event.payload);
      }
      break;
    case "analytics.invalidate":
      if (isAnalyticsInvalidatePayload(event.payload)) {
        dispatchRealtimeAnalyticsInvalidate(event.payload);
      }
      break;
    case "user.updated":
      if (isUserUpdatedPayload(event.payload)) {
        dispatchRealtimeUserUpdated(event.payload);
        dispatchAdminPendingApprovalChanged();
      }
      break;
    default:
      break;
  }
}
