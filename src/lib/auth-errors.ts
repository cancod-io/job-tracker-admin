/** Stable API error codes from backend `AppError`. */

export type ApiAuthErrorShape = {
  error?: { message?: string; code?: string };
};

export function apiErrorMessage(data: ApiAuthErrorShape): string | null {
  const msg = data.error?.message;
  return typeof msg === "string" && msg.length > 0 ? msg : null;
}

export function apiErrorCode(data: ApiAuthErrorShape): string | null {
  const c = data.error?.code;
  return typeof c === "string" && c.length > 0 ? c : null;
}
