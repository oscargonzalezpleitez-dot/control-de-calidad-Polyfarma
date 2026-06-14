/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone solo para Docker. Vercel no lo necesita (lo gestiona internamente).
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '*.railway.app' },
      { protocol: 'https', hostname: '*.vercel.app' },
      { protocol: 'https', hostname: '*.up.railway.app' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
