import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rawBackendUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api";
  const cleanUrl = rawBackendUrl.trim().replace(/\/$/, "");
  const backendApiUrl = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
  let response: Response;
  try {
    response = await fetch(`${backendApiUrl}/videos?provider=local`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error("Unable to reach the local video library API.", error);
    return NextResponse.json(
      { detail: "The local video library is temporarily unavailable." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { detail: `The local video library returned ${response.status}.` },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json(), {
    headers: { "Cache-Control": "no-store" },
  });
}
