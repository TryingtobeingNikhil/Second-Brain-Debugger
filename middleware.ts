import { NextRequest, NextResponse } from 'next/server'

const rateMap = new Map<string, { count: number; resetAt: number }>()

export function middleware(req: NextRequest) {
  // Only apply rate limiting to analyze API routes
  if (!req.nextUrl.pathname.startsWith('/api/analyze')) {
    return NextResponse.next()
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const window = 60_000 // 1 minute
  const limit = 10

  const entry = rateMap.get(ip)

  // No entry or window expired → start fresh
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + window })
    return NextResponse.next()
  }

  // Limit exceeded → return 429
  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  // Under limit → increment and continue
  entry.count++
  return NextResponse.next()
}

export const config = {
  matcher: '/api/analyze/:path*',
}
