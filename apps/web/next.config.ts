import type { NextConfig } from "next";

/**
 * Set PAGES_BASE_PATH=/budget-app-motter for the GitHub Pages static export.
 * Local `next dev` / plain `next build` leave this unset so routes stay at /.
 */
const pagesBasePath = process.env.PAGES_BASE_PATH?.replace(/\/$/, "") || "";

const nextConfig: NextConfig = {
  transpilePackages: ["@motter/shared", "@motter/api-client"],
  reactStrictMode: true,
  // Static export so the site can ship on GitHub Pages (API stays separate).
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(pagesBasePath
    ? {
        basePath: pagesBasePath,
        assetPrefix: pagesBasePath,
      }
    : {}),
};

export default nextConfig;
