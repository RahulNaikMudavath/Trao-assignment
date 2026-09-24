'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Pin,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Layers,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Mic,
  Save,
  Clock,
  ChevronRight,
  ShieldCheck,
  FileDown,
} from 'lucide-react';

const categories = ['technical', 'behavioural', 'system-design', 'company-fit'];

export default function KitBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id;

  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadKit();
  }, [kitId]);

  const loadKit = async () => {
    try {
      setLoading(true);
      const res = await api.kits.get(kitId);
      setKit(res.kit);
    } catch (err) {
      alert(`Failed to load kit: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Immediate local state update + debounced remote sync
  const updateLocalKit = (updater) => {
    setKit((prev) => {
      const updated = updater(prev);
      syncKit(updated);
      return updated;
    });
  };

  const syncKit = async (kitToSave) => {
    setSaving(true);
    try {
      await api.kits.update(kitId, kitToSave);
      setNotification('Changes saved.');
      setTimeout(() => setNotification(null), 2500);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // Section Regeneration (preserves edited/pinned/user_created!)
  const handleRegenerate = async (section, category, days) => {
    const key = category ? `category-${category}` : section;
    setRegeneratingSection(key);
    try {
      const res = await api.kits.regenerateSection(kitId, { section, category, days });
      setKit(res.kit);
      setNotification(`Regenerated ${category || section} while preserving your customized items.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      alert(`Regeneration failed: ${err.message}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Inline Question Editing
  const handleUpdateQuestion = (qId, fields) => {
    updateLocalKit((prev) => {
      const questions = prev.questions.map((q) => {
        if (q.id === qId) {
          const updatedMeta = {
            ...q.metadata,
            status: q.metadata?.origin === 'user_created' ? 'unmodified' : 'edited',
          };
          return { ...q, ...fields, metadata: updatedMeta };
        }
        return q;
      });
      return { ...prev, questions };
    });
  };

  // Toggle Pin Question
  const handleTogglePin = (qId) => {
    updateLocalKit((prev) => {
      const questions = prev.questions.map((q) => {
        if (q.id === qId) {
          const isCurrentlyPinned = q.metadata?.pinned || q.metadata?.status === 'pinned';
          const newStatus = isCurrentlyPinned ? 'unmodified' : 'pinned';
          return {
            ...q,
            metadata: {
              ...q.metadata,
              pinned: !isCurrentlyPinned,
              status: newStatus,
            },
          };
        }
        return q;
      });
      return { ...prev, questions };
    });
  };

  // Move Question Up/Down in list
  const handleMoveQuestion = (index, direction) => {
    updateLocalKit((prev) => {
      const questions = [...prev.questions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= questions.length) return prev;

      const temp = questions[index];
      questions[index] = questions[targetIndex];
      questions[targetIndex] = temp;
      return { ...prev, questions };
    });
  };

  // Move Question to another Category
  const handleMoveCategory = (qId, newCategory) => {
    handleUpdateQuestion(qId, { category: newCategory });
  };

  // Add Question by Hand
  const handleAddQuestion = (category) => {
    updateLocalKit((prev) => {
      const maxIdNum = prev.questions.reduce((max, q) => {
        const num = parseInt(q.id.replace(/\D/g, ''), 10) || 0;
        return Math.max(max, num);
      }, 0);

      const firstReqId = prev.role?.requirements?.[0]?.id || 'r1';
      const newQuestion = {
        id: `q${maxIdNum + 1}`,
        requirement_ids: [firstReqId],
        category,
        prompt: 'New custom question prompt...',
        answer_outline: 'Bullet points of the expected answer outline...',
        difficulty: 2,
        metadata: {
          origin: 'user_created',
          status: 'unmodified',
        },
      };

      return { ...prev, questions: [...prev.questions, newQuestion] };
    });
  };

  // Delete Question
  const handleDeleteQuestion = (qId) => {
    if (!confirm('Delete this question?')) return;
    updateLocalKit((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }));
  };

  // Export Kit to Printable Markdown
  const handleExportMarkdown = () => {
    if (!kit) return;
    let md = `# Interview Prep Kit: ${kit.role.title} at ${kit.source.company}\n\n`;
    md += `**Company Brief**: ${kit.company_brief.summary}\n\n`;
    md += `**What they do**: ${kit.company_brief.what_they_do}\n\n`;
    md += `## Role Requirements\n`;
    kit.role.requirements.forEach((r) => {
      md += `- [${r.priority.toUpperCase()}] (${r.kind}) ${r.text}\n`;
    });
    md += `\n## Question Bank\n`;
    kit.questions.forEach((q) => {
      md += `### [${q.category.toUpperCase()}] ${q.prompt} (Diff: ${q.difficulty}/3)\n`;
      md += `**Answer Outline**:\n${q.answer_outline}\n\n`;
    });
    md += `## ${kit.schedule.days_available}-Day Schedule\n`;
    kit.schedule.days.forEach((d) => {
      md += `- **Day ${d.day}**: ${d.focus} (${d.minutes} mins) - ${d.question_ids.join(', ')}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kit.source.company}_Prep_Kit.md`;
    a.click();
  };

  if (loading || !kit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading your customized prep kit...</p>
      </div>
    );
  }

  const mustHaveReqs = kit.role.requirements.filter((r) => r.priority === 'must');
  const coveredReqIds = new Set();
  kit.questions.forEach((q) => q.requirement_ids?.forEach((id) => coveredReqIds.add(id)));
  const coveredMustCount = mustHaveReqs.filter((r) => coveredReqIds.has(r.id)).length;

  return (
    <div className="space-y-8 py-4">
      {/* Top Banner & Quick Controls */}
      <div className="space-y-4 border-b border-slate-800 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            {saving && (
              <span className="text-xs text-indigo-400 flex items-center gap-1.5 animate-pulse">
                <Save className="w-3.5 h-3.5" />
                <span>Saving...</span>
              </span>
            )}
            {notification && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                {notification}
              </span>
            )}
            <button
              onClick={handleExportMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Cheat Sheet</span>
            </button>
            <Link
              href={`/kits/${kitId}/practice`}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Practice Cards ({kit.flashcards?.length || 0})</span>
            </Link>
            <Link
              href={`/kits/${kitId}/mock`}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-pink-600/20 flex items-center gap-1.5 transition"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>AI Mock Interview</span>
            </Link>
          </div>
        </div>

        {/* Title & Metadata Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                {kit.source.company}
              </span>
              <span className="text-xs text-slate-400">{kit.role.seniority}</span>
              <a
                href={kit.source.company_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition"
              >
                <span>{kit.source.company_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {kit.role.title}
            </h1>
          </div>

          {/* Coverage & Schedule Metrics */}
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl text-xs font-medium">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{kit.schedule.days_available} Days</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Coverage: {coveredMustCount}/{mustHaveReqs.length} Must-Haves ({kit.coverage.passes} Passes)
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-semibold gap-1 pt-2">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'questions'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Question Bank ({kit.questions.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'schedule'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Study Schedule ({kit.schedule.days.length} Days)
          </button>
          <button
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'brief'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Company Brief & Requirements
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === 'flashcards'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Flashcards ({kit.flashcards.length})
          </button>
        </div>
      </div>

      {/* TAB 1: QUESTION BANK (The Reshapeable Builder) */}
      {activeTab === 'questions' && (
        <div className="space-y-8">
          <p className="text-xs text-slate-400">
            Reshape any question inline, reorder questions, move categories, pin key prompts, or regenerate a category. Pinned, edited, and custom questions survive regeneration!
          </p>

          {categories.map((category) => {
            const catQuestions = kit.questions.filter((q) => q.category === category);
            const isRegenerating = regeneratingSection === `category-${category}`;

            return (
              <div key={category} className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-bold text-white text-base">
                      {category.replace('-', ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {catQuestions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddQuestion(category)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                    <button
                      disabled={isRegenerating}
                      onClick={() => handleRegenerate('category', category)}
                      title="Regenerate this category. Pinned and edited items will survive!"
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Category'}</span>
                    </button>
                  </div>
                </div>

                {catQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 italic">No questions currently in this category.</p>
                ) : (
                  <div className="space-y-4">
                    {catQuestions.map((q) => {
                      const isPinned = q.metadata?.pinned || q.metadata?.status === 'pinned';
                      const isEdited = q.metadata?.status === 'edited';
                      const isUserCreated = q.metadata?.origin === 'user_created';
                      const globalIdx = kit.questions.findIndex((x) => x.id === q.id);

                      return (
                        <div
                          key={q.id}
                          className={`p-5 rounded-2xl border transition ${
                            isPinned
                              ? 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          } space-y-3`}
                        >
                          {/* Card Controls Bar */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-400">{q.id}</span>
                              {isPinned && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-1 text-[11px]">
                                  <Pin className="w-3 h-3 fill-amber-300" />
                                  Pinned
                                </span>
                              )}
                              {isEdited && !isPinned && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-[11px]">
                                  Edited
                                </span>
                              )}
                              {isUserCreated && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[11px]">
                                  Custom
                                </span>
                              )}

                              {/* Requirement Link Badges */}
                              {q.requirement_ids?.map((rid) => (
                                <span
                                  key={rid}
                                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px]"
                                >
                                  {rid}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Reorder Buttons */}
                              <button
                                onClick={() => handleMoveQuestion(globalIdx, 'up')}
                                disabled={globalIdx === 0}
                                title="Move up"
                                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveQuestion(globalIdx, 'down')}
                                disabled={globalIdx === kit.questions.length - 1}
                                title="Move down"
                                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Category Switcher Dropdown */}
                              <select
                                value={q.category}
                                onChange={(e) => handleMoveCategory(q.id, e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-0.5 text-xs focus:outline-none"
                              >
                                {categories.map((c) => (
                                  <option key={c} value={c}>
                                    Move to {c.replace('-', ' ')}
                                  </option>
                                ))}
                              </select>

                              {/* Difficulty Selector */}
                              <select
                                value={q.difficulty}
                                onChange={(e) =>
                                  handleUpdateQuestion(q.id, { difficulty: parseInt(e.target.value, 10) })
                                }
                                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-0.5 text-xs focus:outline-none"
                              >
                                <option value="1">Difficulty 1 (Fundamental)</option>
                                <option value="2">Difficulty 2 (Core)</option>
                                <option value="3">Difficulty 3 (Deep Dive)</option>
                              </select>

                              {/* Pin Toggle */}
                              <button
                                onClick={() => handleTogglePin(q.id)}
                                title={isPinned ? 'Unpin' : 'Pin to prevent replacement on regeneration'}
                                className={`p-1.5 rounded-lg border transition ${
                                  isPinned
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                    : 'border-slate-700 text-slate-400 hover:text-amber-300'
                                }`}
                              >
                                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-300' : ''}`} />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                title="Delete question"
                                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Editable Question Prompt */}
                          <div>
                            <textarea
                              rows={2}
                              value={q.prompt}
                              onChange={(e) => handleUpdateQuestion(q.id, { prompt: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-sm font-semibold text-white focus:outline-none transition resize-none"
                            />
                          </div>

                          {/* Editable Answer Outline */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                              Answer Outline & Evaluation Rubric
                            </label>
                            <textarea
                              rows={3}
                              value={q.answer_outline}
                              onChange={(e) => handleUpdateQuestion(q.id, { answer_outline: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-300 focus:outline-none transition leading-relaxed resize-y font-mono"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DAY-BY-DAY STUDY SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Arithmetic Study Schedule</h3>
                <p className="text-xs text-slate-400">
                  Allocates high-priority and difficulty-3 topics earlier. Re-allocate dynamically to any timeframe.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Days:</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={kit.schedule.days_available}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      handleRegenerate('schedule', undefined, val);
                    }}
                    className="w-16 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white text-center font-bold"
                  />
                </div>

                <button
                  disabled={regeneratingSection === 'schedule'}
                  onClick={() => handleRegenerate('schedule')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'schedule' ? 'animate-spin' : ''}`} />
                  <span>Recalculate Schedule</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kit.schedule.days.map((day) => {
                const dayQuestions = kit.questions.filter((q) => day.question_ids.includes(q.id));

                return (
                  <div
                    key={day.day}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                          {day.day}
                        </span>
                        <span className="text-sm font-bold text-white">{day.focus}</span>
                      </div>
                      <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {day.minutes} mins
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold uppercase text-slate-400">
                        Scheduled Questions ({dayQuestions.length}):
                      </span>
                      {dayQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span className="font-mono font-bold text-indigo-300">{q.id}</span>
                            <span className="capitalize">{q.category}</span>
                            <span>Diff: {q.difficulty}/3</span>
                          </div>
                          <p className="text-slate-200 line-clamp-1">{q.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY BRIEF & ROLE REQUIREMENTS */}
      {activeTab === 'brief' && (
        <div className="space-y-6">
          {/* Company Brief Card */}
          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight">Company Research & Brief</h3>
              <button
                disabled={regeneratingSection === 'brief'}
                onClick={() => handleRegenerate('brief')}
                className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingSection === 'brief' ? 'animate-spin' : ''}`} />
                <span>Regenerate Brief</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Executive Summary
                </label>
                <textarea
                  rows={3}
                  value={kit.company_brief.summary}
                  onChange={(e) =>
                    updateLocalKit((prev) => ({
                      ...prev,
                      company_brief: { ...prev.company_brief, summary: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  What They Do & Engineering Focus
                </label>
                <textarea
                  rows={3}
                  value={kit.company_brief.what_they_do}
                  onChange={(e) =>
                    updateLocalKit((prev) => ({
                      ...prev,
                      company_brief: { ...prev.company_brief, what_they_do: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {kit.company_brief.sources?.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                    Sources Crawled ({kit.company_brief.sources.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {kit.company_brief.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                      >
                        <span>{src}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Role Requirements Card */}
          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight border-b border-slate-800 pb-3">
              Extracted Requirements ({kit.role.requirements.length})
            </h3>

            <div className="space-y-3">
              {kit.role.requirements.map((req) => {
                const isCovered = coveredReqIds.has(req.id);
                const matchingQuestions = kit.questions.filter((q) =>
                  q.requirement_ids?.includes(req.id)
                );

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-300">{req.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            req.priority === 'must'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {req.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 capitalize text-[10px]">
                          {req.kind}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white">{req.text}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCovered ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{matchingQuestions.length} Questions</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Uncovered</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FLASHCARDS */}
      {activeTab === 'flashcards' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Flashcard Deck</h3>
                <p className="text-xs text-slate-400">
                  Active recall cards mapped to role requirements.
                </p>
              </div>

              <Link
                href={`/kits/${kitId}/practice`}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Launch Practice Mode</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kit.flashcards.map((f) => (
                <div
                  key={f.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-purple-400">{f.id}</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {f.requirement_ids.join(', ')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Front (Prompt)
                    </label>
                    <textarea
                      rows={2}
                      value={f.front}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateLocalKit((prev) => ({
                          ...prev,
                          flashcards: prev.flashcards.map((card) =>
                            card.id === f.id ? { ...card, front: val } : card
                          ),
                        }));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Back (Answer Outline)
                    </label>
                    <textarea
                      rows={3}
                      value={f.back}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateLocalKit((prev) => ({
                          ...prev,
                          flashcards: prev.flashcards.map((card) =>
                            card.id === f.id ? { ...card, back: val } : card
                          ),
                        }));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
