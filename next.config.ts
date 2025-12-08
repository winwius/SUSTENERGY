import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // basePath: '/ENERGYAUDIT',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
