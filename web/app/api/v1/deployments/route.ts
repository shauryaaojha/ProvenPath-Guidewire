import { NextRequest, NextResponse } from 'next/server';
import { PcManifest } from '@/lib/contracts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const executionId = body.executionId || 'exec-8fee9178-fcb0-45e7-b772-a28a406a3b0f';
    const deploymentId = '3f1c2d4e-' + Math.random().toString(36).substring(2, 6) + '-4000-8000-000000000d3e';

    const manifest: PcManifest = {
      productCode: 'SMCyber',
      files: [
        { path: 'modules/configuration/config/resources/productmodel/products/SMCyber/SMCyber.xml', sha256: '9f83ea012bcfe8944510012baac489110432f89104bd194017bb58012da619a1' },
        { path: 'modules/configuration/config/resources/productmodel/policylinepatterns/GLLine/coveragepatterns/SMCyberDataBreachCov.xml', sha256: '4c12009ab58eef71410984da0018593aa716301beaf8263910bb47291738268e' },
        { path: 'modules/configuration/config/resources/productmodel/policylinepatterns/GLLine/coveragepatterns/SMCyberPrivacyLiabilityCov.xml', sha256: '7b310928eac19405627718991204bad895710294821aef719001bca0918451f2' },
        { path: 'modules/configuration/config/resources/productmodel/policylinepatterns/GLLine/coveragepatterns/SMCyberExtortionCov.xml', sha256: '2d54ff89100234a47895018cb1740924ea175b91873024856102be84719014aa' },
        { path: 'modules/configuration/config/resources/productmodel/policylinepatterns/GLLine/coveragepatterns/SMCyberBusinessInterruptionCov.xml', sha256: '6a99471940195e84001bca81924510baf718294628100bb4817290019485123c' },
      ],
      verdictHash: 'bd62e7b420e60b3871632bd3a73ff191af00c23b91893474fb509680e9393683',
      gateToken: 'pp_gt_hmac_8a9f24cb71092e0081d45ff8021c4e7a',
      reviewId: '9addc6e6-67e9-4fa5-98a0-2d83966cfe23',
      reviewer: 'A. Mehta — Compliance Reviewer',
      termRanges: [
        { patternCode: 'SMCyberExtortionCov', termCode: 'Limit', min: 0, max: 2500000, ruleCode: 'CYB-RNG-002' },
        { patternCode: 'SMCyberBusinessInterruptionCov', termCode: 'WaitingPeriod', min: 8, max: 72, ruleCode: 'CYB-RNG-004' },
        { patternCode: 'SMCyberDataBreachCov', termCode: 'Deductible', min: '1%', max: '10%', ruleCode: 'CYB-RNG-003' },
      ],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      deploymentId,
      executionId,
      status: 'queued',
      manifest,
      packageBytes: 6144,
      targetPolicyCenterUrl: process.env.NEXT_PUBLIC_PC_URL || 'http://localhost:8180/pc',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create deployment' }, { status: 500 });
  }
}
