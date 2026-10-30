import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { assetId: string } },
) {
  const match = params.assetId.match(/^video-([a-f0-9]{16})$/);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const [, id] = match;
  const range = request.headers.get("range");
  const rawBackendUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api";
  const cleanUrl = rawBackendUrl.trim().replace(/\/$/, "");
  const backendApiUrl = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
  let response: Response;
  try {
    response = await fetch(`${backendApiUrl}/videos/local/${id}/stream`, {
      headers: range ? { Range: range } : undefined,
      cache: "no-store",
    });
  } catch (error) {
    console.error("Unable to reach the approved local video stream.", error);
    return NextResponse.json(
      { detail: "The video stream is temporarily unavailable." },
      { status: 502 },
    );
  }

  const headers = new Headers();
  for (const header of [
    "accept-ranges",
    "cache-control",
    "content-length",
    "content-range",
    "content-type",
  ]) {
    const value = response.headers.get(header);
    if (value) headers.set(header, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
