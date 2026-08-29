import type { NextConfig } from "next";

// NOTE: response headers (incl. CSP) are NOT applied under `output: 'export'`
// — the real headers ship via `public/_headers` (Cloudflare Pages format).
// remotePatterns are meaningless with unoptimized images, but remote image
// hosts must still be allowed by the CSP in `public/_headers`.
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
