import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Временно отключаем проверку типов при сборке
    // потому что TypeScript не видит типы Plate.js v53+
  //  ignoreBuildErrors: true,
  },
  async rewrites() {
    const backendUrl =
        process.env.BACKEND_URL || "http://localhost:8080";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;