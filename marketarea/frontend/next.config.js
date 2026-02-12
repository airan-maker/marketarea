/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return {
      // File-system API routes (/api/auth/*, /api/saved-analyses/*) are handled by Next.js first.
      // Only unmatched /api/* routes fall through to FastAPI.
      fallback: [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
