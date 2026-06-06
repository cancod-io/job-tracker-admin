import { type NextRequest, NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/api";
import { BACKEND_OFFLINE_MESSAGE, BACKEND_TIMEOUT_MESSAGE } from "@/lib/backend-errors";
import { CORS_HEADERS, optionsResponse } from "@/lib/cors";

type RouteContext = { params: Promise<{ id: string }> };

const UPLOAD_TIMEOUT_MS = 60_000;

function upstreamBase(id: string): string {
  return `${getInternalApiBase()}/api/admin/applications/${id}/files`;
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = req.headers.get("authorization");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

  try {
    const res = await fetch(upstreamBase(id), {
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

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const auth = req.headers.get("authorization");
  const contentType = req.headers.get("content-type");
  const body = await req.arrayBuffer();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const res = await fetch(upstreamBase(id), {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body,
      cache: "no-store",
      signal: ctrl.signal,
    });
    const resBody = await res.text();
    return new NextResponse(resBody, {
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
