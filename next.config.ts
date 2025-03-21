import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qcqxhnibanpmhlajvhos.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'sandbox.api.pagseguro.com',
      },
      {
        protocol: 'https',
        hostname: 'api.pagbank.com',
      },
    ],
  },
}

export default nextConfig
