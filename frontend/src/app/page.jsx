'use client';

import Link from 'next/link';
import { useAuth } from '../lib/authContext.jsx';
import { Sparkles, ArrowRight, ShieldCheck, Calendar, Brain, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="py-12 space-y-20">
      {/* Hero Header */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Autonomous Interview Intelligence
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Turn any Job Posting into a <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Personalized Interview Prep Kit
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Paste the job description, link the company website, and specify your preparation timeframe.
          Our multi-step autonomous research pipeline extracts requirements, crawls hiring processes, verifies question coverage, and constructs your day-by-day study roadmap.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={user ? '/dashboard' : '/register'}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-base transition-all hover:scale-[1.02]"
          >
            <span>{user ? 'Open Dashboard' : 'Generate Your First Kit'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-700/80 transition flex items-center justify-center"
          >
            Sign In to Existing Kits
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="glass-panel p-6 rounded-2xl space-y-3 border-indigo-500/20">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Autonomous Research Pipeline</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Crawls the company domain, scores and ranks internal links to discover buried hiring pages, handbook blogs, and public interview discussions without hardcoded paths.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-3 border-purple-500/20">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Deterministic Coverage Verification</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Code-level validation verifies all must-have requirements have targeted questions. If gaps exist, an autonomous Second Pass generates missing questions before delivery.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-3 border-pink-500/20">
          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Arithmetic Schedule Allocation</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Pure mathematical allocation distributes material across your exact timeframe (from 1 to 60 days). Harder, high-priority topics land earlier, never the night before.
          </p>
        </div>
      </section>

      {/* Interactive Capabilities Showcase */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border-slate-800 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Complete Toolkit: From Research to Rehearsal
          </h2>
          <p className="text-slate-400 text-sm">
            Everything you need to master your upcoming interview cycle with total confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <h4 className="font-semibold text-white text-sm">The Reshapeable Builder</h4>
            <p className="text-xs text-slate-400">
              Edit questions inline, reorder with ease, and regenerate individual sections while preserving your customizations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-white text-sm">Flashcard Practice Mode</h4>
            <p className="text-xs text-slate-400">
              Active recall player with 3D card flips, confidence ratings, and confidence-weighted session sorting.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-5 h-5 text-pink-400" />
            <h4 className="font-semibold text-white text-sm">AI Mock Interview Simulator</h4>
            <p className="text-xs text-slate-400">
              Simulate interview questions, type your response, and receive detailed STAR method and technical rubric scoring.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="font-semibold text-white text-sm">Batch Evaluation CLI</h4>
            <p className="text-xs text-slate-400">
              Run <code className="text-indigo-300 font-mono">npm run evaluate</code> directly over hundreds of job descriptions with automated validation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
