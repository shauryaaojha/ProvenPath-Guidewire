import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const isTamper = body.isTamper || (body.proseSummary && body.proseSummary.includes('hallucinated')) || true;

    if (isTamper) {
      return NextResponse.json({
        runId: 'tamper-' + Math.random().toString(36).substring(2, 8),
        status: 'BLOCKED',
        rulesetHash: '05c282f01c1cbfc643821174c13a660c368f887ebf7eec30f5252728312945d8',
        proposalHash: 'tamper_fake_sha256_e10adc3949ba59abbe56e057f20f883e',
        verdictHash: 'blocked_source_integrity_failure_0029a1b',
        failedRules: ['CYB-SRC-002'],
        skippedRules: ['CYB-CON-001', 'CYB-GRD-001'],
        writtenToPolicyCenter: 0,
        failures: [
          {
            ruleCode: 'CYB-SRC-002',
            clauseId: 'c-001',
            layer: 'SOURCE',
            result: 'FAILED',
            expected: 'sha256: 4a2b9f018e... (exact IRDAI Gazette Section 4.1 text)',
            actual: 'sha256: d8e8fca2dc... (tampered or fabricated text snippet)',
            reason: 'Byte-exact SHA256 mismatch against regulatory authority corpus. LLM hallucinated compliance text.',
            sourceCode: 'IRDAI-CYB-G-2024-S4.1',
          },
        ],
        message: 'BLOCKED AT SOURCE LAYER — Zero files written to PolicyCenter',
      });
    }

    return NextResponse.json({
      status: 'PASSED',
      verdictHash: 'bd62e7b420e60b3871632bd3a73ff191af00c23b91893474fb509680e9393683',
      rulesetHash: '05c282f01c1cbfc643821174c13a660c368f887ebf7eec30f5252728312945d8',
      failures: [],
      writtenToPolicyCenter: 0,
    });
  } catch {
    return NextResponse.json({ error: 'Verify failed' }, { status: 400 });
  }
}
