'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flashcard } from '@/types/kit';
import { useKitStore } from '@/store/useKitStore';
import { Pin, PinOff, Trash2, Plus, Play, Layers, Edit3, Check } from 'lucide-react';

export default function FlashcardsSection({ kitId }: { kitId: string }) {
  const {
    currentKit,
    updateFlashcard,
    togglePinFlashcard,
    addFlashcard,
    deleteFlashcard,
    showToast,
  } = useKitStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  if (!currentKit) return null;

  const flashcards = currentKit.flashcards || [];

  const handleStartEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setFrontText(card.front);
    setBackText(card.back);
  };

  const handleSaveEdit = (id: string) => {
    updateFlashcard(id, { front: frontText, back: backText });
    setEditingId(null);
  };

  const handleAddCard = () => {
    const newCard: Flashcard = {
      id: `fc_custom_${Date.now()}`,
      front: 'New Flashcard Question / Concept',
      back: 'Answer explanation or key takeaways',
      edited: true,
    };
    addFlashcard(newCard);
    showToast('Added new flashcard');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            Flashcard Deck ({flashcards.length} cards)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review key definitions, architectural patterns, and behavioral stories before your interview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddCard}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Card</span>
          </button>

          {flashcards.length > 0 && (
            <Link
              href={`/kits/${kitId}/practice`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-500/30"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Start Practice Session</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid of Cards */}
      {flashcards.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/30 text-sm text-zinc-500">
          No flashcards found. Click &quot;Add Card&quot; to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {flashcards.map((card) => {
            const isEditing = editingId === card.id;

            return (
              <div
                key={card.id}
                className={`relative flex flex-col justify-between rounded-2xl border bg-zinc-900/60 p-6 backdrop-blur-sm transition-all ${
                  card.pinned
                    ? 'border-amber-500/40 bg-amber-500/5 shadow-md shadow-amber-500/5'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        Flashcard
                      </span>
                      {card.confidence && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                          Confidence: {card.confidence}/4
                        </span>
                      )}
                      {card.edited && (
                        <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                          Edited
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePinFlashcard(card.id)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          card.pinned
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                        }`}
                        title={card.pinned ? 'Unpin card' : 'Pin card'}
                      >
                        {card.pinned ? <Pin className="h-4 w-4 fill-amber-400/20" /> : <PinOff className="h-4 w-4" />}
                      </button>

                      <button
                        onClick={() => deleteFlashcard(card.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 mt-2">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Front (Prompt)</label>
                        <textarea
                          rows={2}
                          value={frontText}
                          onChange={(e) => setFrontText(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-indigo-500 text-zinc-100 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">Back (Answer)</label>
                        <textarea
                          rows={3}
                          value={backText}
                          onChange={(e) => setBackText(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-indigo-500 text-zinc-100 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleSaveEdit(card.id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" /> Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                          Front
                        </span>
                        <div className="text-sm font-semibold text-zinc-100 flex justify-between items-start">
                          <span>{card.front}</span>
                          <button
                            onClick={() => handleStartEdit(card)}
                            className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors ml-2"
                            title="Edit Card"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/60">
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                          Back
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{card.back}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
