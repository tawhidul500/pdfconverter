import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NOVAPDF_NEXT_DIST_DIR || ".next",
  devIndicators: false,
  allowedDevOrigins: ["172.24.48.1", "172.21.32.1"],
};

export default nextConfig;
