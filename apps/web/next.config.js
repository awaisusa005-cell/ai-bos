/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ai-bos/ui', '@ai-bos/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;
