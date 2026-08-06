import type { NextConfig } from "next";

// Security headers — design package Section 10.6. Applied to every route.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Stripe.js + Payment Element need their own script/frame/connect origins.
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "connect-src 'self' https://api.stripe.com",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
    ].join("; "),
  },
  // Only meaningful over HTTPS in production; harmless locally over HTTP.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
