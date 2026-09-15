import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // NUI is loaded from a local file, not a real domain - relative asset paths are required.
  assetPrefix: "./",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
