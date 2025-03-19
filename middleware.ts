import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Configuração do Rate Limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Rotas que precisam de rate limit mais restrito
const strictRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '30 s'),
  analytics: true,
  prefix: 'strict_limit',
})

// Rotas que podem ter rate limit mais flexível
const standardRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: true,
  prefix: 'standard_limit',
})

// Configuração do middleware
export const config = {
  // Aplica apenas em rotas específicas que precisam de proteção
  matcher: [
    // Rotas de pagamento (mais restritivas)
    '/api/create-payment/:path*',
    '/api/create-pix-payment/:path*',
    '/api/create-order/:path*',
    // Rotas de cupom (mais flexíveis)
    '/api/validate-coupon/:path*',
    '/api/update-coupon-usage/:path*',
  ],
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Escolhe o rate limiter baseado no tipo de rota
  const isStrictRoute =
    path.includes('/create-payment') ||
    path.includes('/create-pix-payment') ||
    path.includes('/create-order')

  const ratelimit = isStrictRoute ? strictRateLimit : standardRateLimit

  // Rate Limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1'
  const key = `${ip}:${path}`

  const { success, reset, remaining } = await ratelimit.limit(key)

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': reset.toString(),
      },
    })
  }

  // Headers de Segurança e CORS
  const response = NextResponse.next()
  const origin = request.headers.get('origin')

  // Se não houver origin (como em chamadas via Node.js), permite a requisição
  if (!origin) {
    response.headers.set('Access-Control-Allow-Origin', '*')
  } else {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL || '',
      'http://localhost:3000',
    ]

    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else {
      return new NextResponse(null, {
        status: 403,
        statusText: 'Forbidden',
      })
    }
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  )
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )

  // Adiciona headers de rate limit na resposta
  const limit = isStrictRoute ? '10' : '30'
  response.headers.set('X-RateLimit-Limit', limit)
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())

  return response
}
