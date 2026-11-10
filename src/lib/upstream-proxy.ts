/**
 * Runtime reverse-proxy to the TrackCod API.
 * Reads API_INTERNAL_URL on each request (Docker-friendly — no rebuild to change upstream).
 */
import { type NextRequest, NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { BACKEND_OFFLINE_MESSAGE, BACKEND_TIMEOUT_MESSAGE } from "@/lib/backend-errors";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function filterRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  // Mark traffic as admin portal so the API can gate signup/login to BOOTSTRAP_ADMIN_EMAILS.
  headers.set("X-TrackCod-Client", "admin");
  return headers;
}

function filterResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  upstream.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    // Let Next set content-encoding/length from the body we forward as text/buffer.
    if (lower === "content-encoding") return;
    headers.set(key, value);
  });
  return headers;
}

export async function proxyToBackend(
  req: NextRequest,
  /** Path after API root, e.g. `auth/login` for `/api/v1/auth/login`. */
  apiPath: string,
  /** `/api/v1` or `/api/admin` */
  apiPrefix: "/api/v1" | "/api/admin",
): Promise<NextResponse> {
  const base = getInternalApiBase();
  const path = apiPath.replace(/^\/+/, "");
  const search = req.nextUrl.search;
  const upstreamUrl = `${base}${apiPrefix}/${path}${search}`;

  const method = req.method.toUpperCase();
  const headers = filterRequestHeaders(req);
  const hasBody = method !== "GET" && method !== "HEAD";

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);

  try {
    const body = hasBody ? await req.arrayBuffer() : undefined;
    const res = await fetch(upstreamUrl, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: ctrl.signal,
    });

    const outHeaders = filterResponseHeaders(res.headers);
    if (!outHeaders.has("Content-Type") && res.headers.get("content-type")) {
      outHeaders.set("Content-Type", res.headers.get("content-type")!);
    }

    if (res.status === 204 || res.status === 205 || res.status === 304) {
      return new NextResponse(null, {
        status: res.status,
        statusText: res.statusText,
        headers: outHeaders,
      });
    }

    const payload = await res.arrayBuffer();
    return new NextResponse(payload, {
      status: res.status,
      statusText: res.statusText,
      headers: outHeaders,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ detail: BACKEND_TIMEOUT_MESSAGE }, { status: 504 });
    }
    const detail =
      process.env.NODE_ENV === "production"
        ? BACKEND_OFFLINE_MESSAGE
        : `${BACKEND_OFFLINE_MESSAGE} (upstream ${upstreamUrl}: ${
            err instanceof Error ? err.message : "unknown error"
          })`;
    return NextResponse.json({ detail }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
