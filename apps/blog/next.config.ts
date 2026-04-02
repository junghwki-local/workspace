import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drumtin.s3-tastewp.com",
      },
      // 실제 WordPress 호스팅 도메인 추가 시 여기에 넣을 것
    ],
  },
};

export default nextConfig;
