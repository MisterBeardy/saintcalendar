import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, strictRateLimit } from '@/lib/rate-limit'
import logger from '@/lib/logger'

export default withAuth(
  function middleware(req: NextRequest) {
    // Apply rate limiting
    let rateLimitResult = null

    // Stricter rate limiting for sensitive operations
    if (req.nextUrl.pathname.includes('/export') ||
        req.nextUrl.pathname.includes('/import') ||
        req.method === 'POST') {
      rateLimitResult = strictRateLimit(req)
    } else {
      rateLimitResult = rateLimit(req)
    }

    if (rateLimitResult) {
      return rateLimitResult
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // TEMPORARY: Skip authentication for workflow and zip import endpoints testing
        if (req.nextUrl.pathname === '/api/database/import/workflow/start' ||
            req.nextUrl.pathname.startsWith('/api/database/import/zip/')) {
          return true
        }
        // Protect API routes that require authentication
        if (req.nextUrl.pathname.startsWith('/api/database/') ||
            req.nextUrl.pathname.startsWith('/api/import/') ||
            req.nextUrl.pathname.startsWith('/api/pending-changes') ||
            req.nextUrl.pathname.startsWith('/api/pending-location-changes')) {
          return !!token
        }
        return true
      }
    }
  }
)

export const config = {
  matcher: [
    '/api/:path*'
  ]
}