import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  {
    // Generated service-worker output from @ducanh2912/next-pwa (workbox).
    // Minified vendor bundles - linting them produces dozens of meaningless
    // warnings that bury real ones, and they are rewritten on every build.
    ignores: [
      "public/sw.js",
      "public/sw.js.map",
      "public/workbox-*.js",
      "public/workbox-*.js.map",
      "public/fallback-*.js",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Plain CommonJS scripts — next.config.js is loaded via require() by
    // Next itself, and scripts/ are run directly with node, not bundled.
    files: ["next.config.js", "scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
