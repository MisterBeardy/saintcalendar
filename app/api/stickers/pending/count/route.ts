import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // TODO: Implement sticker pending count
  return NextResponse.json({ count: 0 });
}