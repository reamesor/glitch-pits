/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid aggressive caching of the app shell so users see updates after deploy
  headers: async () => [
    {
      source: "/",
      headers: [
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    },
  ],
};

module.exports = nextConfig;
