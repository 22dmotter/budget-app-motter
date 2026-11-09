import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@motter/shared", "@motter/api-client"],
  reactStrictMode: true,
};

export default nextConfig;
