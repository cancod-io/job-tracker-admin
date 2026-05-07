/** Abortable fetch so a bad API host cannot strand the UI in a loading state forever. */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 12_000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
