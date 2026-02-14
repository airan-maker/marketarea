import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  // Test backend connectivity
  let backendStatus = "unknown";
  let backendDetail = "";
  try {
    const res = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(5000) });
    backendStatus = res.ok ? "connected" : `error (${res.status})`;
    backendDetail = await res.text().catch(() => "");
  } catch (e) {
    backendStatus = "unreachable";
    backendDetail = String(e);
  }

  // Test backend API
  let apiStatus = "unknown";
  let apiDetail = "";
  try {
    const res = await fetch(`${backendUrl}/api/industries`, { signal: AbortSignal.timeout(5000) });
    apiStatus = res.ok ? "connected" : `error (${res.status})`;
    apiDetail = await res.text().catch(() => "");
    if (apiDetail.length > 200) apiDetail = apiDetail.substring(0, 200) + "...";
  } catch (e) {
    apiStatus = "unreachable";
    apiDetail = String(e);
  }

  return NextResponse.json({
    env: {
      BACKEND_URL: backendUrl,
      GOOGLE_MAPS_KEY: googleMapsKey ? `${googleMapsKey.substring(0, 10)}...` : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    },
    backend: {
      health: backendStatus,
      healthDetail: backendDetail,
      api: apiStatus,
      apiDetail: apiDetail,
    },
  });
}
