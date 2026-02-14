import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawBackendUrl = process.env.BACKEND_URL;
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const resolvedUrl = rawBackendUrl || rawApiUrl || "http://localhost:8000";
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  // Test backend connectivity
  let backendHealth = "unknown";
  let backendDetail = "";
  try {
    const res = await fetch(`${resolvedUrl}/health`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    backendHealth = res.ok ? "connected" : `error (${res.status})`;
    backendDetail = await res.text().catch(() => "");
  } catch (e) {
    backendHealth = "unreachable";
    backendDetail = String(e);
  }

  return NextResponse.json({
    env_raw: {
      BACKEND_URL: rawBackendUrl ?? "(not set)",
      NEXT_PUBLIC_API_URL: rawApiUrl ?? "(not set)",
      NEXT_PUBLIC_GOOGLE_MAPS_KEY: googleMapsKey ? `${googleMapsKey.substring(0, 10)}...` : "(not set)",
      NODE_ENV: process.env.NODE_ENV ?? "(not set)",
    },
    resolved_backend_url: resolvedUrl,
    backend_health: backendHealth,
    backend_detail: backendDetail,
    hint: rawBackendUrl
      ? "BACKEND_URL is set correctly"
      : "BACKEND_URL is NOT set. Add it in Railway > Frontend service > Variables > BACKEND_URL = https://backend-production-15f8.up.railway.app",
  });
}
