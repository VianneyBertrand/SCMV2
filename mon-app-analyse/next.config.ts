import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Only set workspace root paths when NOT on Vercel (avoids path duplication issue)
  ...(process.env.VERCEL ? {} : {
    outputFileTracingRoot: path.join(__dirname, '..'),
    turbopack: {
      root: path.join(__dirname, '..'),
    },
  }),

  // Transpile recharts packages for Next.js 15+ compatibility
  transpilePackages: ['recharts', 'recharts-scale', 'd3-scale', 'd3-shape'],

  // Performance optimizations
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tooltip',
      'date-fns',
    ],

    // Use webpack build worker for faster builds
    webpackBuildWorker: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
