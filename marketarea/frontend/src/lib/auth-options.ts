import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  jwt: {
    encode: async ({ token }) => {
      return jwt.sign(
        {
          sub: token?.sub,
          email: token?.email,
          name: token?.name,
          picture: token?.picture,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        },
        NEXTAUTH_SECRET,
        { algorithm: "HS256" }
      );
    },
    decode: async ({ token }) => {
      try {
        const decoded = jwt.verify(token!, NEXTAUTH_SECRET, {
          algorithms: ["HS256"],
        }) as jwt.JwtPayload;
        return decoded;
      } catch {
        return null;
      }
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = (profile as { sub?: string }).sub || account.providerAccountId;
        token.email = (profile as { email?: string }).email;
        token.name = (profile as { name?: string }).name;
        token.picture = (profile as { picture?: string }).picture;

        // Ensure user exists in backend
        try {
          await fetch(`${BACKEND_URL}/api/users/ensure`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              google_id: token.sub,
              email: token.email,
              name: token.name,
              profile_image: token.picture,
            }),
          });
        } catch (e) {
          console.error("Failed to ensure user in backend:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
