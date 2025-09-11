import { NextRequest, NextResponse } from 'next/server';
import { initializeServer } from '@/lib/init';
import logger from '@/lib/logger';

export async function middleware(request: NextRequest) {
  try {
    logger.info('Initializing server via middleware...');
    await initializeServer();
    logger.info('Server initialization completed via middleware');
  } catch (error) {
    logger.error('Failed to initialize server via middleware', {
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue with request even if initialization fails
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/database/import/workflow/start'
  ],
};