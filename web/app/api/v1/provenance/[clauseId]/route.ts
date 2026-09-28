import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ProvenanceDetail {
  clauseId: string;
  name: string;
  patternCode: string;
  sourceCode: string;
  sourceTitle: string;
  jurisdiction: string;
  section: string;
  textSnippet: string;
  sha256: string;
  effectiveDate: string;
  ruleCodes: string[];
}

const PROVENANCE_DATA: Record<string, ProvenanceDetail> = {
  'c-001': {
    clauseId: 'c-001',
    name: 'Data Breach Response Coverage',
    patternCode: 'SMCyberDataBreachCov',
    sourceCode: 'IRDAI-CYB-G-2024-S4.1',
    sourceTitle: 'IRDAI Guidelines on Cyber Insurance Products for Small and Medium Enterprises (2024)',
    jurisdiction: 'IN (India)',
    section: 'Section 4.1 (Mandatory First-Party Covers)',
    textSnippet: 'Every SME Cyber Insurance policy shall include at minimum Data Breach Response Coverage (SMCyberDataBreachCov) and Privacy Liability Coverage (SMCyberPrivacyLiabilityCov) as Required coverages.',
    sha256: '4a2b9f018e19284fa00184bba710928eac19405627718991204bad8957102948',
    effectiveDate: '2024-04-01',
    ruleCodes: ['CYB-TYPE-001', 'CYB-TYPE-002', 'CYB-RM-001', 'CYB-SRC-001', 'CYB-SRC-002'],
  },
  'c-002': {
    clauseId: 'c-002',
    name: 'Privacy Liability Coverage',
    patternCode: 'SMCyberPrivacyLiabilityCov',
    sourceCode: 'IRDAI-CYB-G-2024-S4.1',
    sourceTitle: 'IRDAI Guidelines on Cyber Insurance Products for Small and Medium Enterprises (2024)',
    jurisdiction: 'IN (India)',
    section: 'Section 4.1 (Mandatory Third-Party Covers)',
    textSnippet: 'Every SME Cyber Insurance policy shall include at minimum Data Breach Response Coverage (SMCyberDataBreachCov) and Privacy Liability Coverage (SMCyberPrivacyLiabilityCov) as Required coverages.',
    sha256: '4a2b9f018e19284fa00184bba710928eac19405627718991204bad8957102948',
    effectiveDate: '2024-04-01',
    ruleCodes: ['CYB-TYPE-001', 'CYB-TYPE-002', 'CYB-RM-001', 'CYB-SRC-001', 'CYB-SRC-002'],
  },
  'c-003': {
    clauseId: 'c-003',
    name: 'Cyber Extortion Coverage',
    patternCode: 'SMCyberExtortionCov',
    sourceCode: 'IRDAI-CYB-G-2024-S3.4',
    sourceTitle: 'IRDAI Framework for Cyber Risk Underwriting and Sublimit Ceilings (2024)',
    jurisdiction: 'IN (India)',
    section: 'Section 3.4 (Cyber Extortion & Ransom Limits)',
    textSnippet: 'Coverage for cyber extortion and ransom negotiations shall not exceed 50% of the overall aggregate policy limit. Payment of ransom demands shall be conditional on formal notification to Indian law enforcement authorities.',
    sha256: '9f83ea012bcfe8944510012baac489110432f89104bd194017bb58012da619a1',
    effectiveDate: '2024-04-01',
    ruleCodes: ['CYB-TYPE-001', 'CYB-RNG-002', 'CYB-RM-003', 'CYB-SRC-001', 'CYB-SRC-002'],
  },
  'c-004': {
    clauseId: 'c-004',
    name: 'Business Interruption Coverage',
    patternCode: 'SMCyberBusinessInterruptionCov',
    sourceCode: 'IRDAI-CYB-G-2024-S3.3',
    sourceTitle: 'IRDAI Business Continuity and Waiting Period Guidelines (2024)',
    jurisdiction: 'IN (India)',
    section: 'Section 3.3 (Time Element & Waiting Period)',
    textSnippet: 'Business Interruption indemnity periods must mandate a minimum waiting period of no less than 8 hours and no greater than 72 hours before claims trigger.',
    sha256: '12bca0984da0018593aa716301beaf8263910bb47291738268e4c12009ab58ee',
    effectiveDate: '2024-04-01',
    ruleCodes: ['CYB-TYPE-001', 'CYB-RNG-004', 'CYB-SRC-001'],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clauseId: string }> }
) {
  const { clauseId } = await params;
  const detail = PROVENANCE_DATA[clauseId] || PROVENANCE_DATA['c-001'];

  return NextResponse.json(detail);
}
