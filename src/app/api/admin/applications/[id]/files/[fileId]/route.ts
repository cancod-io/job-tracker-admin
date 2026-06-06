import { type NextRequest, NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { BACKEND_OFFLINE_MESSAGE, BACKEND_TIMEOUT_MESSAGE } from "@/lib/backend-errors";
import { CORS_HEADERS, optionsResponse } from "@/lib/cors";

type RouteContext = { params: Promise<{ id: string; fileId: string }> };

function upstreamFile(id: string, fileId: string): string {
  return `${getInternalApiBase()}/api/admin/applications/${id}/files/${fileId}`;
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id, fileId } = await ctx.params;
  const auth = req.headers.get("authorization");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

  try {
    const res = await fetch(upstreamFile(id, fileId), {
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: "no-store",
      signal: ctrl.signal,
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
        ...CORS_HEADERS,
      },
    });
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

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { id, fileId } = await ctx.params;
  const auth = req.headers.get("authorization");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

  try {
    const res = await fetch(upstreamFile(id, fileId), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return new NextResponse(null, { status: res.status, headers: CORS_HEADERS });
    }
    const body = await res.text();
    return new NextResponse(body || null, {
      status: res.status,
      headers: {
        ...(body ? { "Content-Type": res.headers.get("content-type") ?? "application/json" } : {}),
        ...CORS_HEADERS,
      },
    });
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
