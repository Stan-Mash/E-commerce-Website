// @ts-check
const { withSentryConfig } = require("@sentry/nextjs");
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // Admin routes must NEVER be served from SW cache — always go to network
      // so authentication (cookies, middleware redirects) works correctly.
      urlPattern: /\/admin(\/|$)/,
      handler: "NetworkOnly",
    },
    {
      // Admin API routes — also never cache
      urlPattern: /\/api\/admin\//,
      handler: "NetworkOnly",
    },
    {
      // App shell — cache first
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      // Product images/videos via Cloudinary — stale while revalidate
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "cloudinary-media",
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Product API — network first with 5s timeout
      urlPattern: /^https?:\/\/.*\/api\/products.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-products",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 6 months, extend after confirming HTTPS-only works across subdomains
          { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: blob: res.cloudinary.com images.unsplash.com *.supabase.co",
              "media-src 'self' blob: res.cloudinary.com *.supabase.co",
              "connect-src 'self' *.supabase.co *.sentry.io https://api.resend.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// Sentry wraps the config for runtime error monitoring. With no SENTRY_DSN /
// SENTRY_AUTH_TOKEN set, init is a no-op and source-map upload is skipped.
module.exports = withSentryConfig(withPWA(nextConfig), {
  silent: true,
  disableLogger: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});

