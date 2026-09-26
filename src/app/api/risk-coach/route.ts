import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { auditRiskBehavior } from '@/lib/risk-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const store = getStore();
  const allTrades = [...store.positions, ...store.history];
  const report = auditRiskBehavior(allTrades);

  return NextResponse.json(report);
}
