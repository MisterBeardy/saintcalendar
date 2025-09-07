import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../lib/generated/prisma';
import { normalizeToMonthDay, convertToNumericDate, detectDateFormat } from '../../../../lib/utils';

const prisma = new PrismaClient();

interface GenerateRequest {
  locationId?: string;
  saintId?: string;
  saintNumber?: string;
  force?: boolean; // If true, recreate existing events
}


export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { locationId, saintId, saintNumber, force = false } = body;

    console.log(`[DEBUG] Event generation request:`, { locationId, saintId, saintNumber, force });

    // Build where clause for saints
    const where: any = {};
    if (locationId) where.locationId = locationId;
    if (saintId) where.id = saintId;
    if (saintNumber) where.saintNumber = saintNumber;

    // Fetch saints matching criteria
    const saints = await prisma.saint.findMany({
      where,
      include: {
        location: true,
        years: true // Include historical data
      }
    });

    console.log(`[DEBUG] Found ${saints.length} saints matching criteria`);

    if (saints.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No saints found matching the criteria',
        eventsGenerated: 0
      }, { status: 404 });
    }

    let eventsGenerated = 0;
    const errors: string[] = [];

    // Log sample saint date formats
    if (saints.length > 0) {
      console.log(`[DEBUG] Sample saint date formats:`);
      saints.slice(0, 5).forEach(saint => {
        console.log(`  Saint ${saint.saintNumber}: "${saint.saintDate}" (format: ${detectDateFormat(saint.saintDate)})`);
      });
    }

    for (const saint of saints) {
      try {
        console.log(`[DEBUG] Processing saint ${saint.saintNumber} with date: "${saint.saintDate}"`);

        // Parse saintDate using normalization utility
        const numericDate = convertToNumericDate(saint.saintDate);
        if (numericDate === null) {
          console.log(`[DEBUG] Date format issue for ${saint.saintNumber}: "${saint.saintDate}" (detected as ${detectDateFormat(saint.saintDate)})`);
          errors.push(`Invalid saintDate format for ${saint.saintNumber}: ${saint.saintDate}`);
          continue;
        }
        const month = Math.floor(numericDate / 100);
        const day = numericDate % 100;
        const currentYear = new Date().getFullYear();
        const date = currentYear * 10000 + numericDate;
        console.log(`[DEBUG] Parsed date for ${saint.saintNumber}: ${date} (month: ${month}, day: ${day}, year: ${currentYear}) - original numericDate: ${numericDate}`);

        // Find historical data - use most recent year if current year not available
        let historicalData = saint.years.find(year => year.year === currentYear);
        if (!historicalData && saint.years.length > 0) {
          // Use the most recent historical year
          historicalData = saint.years.sort((a, b) => b.year - a.year)[0];
          console.log(`[DEBUG] Using historical data from year ${historicalData.year} for saint ${saint.saintNumber} (current year ${currentYear} not found)`);
        } else {
          console.log(`[DEBUG] Found historical data for ${saint.saintNumber} year ${currentYear}:`, historicalData ? 'Yes' : 'No');
        }

        // Prepare event data with historical information
        const eventData = {
          date,
          title: `Generated Feast of ${saint.saintName}`,
          locationId: saint.locationId,
          saintNumber: saint.saintNumber,
          saintedYear: saint.saintYear,
          month,
          saintName: saint.saintName,
          realName: saint.name,
          eventType: 'generated',
          saintId: saint.id,
          year: currentYear,
          beers: historicalData?.tapBeerList?.length || 0,
          burgers: historicalData?.burger ? 1 : 0,
          tapBeers: historicalData?.tapBeerList?.length || 0,
          canBottleBeers: historicalData?.canBottleBeerList?.length || 0,
          burger: historicalData?.burger || null,
          facebookEvent: historicalData?.facebookEvent || null,
          sticker: historicalData?.sticker || null,
          tapBeerList: historicalData?.tapBeerList || [],
          canBottleBeerList: historicalData?.canBottleBeerList || [],
        };

        // Check if event already exists
        const existingEvent = await prisma.event.findFirst({
          where: {
            saintId: saint.id,
            date,
            eventType: 'generated'
          }
        });

        if (existingEvent && !force) {
          continue; // Skip if exists and not forcing
        }

        if (existingEvent && force) {
          // Update existing
          await prisma.event.update({
            where: { id: existingEvent.id },
            data: eventData
          });
        } else {
          // Create new
          await prisma.event.create({
            data: eventData
          });
        }
        eventsGenerated++;
      } catch (error) {
        errors.push(`Failed to generate event for saint ${saint.saintNumber}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${eventsGenerated} events`,
      eventsGenerated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Event generation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      eventsGenerated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Event generation endpoint ready for POST requests',
    supportedMethods: ['POST'],
    endpoint: '/api/events/generate',
    description: 'Generate events for saints based on filters. POST with { locationId?, saintId?, saintNumber?, force? }'
  });
}