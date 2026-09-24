'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { api, getApiBase } from '@/lib/api';
import {
  Sparkles,
  PlusCircle,
  Upload,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Mic,
  FileText,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [kits, setKits] = useState([]);
  const [loadingKits, setLoadingKits] = useState(true);

  // New Kit Form State
  const [activeTab, setActiveTab] = useState('single');
  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [days, setDays] = useState(5);
  const [batchFile, setBatchFile] = useState(null);

  // Generation Progress Modal State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [totalSteps] = useState(7);
  const [stepName, setStepName] = useState('');
  const [stepMessage, setStepMessage] = useState('');
  const [generationError, setGenerationError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      loadKits();
    }
  }, [user, authLoading]);

  const loadKits = async () => {
    try {
      setLoadingKits(true);
      const res = await api.kits.list();
      setKits(res.kits || []);
    } catch (err) {
      console.error('Failed to load kits:', err);
    } finally {
      setLoadingKits(false);
    }
  };

  const handleSingleGenerate = async (e) => {
    e.preventDefault();
    if (!jd && !companyUrl) return;

    setIsGenerating(true);
    setGenerationError('');
    setGenerationStep(1);
    setStepName('Initializing Pipeline');
    setStepMessage('Connecting to research orchestrator...');

    try {
      const token = localStorage.getItem('trao_auth_token');
      const response = await fetch(`${getApiBase()}/kits/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ jd, company_url: companyUrl, days }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Unable to establish stream reader.');
      }

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.substring(6);
            try {
              const event = JSON.parse(rawData);

              if (event.type === 'progress') {
                setGenerationStep(event.step);
                setStepName(event.step_name);
                setStepMessage(event.message);
              } else if (event.type === 'complete') {
                setIsGenerating(false);
                router.push(`/kits/${event.kit._id}`);
                return;
              } else if (event.type === 'error') {
                throw new Error(event.error);
              }
            } catch (err) {
              console.warn('SSE parse error:', err);
            }
          }
        }
      }
    } catch (err) {
      setGenerationError(err.message || 'Generation failed.');
    }
  };

  const handleBatchUpload = async (e) => {
    e.preventDefault();
    if (!batchFile) return;

    setIsGenerating(true);
    setGenerationError('');
    setStepName('Batch Processing');
    setStepMessage('Uploading and parsing description-company pairs...');

    try {
      const text = await batchFile.text();
      const pairs = JSON.parse(text);

      if (!Array.isArray(pairs)) {
        throw new Error('Uploaded JSON file must contain an array of pairs.');
      }

      const res = await api.kits.batchUpload(pairs);
      setIsGenerating(false);
      loadKits();
      alert(`Batch processing complete! Generated ${res.kits.length} new kits.`);
    } catch (err) {
      setGenerationError(err.message || 'Failed to process batch file.');
    }
  };

  const handleDeleteKit = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this kit?')) return;
    try {
      await api.kits.delete(id);
      setKits((prev) => prev.filter((k) => k._id !== id));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Interview Prep Studio</h1>
          <p className="text-slate-400 text-sm mt-1">
            Build and refine company-specific prep kits with autonomous research & arithmetic scheduling.
          </p>
        </div>
      </div>

      {/* Creation Workspace Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800/80 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Create a New Kit</h2>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Single Role Paste
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === 'batch'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Multi-Role Upload
            </button>
          </div>
        </div>

        {activeTab === 'single' ? (
          <form onSubmit={handleSingleGenerate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Company Website Address
                </label>
                <input
                  type="text"
                  required
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://acme.corp or http://localhost:8099/acme/"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Days Until Interview
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Job Description
              </label>
              <textarea
                required
                rows={6}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the complete job description text here (e.g. Senior Frontend Engineer, requirements, tech stack, responsibilities)..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-y leading-relaxed font-mono"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Prep Kit</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBatchUpload} className="space-y-5">
            <p className="text-sm text-slate-400">
              Prepare for more than one role at once by uploading a JSON file of description-and-company pairs.
            </p>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 text-center transition cursor-pointer bg-slate-900/40">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setBatchFile(e.target.files?.[0] || null)}
                className="hidden"
                id="batch-file-input"
              />
              <label htmlFor="batch-file-input" className="cursor-pointer space-y-2 block">
                <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
                <p className="text-sm font-medium text-white">
                  {batchFile ? batchFile.name : 'Click to select a JSON file'}
                </p>
                <p className="text-xs text-slate-500">
                  Format: Array of objects with keys: <code className="text-indigo-400 font-mono">id, jd, company_url, days</code>
                </p>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!batchFile || isGenerating}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload & Build Batch Kits</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Progress / Failure Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-3xl max-w-lg w-full space-y-6 border-indigo-500/40 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center mx-auto text-indigo-400 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Autonomous Kit Generation</h3>
              <p className="text-xs text-slate-400">Executing 7-step research & deterministic allocation pipeline</p>
            </div>

            {/* Step progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Step {generationStep} of {totalSteps}: {stepName}</span>
                <span className="text-indigo-400">{Math.round((generationStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(generationStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current step message */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Active Operation</span>
              </div>
              <p className="text-slate-400">{stepMessage || 'Processing...'}</p>
            </div>

            {/* Error display if failed */}
            {generationError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Pipeline Execution Error</span>
                </div>
                <p>{generationError}</p>
                <button
                  onClick={() => setIsGenerating(false)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-medium text-xs transition"
                >
                  Dismiss & Edit Input
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Kits Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Your Generated Kits</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              {kits.length}
            </span>
          </h2>
        </div>

        {loadingKits ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : kits.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No prep kits generated yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Paste a job description and company URL above to create your first customized interview kit.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {kits.map((kit) => (
              <div
                key={kit._id}
                onClick={() => router.push(`/kits/${kit._id}`)}
                className="glass-panel glass-panel-hover p-6 rounded-2xl border-slate-800 cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                      {kit.source?.company || 'Company'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteKit(kit._id, e)}
                      title="Delete kit"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition">
                    {kit.role?.title || 'Engineering Role'}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {kit.company_brief?.summary || 'Custom interview preparation roadmap.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>{kit.schedule?.days_available || 5}-Day Schedule</span>
                    <span>{kit.questions?.length || 0} Questions</span>
                    <span>{kit.flashcards?.length || 0} Flashcards</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/kits/${kit._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-center font-medium transition"
                    >
                      Builder
                    </Link>
                    <Link
                      href={`/kits/${kit._id}/practice`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-center font-medium transition"
                    >
                      Practice
                    </Link>
                    <Link
                      href={`/kits/${kit._id}/mock`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 text-pink-300 text-center font-medium transition"
                    >
                      Mock
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
