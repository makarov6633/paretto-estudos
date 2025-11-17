import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value:
              process.env.NODE_ENV === "production" ? "DENY" : "SAMEORIGIN",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Note: adjust CSP as needed for your app features
          // A relaxed default that still blocks most injections
          (() => {
            const base = [
              "default-src 'self'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://storage.googleapis.com https://images.unsplash.com https://*.stripe.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              process.env.NODE_ENV === "production"
                ? "frame-ancestors 'none'"
                : "frame-ancestors 'self'",
            ];
            const script =
              process.env.NODE_ENV === "production"
                ? "script-src 'self' https://js.stripe.com"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com"; // dev convenience
            const value = [script, ...base].join("; ");
            return { key: "Content-Security-Policy", value };
          })(),
          // HSTS only when behind HTTPS in production
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=15552000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
