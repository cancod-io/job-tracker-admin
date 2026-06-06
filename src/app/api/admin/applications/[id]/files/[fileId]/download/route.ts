import { type NextRequest, NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { BACKEND_OFFLINE_MESSAGE, BACKEND_TIMEOUT_MESSAGE } from "@/lib/backend-errors";
import { CORS_HEADERS, optionsResponse } from "@/lib/cors";

type RouteContext = { params: Promise<{ id: string; fileId: string }> };

const DOWNLOAD_TIMEOUT_MS = 60_000;

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id, fileId } = await ctx.params;
  const upstream = `${getInternalApiBase()}/api/admin/applications/${id}/files/${fileId}/download`;
  const auth = req.headers.get("authorization");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(upstream, {
      headers: {
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: "no-store",
      signal: ctrl.signal,
    });
    const body = await res.arrayBuffer();
    const headers = new Headers(CORS_HEADERS);
    const contentType = res.headers.get("content-type");
    const disposition = res.headers.get("content-disposition");
    const contentLength = res.headers.get("content-length");
    if (contentType) headers.set("Content-Type", contentType);
    if (disposition) headers.set("Content-Disposition", disposition);
    if (contentLength) headers.set("Content-Length", contentLength);
    return new NextResponse(body, { status: res.status, headers });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { detail: BACKEND_TIMEOUT_MESSAGE },
        { status: 504, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      { detail: BACKEND_OFFLINE_MESSAGE },
      { status: 502, headers: CORS_HEADERS },
    );
  } finally {
    clearTimeout(timer);
  }
}
