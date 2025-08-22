import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sso.hotmart.com',
        port: '',
        pathname: '/themes/custom/images/**',
      },
      {
        protocol: 'https',
        hostname: 'developers.google.com',
        port: '',
        pathname: '/identity/images/**',
      },
    ],
  },
};

export default nextConfig;
