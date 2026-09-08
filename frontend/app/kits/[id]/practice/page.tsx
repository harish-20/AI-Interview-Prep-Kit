'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useKitStore } from '@/store/useKitStore';
import { Flashcard } from '@/types/kit';
import {
  ChevronLeft,
  RotateCcw,
  Eye,
  Trophy,
  ArrowRight,
  Flame,
} from 'lucide-react';

export default function FlashcardPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kitId = resolvedParams.id;

  const { currentKit, setKit, updateFlashcardConfidence } = useKitStore();

  // State hooks declared at component top
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);
  const initializedRef = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['kit', kitId],
    queryFn: () => api.kits.get(kitId),
  });

  useEffect(() => {
    if (data?.kit) {
      setKit(data.kit);
    }
  }, [data, setKit]);

  const kit = currentKit || data?.kit;

  // Initialize practice session once on load: Order by lowest confidence first
  const initializeSession = useCallback(() => {
    if (!kit?.flashcards || kit.flashcards.length === 0) return;

    const sorted = [...kit.flashcards].sort((a, b) => {
      const confA = a.confidence ?? 0;
      const confB = b.confidence ?? 0;
      if (confA !== confB) return confA - confB;

      const dateA = a.last_reviewed_at ? new Date(a.last_reviewed_at).getTime() : 0;
      const dateB = b.last_reviewed_at ? new Date(b.last_reviewed_at).getTime() : 0;
      return dateA - dateB;
    });

    setQueue(sorted);
    setCurrentIndex(0);
    setRevealed(false);
    setSessionCompleted(false);
    setRatedCount(0);
    initializedRef.current = true;
  }, [kit]);

  useEffect(() => {
    if (kit?.flashcards && !initializedRef.current) {
      initializeSession();
    }
  }, [kit?.flashcards, initializeSession]);

  const handleRestartSession = () => {
    initializedRef.current = false;
    initializeSession();
  };

  const handleRate = useCallback(
    async (rating: number) => {
      const currentCard = queue[currentIndex];
      if (!currentCard) return;

      // Fire optimistic background update to store / backend
      updateFlashcardConfidence(currentCard.id, rating).catch((err: unknown) => {
        console.error('Failed to update card confidence score:', err);
      });

      setRatedCount((prev) => prev + 1);

      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((prev) => prev + 1);
        setRevealed(false);
      } else {
        setSessionCompleted(true);
      }
    },
    [queue, currentIndex, updateFlashcardConfidence]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setRevealed((prev) => !prev);
      } else if (revealed) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, sessionCompleted, handleRate]);

  if (isLoading || !kit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-400 font-medium">Preparing practice deck...</p>
      </div>
    );
  }

  const currentCard = queue[currentIndex];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 flex-1 flex flex-col justify-between">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <Link
          href={`/kits/${kitId}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Exit Practice Mode</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {kit.source?.company || 'Prep Mode'}
          </span>
        </div>
      </div>

      {/* SESSION COMPLETED SUMMARY SCREEN */}
      {sessionCompleted ? (
        <div className="w-full max-w-xl mx-auto my-auto bg-zinc-900/80 border border-zinc-800 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-xl shadow-indigo-500/20 mb-2">
            <Trophy className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Session Completed!</h2>
            <p className="text-sm text-zinc-400">
              You reviewed {ratedCount} flashcards. Low confidence cards will be prioritized in your next session.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={handleRestartSession}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Practice Again</span>
            </button>

            <Link
              href={`/kits/${kitId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all"
            >
              <span>Back to Kit</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : currentCard ? (
        <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-6">
          {/* Progress Indicator */}
          <div className="w-full max-w-xl flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>
              Card <strong className="text-zinc-200">{currentIndex + 1}</strong> of{' '}
              <strong className="text-zinc-200">{queue.length}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Lowest confidence first</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xl h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
            />
          </div>

          {/* FLASHCARD CONTAINER */}
          <div
            onClick={() => setRevealed(!revealed)}
            className={`w-full max-w-xl min-h-[320px] rounded-3xl border bg-zinc-900/90 p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-indigo-500/50 ${
              revealed ? 'border-indigo-500/40 shadow-indigo-500/10' : 'border-zinc-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
                <span>{revealed ? 'Back (Answer)' : 'Front (Prompt)'}</span>
                <span className="text-[11px] text-zinc-500">Press [Space] to flip</span>
              </div>

              <div className="text-base sm:text-lg font-semibold text-zinc-100 leading-relaxed">
                {currentCard.front}
              </div>

              {revealed && (
                <div className="mt-6 pt-6 border-t border-zinc-800 animate-in fade-in duration-200">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {currentCard.back}
                  </p>
                </div>
              )}
            </div>

            {!revealed && (
              <div className="pt-6 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors">
                  <Eye className="h-4 w-4" /> Click or press Space to reveal answer
                </span>
              </div>
            )}
          </div>

          {/* CONFIDENCE RATING BUTTONS */}
          {revealed && (
            <div className="w-full max-w-xl space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="block text-center text-xs font-mono uppercase tracking-wider text-zinc-400">
                Rate your recall confidence (Press 1–4):
              </span>

              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={() => handleRate(1)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all hover:scale-105"
                >
                  <span className="font-bold text-sm">Again</span>
                  <span className="text-[10px] text-rose-400/80 font-mono mt-0.5">[1]</span>
                </button>

                <button
                  onClick={() => handleRate(2)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all hover:scale-105"
                >
                  <span className="font-bold text-sm">Hard</span>
                  <span className="text-[10px] text-amber-400/80 font-mono mt-0.5">[2]</span>
                </button>

                <button
                  onClick={() => handleRate(3)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 transition-all hover:scale-105"
                >
                  <span className="font-bold text-sm">Good</span>
                  <span className="text-[10px] text-amber-400/80 font-mono mt-0.5">[3]</span>
                </button>

                <button
                  onClick={() => handleRate(4)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all hover:scale-105"
                >
                  <span className="font-bold text-sm">Easy</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5">[4]</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
