import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to THIS folder so Next.js stops inferring it one
  // level up (a stray package-lock.json lives in the parent) and stops walking
  // toward drive roots on startup. Must be an absolute path.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

// const nextConfig: NextConfig = {
//   async rewrites() {
//     return [
//       {
//         source: '/api/:path*',
//         destination: 'http://localhost:3003/:path*', // Aapka backend port
//       },
//     ];
//   },
// };
// export default nextConfig;
