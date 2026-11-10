import type {
  AnalyticsInvalidatePayload,
  JobsIngestedPayload,
  RealtimeEvent,
  ScraperRunUpdatedPayload,
  TopApplicantsPayload,
  UserUpdatedPayload,
  UsersApplicationStatsPayload,
} from "@/types/realtime";

export const REALTIME_JOBS_INGESTED_EVENT = "sjt-realtime-jobs-ingested";
export const REALTIME_SCRAPER_RUN_UPDATED_EVENT = "sjt-realtime-scraper-run-updated";
export const REALTIME_ANALYTICS_INVALIDATE_EVENT = "sjt-realtime-analytics-invalidate";
export const REALTIME_USER_UPDATED_EVENT = "sjt-realtime-user-updated";
export const REALTIME_USERS_APPLICATION_STATS_UPDATED_EVENT =
  "sjt-realtime-users-application-stats-updated";
export const REALTIME_ANALYTICS_TOP_APPLICANTS_UPDATED_EVENT =
  "sjt-realtime-analytics-top-applicants-updated";

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

export function dispatchRealtimeUsersApplicationStatsUpdated(
  payload: UsersApplicationStatsPayload,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<UsersApplicationStatsPayload>(REALTIME_USERS_APPLICATION_STATS_UPDATED_EVENT, {
      detail: payload,
    }),
  );
}

export function dispatchRealtimeTopApplicantsUpdated(payload: TopApplicantsPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<TopApplicantsPayload>(REALTIME_ANALYTICS_TOP_APPLICANTS_UPDATED_EVENT, {
      detail: payload,
    }),
  );
}

export function isJobsIngestedPayload(
  payload: Record<string, unknown>,
): payload is JobsIngestedPayload {
  return typeof payload.added === "number";
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

function isUserApplicationStatsItem(
  raw: unknown,
): raw is UsersApplicationStatsPayload["users"][number] {
  if (!raw || typeof raw !== "object") return false;
  const item = raw as Record<string, unknown>;
  return (
    typeof item.user_id === "number" &&
    typeof item.application_count === "number" &&
    typeof item.applications_today === "number"
  );
}

export function isUsersApplicationStatsPayload(
  payload: Record<string, unknown>,
): payload is UsersApplicationStatsPayload {
  return (
    Array.isArray(payload.users) &&
    payload.users.every(isUserApplicationStatsItem) &&
    typeof payload.applications_today_total === "number"
  );
}

export function isTopApplicantsPayload(
  payload: Record<string, unknown>,
): payload is TopApplicantsPayload {
  return (
    Array.isArray(payload.applicants) &&
    payload.applicants.every(isUserApplicationStatsItem) &&
    typeof payload.applications_today_total === "number"
  );
}

export function formatUserUpdatedToast(payload: UserUpdatedPayload): string {
  const who = payload.full_name?.trim() || payload.email?.trim();
  if (payload.approval_status === "pending") {
    return who ? `${who} is waiting for approval.` : "A new user is waiting for approval.";
  }
  return who ? `${who} profile updated.` : "User profile updated.";
}

export function formatJobsIngestSummary(payload: JobsIngestedPayload): string {
  if (payload.added > 0) {
    return `${payload.added} new job${payload.added === 1 ? "" : "s"} added`;
  }
  return "No new jobs added";
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
      }
      break;
    case "users.application_stats.updated":
      if (isUsersApplicationStatsPayload(event.payload)) {
        dispatchRealtimeUsersApplicationStatsUpdated(event.payload);
      }
      break;
    case "analytics.top_applicants.updated":
      if (isTopApplicantsPayload(event.payload)) {
        dispatchRealtimeTopApplicantsUpdated(event.payload);
      }
      break;
    default:
      break;
  }
}
