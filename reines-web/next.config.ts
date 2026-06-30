import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    // Allow Next.js Image to serve files from /public/uploads/gallery (local storage)
    localPatterns: [
      { pathname: "/uploads/gallery/**" },
      { pathname: "/uploads/product-images/**" },
      { pathname: "/uploads/homepage-ads/**" },
      { pathname: "/uploads/receipts/**" },
      { pathname: "/logo-icon.png" },
      { pathname: "/logo-loader.png" },
      { pathname: "/logo-full.png" },
      { pathname: "/logo-icon2.png" },
      { pathname: "/logo-procrete.png" },
      { pathname: "/homepage-ads/**" },
      { pathname: "/product-images/**" },
      { pathname: "/about/**" },
    ],
    // Add Cloudinary (or other CDN) domains here when you migrate from local storage:
    // remotePatterns: [
    //   { protocol: "https", hostname: "res.cloudinary.com" },
    // ],
  },
};

export default nextConfig;
