import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/snaplist",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
