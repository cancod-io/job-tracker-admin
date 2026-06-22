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
  },

  adminUsers: {
    base: "/api/admin/users",
    detail: (userId: number) => `/api/admin/users/${userId}`,
    avatar: (userId: number) => `/api/admin/users/${userId}/avatar`,
    cvDownload: (userId: number, cvId: number) =>
      `/api/admin/users/${userId}/cvs/${cvId}/download`,
    status: (userId: number) => `/api/admin/users/${userId}/status`,
    role: (userId: number) => `/api/admin/users/${userId}/role`,
    approval: (userId: number) => `/api/v1/admin/users/${userId}/approval`,
    resetPassword: (userId: number) => `/api/v1/admin/users/${userId}/reset-password`,
  },

  adminJobs: {
    base: "/api/admin/jobs",
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
    role: (role: string) => `/api/admin/permissions/${role}`,
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

  adminScraperRuns: {
    base: "/api/admin/scraper/runs",
    detail: (runId: string) => `/api/admin/scraper/runs/${encodeURIComponent(runId)}`,
    stop: (runId: string) => `/api/admin/scraper/runs/${encodeURIComponent(runId)}/stop`,
  },
} as const;
