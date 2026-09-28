'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  Award,
  Globe,
} from 'lucide-react';

interface PitchDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    slideNumber: 1,
    title: 'THE CORE INSURANCE CHALLENGE',
    subtitle: 'High friction, slow product launches, and the risk of hallucination',
    icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
    bullets: [
      {
        heading: '3 to 6 Months Time-to-Market',
        desc: 'New insurance products take quarters to configure, validate, and publish through legacy product models.',
      },
      {
        heading: 'The GenAI Hallucination Barrier',
        desc: 'LLMs hallucinate compliance, invent illegal coverage sublimits, and cannot be trusted with regulatory money fields.',
      },
      {
        heading: 'Regulatory Liability in India (IRDAI / CERT-In)',
        desc: 'Inadvertently violating CERT-In 6-hour reporting or IRDAI extortion ceilings exposes carriers to severe regulatory penalties.',
      },
    ],
    callout: 'Carriers cannot risk deploying probabilistic LLM outputs into core PolicyCenter instances.',
  },
  {
    slideNumber: 2,
    title: 'THE PROVENPATH THESIS',
    subtitle: 'LLM proposes, Gosu verifies — Zero AI slop reaches PolicyCenter',
    icon: <Cpu className="w-8 h-8 text-cyan-400" />,
    bullets: [
      {
        heading: 'Separation of Generation and Verification',
        desc: 'The LLM planner operates strictly behind a compiler boundary. It never sees or touches the verdict code.',
      },
      {
        heading: 'Deterministic Gosu Rule Engine',
        desc: '23 curated IRDAI-style constraints evaluate across 6 mathematical layers: TYPE, RANGE, CONSISTENCY, RULE_MATCH, SOURCE, and GROUNDING.',
      },
      {
        heading: 'Automated Repair Loop',
        desc: 'When an extortion sublimit fails, the engine feeds the exact mathematical delta back to the planner to self-correct.',
      },
    ],
    callout: 'Mathematical determinism: identical proposals produce identical verdict hashes 100% of the time.',
  },
  {
    slideNumber: 3,
    title: 'THE THREE-GATE ARCHITECTURE',
    subtitle: 'Three gates in three places guaranteeing end-to-end security',
    icon: <Layers className="w-8 h-8 text-purple-400" />,
    bullets: [
      {
        heading: 'Gate 1: Pre-Commit Gate (ProvenPath Backend)',
        desc: 'Evaluates the 23-rule graph. If ANY rule fails or requires review, ZERO files are generated or written.',
      },
      {
        heading: 'Gate 2: Signed Manifest & VM Agent',
        desc: 'Packages carry provenpath-manifest.json with HMAC tokens and SHA256 fingerprints re-checked on the VM before installation.',
      },
      {
        heading: 'Gate 3: Runtime Gate Inside PolicyCenter',
        desc: 'ProvenPathValidation.gs plugin blocks manual human typing in PC if coverage terms exceed verified manifest ranges.',
      },
    ],
    callout: 'Even a human underwriter typing directly in the PolicyCenter UI cannot bypass the verified envelope.',
  },
  {
    slideNumber: 4,
    title: 'THE LIVE DEMO WALKTHROUGH',
    subtitle: 'From a single sentence prompt to a live PolicyCenter 10 product',
    icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
    bullets: [
      {
        heading: '1. The Natural Language Prompt',
        desc: '"Cyber insurance for Indian startups, up to ₹50L coverage" decomposes into SMCyber on GLLine.',
      },
      {
        heading: '2. The Blocked Moment (CYB-RNG-002)',
        desc: 'The extortion sublimit of ₹40L fails the 50% ceiling (₹25L). The graph turns red; 0 files written to PC.',
      },
      {
        heading: '3. Auto-Repair & Human Sign-off',
        desc: 'Planner repairs limit to ₹20L. All 23 rules pass. Corporate reviewer A. Mehta signs the compliance release.',
      },
    ],
    callout: 'The full pipeline deploys to PolicyCenter 10 on the Guidewire cloud VM in real time.',
  },
  {
    slideNumber: 5,
    title: 'PROVEN BENCHMARKS & EVALUATION',
    subtitle: 'Zero false-pass rate with mathematical rigor',
    icon: <Award className="w-8 h-8 text-amber-400" />,
    bullets: [
      {
        heading: 'False-Pass Rate: 0.0% (0 / 20)',
        desc: 'Across all test corpus items, zero non-compliant or hallucinated proposals were ever passed.',
      },
      {
        heading: 'Determinism: 50 / 50 Identical Verdict Hashes',
        desc: 'Fifty repeated runs against the same proposal generated identical SHA256 hashes with zero drift.',
      },
      {
        heading: 'Cycle Time: ~3 Weeks to 3.4 Seconds',
        desc: 'Replaces weeks of cross-departmental underwriting meetings with instant mathematical assurance.',
      },
    ],
    callout: '100% statutory provenance completeness backed by byte-exact SHA256 citations.',
  },
  {
    slideNumber: 6,
    title: 'ENTERPRISE ROADMAP & EXPANSION',
    subtitle: 'Scaling ProvenPath across the global insurance lifecycle',
    icon: <Globe className="w-8 h-8 text-blue-400" />,
    bullets: [
      {
        heading: 'Dedicated SMCyberLine via APD',
        desc: 'Moving from GLLine overlay to a native Advanced Product Designer (APD) cyber line.',
      },
      {
        heading: 'Multi-Jurisdictional Regulatory Ingestion',
        desc: 'Automated legal crawler for IRDAI, NAIC (US), and EIOPA (EU) statutory gazettes.',
      },
      {
        heading: 'Automated Rate Book Rating Extension',
        desc: 'Automatic rating factor and rate book generation for real-time quotation in PolicyCenter.',
      },
    ],
    callout: 'The foundational trust layer for agentic insurance configuration in Guidewire InsuranceSuite.',
  },
];

export function PitchDeckModal({ isOpen, onClose }: PitchDeckModalProps) {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-700 rounded-2xl max-w-4xl w-full p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] text-slate-200 flex flex-col justify-between min-h-[580px]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-bold">
              SLIDE {slide.slideNumber} OF {SLIDES.length}
            </span>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              PROVENPATH HACKATHON PITCH DECK
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="my-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
              {slide.icon}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight font-mono">
                {slide.title}
              </h1>
              <p className="text-sm text-cyan-300 font-medium mt-1">
                {slide.subtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {slide.bullets.map((b, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="font-mono text-xs font-bold text-slate-200">
                  {b.heading}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 text-xs font-mono text-center">
            💡 {slide.callout}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-xs font-mono text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlide === i ? 'bg-cyan-400 w-6' : 'bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentSlide(prev => Math.min(SLIDES.length - 1, prev + 1))}
            disabled={currentSlide === SLIDES.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-xs font-mono text-slate-300"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
