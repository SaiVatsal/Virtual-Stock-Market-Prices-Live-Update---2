import { NextResponse } from 'next/server';
import { generateMacroBriefing } from '@/lib/claude';

export const dynamic = 'force-dynamic';

let cachedBriefing: any = null;
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();
  // Cache for 10 minutes unless refreshed via POST
  if (cachedBriefing && now - lastFetchTime < 600000) {
    return NextResponse.json(cachedBriefing);
  }

  const brief = await generateMacroBriefing();
  cachedBriefing = brief;
  lastFetchTime = now;

  return NextResponse.json(brief);
}

export async function POST() {
  // Force refresh
  const brief = await generateMacroBriefing();
  cachedBriefing = brief;
  lastFetchTime = Date.now();

  return NextResponse.json(brief);
}
