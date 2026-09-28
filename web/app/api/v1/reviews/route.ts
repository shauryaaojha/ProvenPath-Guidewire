import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, decision, reviewer, comment } = body;

    if (decision === 'rejected' && (!comment || comment.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Comment required on rejection' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reviewId: 'rev-' + Math.random().toString(36).substring(2, 9),
      runId: runId || 'f6fa2bbc-4140-4d67-b584-dc712bb81050',
      decision: decision || 'approved',
      reviewer: reviewer || 'A. Mehta — Compliance Reviewer',
      comment: comment || null,
      reviewedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
}
