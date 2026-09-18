/** @type {import('next').NextConfig} */
// CVPro — Next.js config. PWA-ready manifest + strict TS + Strict Mode.
const nextConfig = {
  reactStrictMode: true, // Strict Mode ON per spec

  // Serve the web app manifest so the PWA is installable on phones
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        // Service worker must never be cached by the browser
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

module.exports = nextConfig;
