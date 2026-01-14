import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/ENERGYAUDIT_BANKS',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
