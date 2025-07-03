import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "i.ytimg.com",
      "img.youtube.com",
      "igmgr3ejlj7zobya.public.blob.vercel-storage.com", // ✅ 실제 Vercel Blob 호스트
    ],
  },
};

export default nextConfig;
