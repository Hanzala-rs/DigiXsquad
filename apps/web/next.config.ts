import path from 'node:path';
import type { NextConfig } from 'next';

// Monorepo root: needed so `output: 'standalone'` traces workspace packages.
const repoRoot = path.join(process.cwd(), '../..');

const nextConfig: NextConfig = {
  // Runs in the Docker stack on the free Oracle Arm VM (see FRONTEND.md), not Vercel.
  // Standalone tracing creates symlinks, which Windows blocks without Developer Mode,
  // so local Windows builds skip it; Docker/CI (Linux) always get standalone output.
  output: process.platform === 'win32' ? undefined : 'standalone',
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  // api-client ships TypeScript sources.
  transpilePackages: ['@digixsquad/api-client'],
  // 90 is used by the hero portrait so the founder photo stays crisp.
  images: { qualities: [75, 90] },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
