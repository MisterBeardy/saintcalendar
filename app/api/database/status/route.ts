import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Test connection with a simple query
    await prisma.$queryRaw`SELECT 1`;

    const connectionStatus = 'connected';

    // Get record counts
    const saintsCount = await prisma.saint.count();
    const eventsCount = await prisma.event.count();
    const locationsCount = await prisma.location.count();

    // Get database version
    const versionResult = await prisma.$queryRaw`SELECT version()` as any[];
    const dbVersion = versionResult[0]?.version || 'Unknown';

    // Get database size
    const sizeResult = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database()))` as any[];
    const dbSize = sizeResult[0]?.pg_size_pretty || 'Unknown';

    // Since schema doesn't have updatedAt fields, use N/A for last updated
    const lastUpdated = 'N/A';

    // Check if this looks like a freshly set up database
    const isNewSetup = saintsCount === 0 && eventsCount === 0 && locationsCount === 0;

    const data = {
      connectionStatus,
      setupStatus: isNewSetup ? 'new_setup' : 'configured',
      tables: {
        Saints: { recordCount: saintsCount, lastUpdated },
        Events: { recordCount: eventsCount, lastUpdated },
        Locations: { recordCount: locationsCount, lastUpdated }
      },
      database: {
        version: dbVersion,
        size: dbSize
      }
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Database status error:', error);

    // Check if DATABASE_URL is configured
    const databaseUrl = process.env.DATABASE_URL;
    const setupStatus = databaseUrl ? 'configured_but_error' : 'not_configured';

    return NextResponse.json({
      error: 'Database connection failed',
      connectionStatus: 'disconnected',
      setupStatus,
      tables: {
        Saints: { recordCount: 0, lastUpdated: 'N/A' },
        Events: { recordCount: 0, lastUpdated: 'N/A' },
        Locations: { recordCount: 0, lastUpdated: 'N/A' }
      },
      database: {
        version: 'Unknown',
        size: 'Unknown'
      }
    }, { status: 500 });
  }
}