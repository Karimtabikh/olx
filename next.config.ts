import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ["en", "ar"],
    defaultLocale: "en",
  },
};

export default nextConfig;
