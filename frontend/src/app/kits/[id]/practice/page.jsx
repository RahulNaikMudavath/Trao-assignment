'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  RotateCw,
  CheckCircle,
  ThumbsDown,
  Minus,
  ThumbsUp,
  Sparkles,
  Award,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function PracticeModePage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id;

  const [kit, setKit] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKit();
  }, [kitId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (sessionCompleted || cards.length === 0) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1') {
        handleConfidenceRating(1);
      } else if (e.key === '2') {
        handleConfidenceRating(2);
      } else if (e.key === '3') {
        handleConfidenceRating(3);
      } else if (e.key === 'ArrowRight') {
        handleNextCard();
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, cards, sessionCompleted]);

  const loadKit = async () => {
    try {
      setLoading(true);
      const res = await api.kits.get(kitId);
      setKit(res.kit);
      const initialCards = res.kit.flashcards || [];
      // Initial sort: prioritize cards with lowest confidence first
      const sorted = sortCardsByConfidence(initialCards);
      setCards(sorted);
    } catch (err) {
      alert(`Error loading practice deck: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Confidence-weighted sorting strategy (Section 7 defense)
  // Cards with lower confidence (1 = Hard) or unreviewed (0) appear earliest in next session
  const sortCardsByConfidence = (deck) => {
    return [...deck].sort((a, b) => {
      const confA = a.metadata?.confidence ?? 0;
      const confB = b.metadata?.confidence ?? 0;
      // 1 (Hard) -> 0 (Unreviewed) -> 2 (Medium) -> 3 (Easy)
      const weightA = confA === 1 ? 0 : confA === 0 ? 1 : confA === 2 ? 2 : 3;
      const weightB = confB === 1 ? 0 : confB === 0 ? 1 : confB === 2 ? 3 : 4;
      return weightA - weightB;
    });
  };

  const handleConfidenceRating = async (confidence) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    // Optimistically update card confidence
    setCards((prev) =>
      prev.map((c, i) =>
        i === currentIndex
          ? {
              ...c,
              metadata: {
                ...c.metadata,
                confidence,
                times_reviewed: (c.metadata?.times_reviewed || 0) + 1,
                last_practiced: new Date().toISOString(),
              },
            }
          : c
      )
    );

    // Sync rating to backend
    api.kits.practiceCard(kitId, currentCard.id, confidence).catch((e) => {
      console.warn('Practice sync failed:', e);
    });

    // Advance to next card or finish session
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const restartSession = () => {
    const reordered = sortCardsByConfidence(cards);
    setCards(reordered);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  if (loading || !kit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading flashcards...</p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const coveredCardsCount = cards.filter((c) => (c.metadata?.times_reviewed || 0) > 0).length;
  const hardCardsCount = cards.filter((c) => c.metadata?.confidence === 1).length;
  const easyCardsCount = cards.filter((c) => c.metadata?.confidence === 3).length;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
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
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            {kit.source.company}
          </span>
          <span className="text-xs text-slate-400 font-medium">Flashcard Recall Trainer</span>
        </div>
      </div>

      {/* Progress Bar & Stats */}
      <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-3">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
          <span>Card {cards.length > 0 ? currentIndex + 1 : 0} of {cards.length}</span>
          <span>Covered: {coveredCardsCount}/{cards.length} ({Math.round((coveredCardsCount / (cards.length || 1)) * 100)}%)</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / (cards.length || 1)) * 100}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="text-rose-400 font-medium">{hardCardsCount} Need Work (Hard)</span>
          <span className="text-emerald-400 font-medium">{easyCardsCount} Mastered (Easy)</span>
          <span className="text-slate-500">Press Space to Flip | 1, 2, 3 to Rate</span>
        </div>
      </div>

      {!sessionCompleted && currentCard ? (
        <div className="space-y-6">
          {/* Flashcard Component with 3D Flip */}
          <div
            onClick={() => setIsFlipped((prev) => !prev)}
            className="perspective-1000 w-full min-h-[340px] cursor-pointer"
          >
            <div
              className={`relative w-full min-h-[340px] rounded-3xl transition-transform duration-500 transform-style-preserve-3d shadow-2xl ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front of Card */}
              <div className="absolute inset-0 backface-hidden glass-panel p-8 sm:p-10 rounded-3xl border-purple-500/30 flex flex-col justify-between bg-gradient-to-b from-slate-900/90 to-slate-950/90">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold">
                    {currentCard.id}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Reqs: {currentCard.requirement_ids?.join(', ')}
                  </span>
                </div>

                <div className="my-auto text-center space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400">
                    Question / Prompt
                  </span>
                  <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                    {currentCard.front}
                  </p>
                </div>

                <div className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click anywhere or press Spacebar to reveal answer</span>
                </div>
              </div>

              {/* Back of Card */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel p-8 sm:p-10 rounded-3xl border-indigo-500/40 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-indigo-950/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-bold uppercase text-[10px]">
                    Answer Outline
                  </span>
                  <span className="text-slate-400 text-xs">
                    Times Reviewed: {currentCard.metadata?.times_reviewed || 0}
                  </span>
                </div>

                <div className="my-auto space-y-4">
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                    {currentCard.back}
                  </p>
                </div>

                <div className="text-center text-xs text-slate-400">
                  Rate your confidence level below to advance
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Rating Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleConfidenceRating(1)}
              className="py-3.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-semibold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition"
            >
              <ThumbsDown className="w-4 h-4 text-rose-400" />
              <span>1. Hard (Review Soon)</span>
            </button>

            <button
              onClick={() => handleConfidenceRating(2)}
              className="py-3.5 px-4 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-semibold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition"
            >
              <Minus className="w-4 h-4 text-amber-400" />
              <span>2. Medium (Good)</span>
            </button>

            <button
              onClick={() => handleConfidenceRating(3)}
              className="py-3.5 px-4 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-semibold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 transition"
            >
              <ThumbsUp className="w-4 h-4 text-emerald-400" />
              <span>3. Easy (Mastered)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Session Completed Screen */
        <div className="glass-panel p-10 rounded-3xl border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center mx-auto text-indigo-400 shadow-xl shadow-indigo-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Practice Session Complete!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              You reviewed {cards.length} flashcards. Your confidence ratings have been saved and applied to your spaced-repetition deck.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center py-2">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="block text-xl font-bold text-rose-400">{hardCardsCount}</span>
              <span className="text-[11px] text-slate-400">Hard</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="block text-xl font-bold text-amber-400">
                {cards.filter((c) => c.metadata?.confidence === 2).length}
              </span>
              <span className="text-[11px] text-slate-400">Medium</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="block text-xl font-bold text-emerald-400">{easyCardsCount}</span>
              <span className="text-[11px] text-slate-400">Easy</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={restartSession}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Start Next Session (Prioritize Weakest)</span>
            </button>

            <Link
              href={`/kits/${kitId}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center transition"
            >
              Return to Builder
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
