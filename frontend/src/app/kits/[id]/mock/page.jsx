'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Mic,
  Send,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileDown,
  Layers,
} from 'lucide-react';

export default function MockInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id;

  const [kit, setKit] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    loadKit();
  }, [kitId]);

  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const loadKit = async () => {
    try {
      setLoading(true);
      const res = await api.kits.get(kitId);
      setKit(res.kit);
      if (res.kit.questions && res.kit.questions.length > 0) {
        setSelectedQuestionId(res.kit.questions[0].id);
      }
    } catch (err) {
      alert(`Error loading kit: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = () => {
    setTimerActive(true);
    setSecondsElapsed(0);
  };

  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim()) return;

    setEvaluating(true);
    setTimerActive(false);
    try {
      const res = await api.kits.mockInterview(kitId, selectedQuestionId, candidateAnswer);
      setEvaluationResult(res.evaluation);
    } catch (err) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading || !kit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading mock interview simulator...</p>
      </div>
    );
  }

  const selectedQuestion = kit.questions.find(
    (q) => q.id === selectedQuestionId
  );

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href={`/kits/${kitId}`}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Kit Builder</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-md border border-pink-500/20">
            Creative Feature
          </span>
          <span className="text-xs text-slate-400 font-medium">Interactive Mock Interviewer</span>
        </div>
      </div>

      {/* Simulator Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Question Picker */}
        <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Select Interview Question</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {kit.questions.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQuestionId(q.id);
                  setEvaluationResult(null);
                  setCandidateAnswer('');
                  setTimerActive(false);
                  setSecondsElapsed(0);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                  selectedQuestionId === q.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1 text-[10px] text-slate-500">
                  <span className="font-mono font-bold text-indigo-300">{q.id}</span>
                  <span className="capitalize">{q.category}</span>
                  <span>Diff: {q.difficulty}/3</span>
                </div>
                <p className="line-clamp-2 leading-relaxed">{q.prompt}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Active Simulation & Evaluation */}
        <div className="md:col-span-2 space-y-6">
          {selectedQuestion ? (
            <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-5">
              {/* Question Banner */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Category: {selectedQuestion.category.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-xs text-slate-300">{formatTimer(secondsElapsed)}</span>
                    {!timerActive ? (
                      <button
                        onClick={handleStartTimer}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                      >
                        Start Timer
                      </button>
                    ) : (
                      <button
                        onClick={() => setTimerActive(false)}
                        className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px] transition"
                      >
                        Pause
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white leading-relaxed">
                  "{selectedQuestion.prompt}"
                </h2>
              </div>

              {/* Answer Input Area */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Your Answer (Type or outline your spoken response):
                </label>
                <textarea
                  rows={6}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Structure your answer (e.g. STAR method for behavioural, architectural components & trade-offs for technical)..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={evaluating || !candidateAnswer.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-pink-600/20 flex items-center gap-2 transition"
                >
                  {evaluating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating Answer...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Evaluate with AI Rubric</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real-time AI Evaluation Report */}
              {evaluationResult && (
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/40 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-400" />
                      <h4 className="font-bold text-white text-sm">Evaluation Report & Diagnostic</h4>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold text-sm">
                      <span>Score: {evaluationResult.score}/100</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {evaluationResult.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Strengths */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Key Strengths</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {evaluationResult.strengths?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weak Spots */}
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Weak Spots & Omissions</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {evaluationResult.weak_spots?.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Sample Answer */}
                  {evaluationResult.improved_sample_answer && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Exemplary Candidate Outline
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed font-mono whitespace-pre-wrap">
                        {evaluationResult.improved_sample_answer}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border-slate-800 text-center text-slate-400 text-xs">
              Select a question to begin simulation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
