import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qcqxhnibanpmhlajvhos.supabase.co',
      },
    ],
  },
}

export default nextConfig
