import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jsonwebtoken = (await import("jsonwebtoken")).default;
  const jwt = jsonwebtoken.sign(
    {
      sub: token.sub,
      email: token.email,
      name: token.name,
      picture: token.picture,
    },
    process.env.NEXTAUTH_SECRET!,
    { algorithm: "HS256", expiresIn: "1h" }
  );

  const res = await fetch(
    `${BACKEND_URL}/api/saved-analyses/${params.id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    }
  );

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
