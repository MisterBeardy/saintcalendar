import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter
// In production, consider using Redis or a more robust solution
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 100 // requests per window

export function rateLimit(request: NextRequest): NextResponse | null {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`

  const now = Date.now()
  const windowStart = now - WINDOW_MS

  // Clean up old entries
  for (const [k, v] of rateLimitMap.entries()) {
    if (v.resetTime < windowStart) {
      rateLimitMap.delete(k)
    }
  }

  const current = rateLimitMap.get(key)

  if (!current || current.resetTime < windowStart) {
    // First request in window or window expired
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS })
    return null
  }

  if (current.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    const resetTime = new Date(current.resetTime).toISOString()
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again after ${resetTime}`,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': current.resetTime.toString()
        }
      }
    )
  }

  // Increment counter
  current.count++
  rateLimitMap.set(key, current)

  return null
}

// Stricter rate limiting for sensitive operations
export function strictRateLimit(request: NextRequest): NextResponse | null {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `strict:${ip}:${request.nextUrl.pathname}`

  const now = Date.now()
  const windowStart = now - (5 * 60 * 1000) // 5 minutes
  const MAX_STRICT_REQUESTS = 10

  // Clean up old entries
  for (const [k, v] of rateLimitMap.entries()) {
    if (k.startsWith('strict:') && v.resetTime < windowStart) {
      rateLimitMap.delete(k)
    }
  }

  const current = rateLimitMap.get(key)

  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(key, { count: 1, resetTime: now + (5 * 60 * 1000) })
    return null
  }

  if (current.count >= MAX_STRICT_REQUESTS) {
    const resetTime = new Date(current.resetTime).toISOString()
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded for sensitive operation. Try again after ${resetTime}`,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': MAX_STRICT_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': current.resetTime.toString()
        }
      }
    )
  }

  current.count++
  rateLimitMap.set(key, current)

  return null
}