import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence warning
  // bodega-app will be deployed separately
  turbopack: {},
};

export default nextConfig;
