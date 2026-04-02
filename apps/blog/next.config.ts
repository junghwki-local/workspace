import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drumtin.s3-tastewp.com",
      },
    ],
  },
};

export default nextConfig;
