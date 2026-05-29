/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Prefer modern formats — smaller LCP/decode with identical visuals.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.bodyworx.in' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.bodyworx.in' },
    ],
  },
  experimental: {
    // Tree-shake heavy barrel imports so only used members ship in the
    // client bundle (smaller JS → faster hydrate/paint). Behaviour-neutral.
    optimizePackageImports: ['framer-motion', '@phosphor-icons/react', 'lucide-react'],
  },
};

module.exports = nextConfig;
