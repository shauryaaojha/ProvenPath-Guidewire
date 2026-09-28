import { NextResponse } from 'next/server';
import { RULES_CATALOG } from '@/lib/rules-catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    rules: RULES_CATALOG,
    count: RULES_CATALOG.length,
    rulesetHash: '05c282f01c1cbfc643821174c13a660c368f887ebf7eec30f5252728312945d8',
  });
}
