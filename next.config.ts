import type { NextConfig } from "next";

// NOTE: response headers (incl. CSP) are NOT applied under `output: 'export'`
// — the real headers ship via `public/_headers` (Cloudflare Pages format).
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
