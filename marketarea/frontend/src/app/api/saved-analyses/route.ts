import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";

  // Re-encode JWT for backend
  const jwt = await encodeJwt(token);

  const res = await fetch(
    `${BACKEND_URL}/api/saved-analyses?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${jwt}` },
    }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const jwt = await encodeJwt(token);

  const res = await fetch(`${BACKEND_URL}/api/saved-analyses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

async function encodeJwt(token: Record<string, unknown>): Promise<string> {
  const jsonwebtoken = (await import("jsonwebtoken")).default;
  return jsonwebtoken.sign(
    {
      sub: token.sub,
      email: token.email,
      name: token.name,
      picture: token.picture,
    },
    process.env.NEXTAUTH_SECRET!,
    { algorithm: "HS256", expiresIn: "1h" }
  );
}
