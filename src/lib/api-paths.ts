/**
 * TrackCod API path helpers — aligned with OpenAPI `/openapi.json`.
 *
 * Prefix conventions:
 *   /api/v1/...   — versioned user + shared routes
 *   /api/admin/... — admin dashboard routes (Bearer auth)
 */

export const API_PATHS = {
  auth: {
    register: "/api/v1/auth/register",
    login: "/api/v1/auth/login",
    refresh: "/api/v1/auth/refresh",
    me: "/api/v1/auth/me",
    verifyEmail: "/api/v1/auth/verify-email",
    resendVerification: "/api/v1/auth/resend-verification",
    webauthn: {
      registerOptions: "/api/v1/auth/webauthn/register/options",
      registerVerify: "/api/v1/auth/webauthn/register/verify",
      credentials: "/api/v1/auth/webauthn/credentials",
      credentialDelete: (credentialId: number) =>
        `/api/v1/auth/webauthn/credentials/${credentialId}`,
      loginOptions: "/api/v1/auth/webauthn/login/options",
      loginVerify: "/api/v1/auth/webauthn/login/verify",
    },
    face: {
      me: "/api/v1/auth/face/me",
      enroll: "/api/v1/auth/face/enroll",
      loginVerify: "/api/v1/auth/face/login/verify",
    },
  },

  adminUsers: {
    base: "/api/admin/users",
    detail: (userId: number) => `/api/admin/users/${userId}`,
    avatar: (userId: number) => `/api/admin/users/${userId}/avatar`,
    cvDownload: (userId: number, cvId: number) => `/api/admin/users/${userId}/cvs/${cvId}/download`,
    status: (userId: number) => `/api/admin/users/${userId}/status`,
    role: (userId: number) => `/api/admin/users/${userId}/role`,
    approval: (userId: number) => `/api/v1/admin/users/${userId}/approval`,
    resetPassword: (userId: number) => `/api/v1/admin/users/${userId}/reset-password`,
  },

  adminJobs: {
    base: "/api/admin/jobs",
    sources: "/api/admin/jobs/sources",
    applicants: (jobId: number) => `/api/admin/jobs/${jobId}/applicants`,
    detail: (jobId: number) => `/api/admin/jobs/${jobId}`,
  },

  adminJobFetchRuns: {
    base: "/api/admin/job-fetch-runs",
    detail: (runId: number) => `/api/admin/job-fetch-runs/${runId}`,
  },

  jobs: {
    base: "/api/v1/jobs",
    sources: "/api/v1/jobs/sources",
    fetchRuns: "/api/v1/jobs/fetch-runs",
  },

  adminApplications: {
    files: (applicationId: number) => `/api/admin/applications/${applicationId}/files`,
    fileDownload: (applicationId: number, fileId: number) =>
      `/api/admin/applications/${applicationId}/files/${fileId}/download`,
  },

  applicationFiles: {
    base: (applicationId: number) => `/api/v1/applications/${applicationId}/files`,
    detail: (applicationId: number, fileId: number) =>
      `/api/v1/applications/${applicationId}/files/${fileId}`,
    download: (applicationId: number, fileId: number) =>
      `/api/v1/applications/${applicationId}/files/${fileId}/download`,
  },

  adminPermissions: {
    base: "/api/admin/permissions",
    me: "/api/admin/permissions/me",
    user: (userId: number) => `/api/admin/permissions/users/${userId}`,
  },

  adminApiConfig: {
    base: "/api/admin/api-config",
    settings: "/api/admin/api-config/settings",
    settingsGroup: (groupId: string) =>
      `/api/admin/api-config/settings/${encodeURIComponent(groupId)}`,
    keys: "/api/admin/api-config/keys",
    keyActivate: (keyId: number) => `/api/admin/api-config/keys/${keyId}/activate`,
    keyDelete: (keyId: number) => `/api/admin/api-config/keys/${keyId}`,
  },

  adminCompanies: {
    base: "/api/admin/companies",
    detail: (companyId: number) => `/api/admin/companies/${companyId}`,
    export: "/api/admin/companies/export",
    import: "/api/admin/companies/import",
  },

  adminCareerUrls: {
    base: "/api/admin/career-urls",
    detail: (careerUrlId: number) => `/api/admin/career-urls/${careerUrlId}`,
  },

  adminScamUrls: {
    base: "/api/admin/scam-urls",
    detail: (scamUrlId: number) => `/api/admin/scam-urls/${scamUrlId}`,
  },

  adminCredentials: {
    base: "/api/admin/credentials",
    tree: "/api/admin/credentials/tree",
    detail: (credentialId: number) => `/api/admin/credentials/${credentialId}`,
  },

  adminCredentialEmployers: {
    base: "/api/admin/credential-employers",
    detail: (employerId: number) => `/api/admin/credential-employers/${employerId}`,
  },

  adminNotifications: {
    base: "/api/admin/notifications",
    unreadCount: "/api/admin/notifications/unread-count",
    read: (notificationId: number) => `/api/admin/notifications/${notificationId}/read`,
    readAll: "/api/admin/notifications/read-all",
  },

  adminScraperRuns: {
    base: "/api/admin/scraper/runs",
    detail: (runId: string) => `/api/admin/scraper/runs/${encodeURIComponent(runId)}`,
    stop: (runId: string) => `/api/admin/scraper/runs/${encodeURIComponent(runId)}/stop`,
  },

  adminAnalytics: {
    overview: "/api/admin/analytics/overview",
    jobsBreakdown: "/api/admin/analytics/jobs/breakdown",
    jobsTimeseries: "/api/admin/analytics/jobs/timeseries",
    applicationsFunnel: "/api/admin/analytics/applications/funnel",
    applicationsTimeseries: "/api/admin/analytics/applications/timeseries",
    applicationsBySource: "/api/admin/analytics/applications/by-source",
    usersSummary: "/api/admin/analytics/users/summary",
    usersTimeseries: "/api/admin/analytics/users/timeseries",
    userPipeline: (userId: number) => `/api/admin/analytics/users/${userId}/pipeline`,
    fetchRunsSummary: "/api/admin/analytics/fetch-runs/summary",
    fetchRunsTimeseries: "/api/admin/analytics/fetch-runs/timeseries",
    scrapingSummary: "/api/admin/analytics/scraping/summary",
    scrapingTimeseries: "/api/admin/analytics/scraping/timeseries",
    scrapingRuns: "/api/admin/analytics/scraping/runs",
    scrapingIngestHealth: "/api/admin/analytics/scraping/ingest-health",
    workersScraperLogs: "/api/admin/analytics/workers/scraper-logs",
    workersCeleryStatus: "/api/admin/analytics/workers/celery-status",
    targetsSummary: "/api/admin/analytics/targets/summary",
    notificationsSummary: "/api/admin/analytics/notifications/summary",
    health: "/api/admin/analytics/health",
    alerts: "/api/admin/analytics/alerts",
    exportOverview: "/api/admin/analytics/export/overview",
    exportFunnel: "/api/admin/analytics/export/applications-funnel",
    exportScraperRuns: "/api/admin/analytics/export/scraper-runs",
  },
} as const;
