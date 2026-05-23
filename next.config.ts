import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns:[
      {
        hostname: "search.brave.com",
      }
    ]
  }
};

export default nextConfig;
