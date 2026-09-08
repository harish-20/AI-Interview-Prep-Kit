import { create } from 'zustand';
import { Kit, Question, Flashcard } from '@/types/kit';
import { api } from '@/lib/api';

interface KitState {
  currentKit: Kit | null;
  originalKit: Kit | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaveError: string | null;
  toastMessage: string | null;

  setKit: (kit: Kit) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  togglePinQuestion: (id: string) => void;
  reorderQuestions: (questions: Question[]) => void;
  addQuestion: (question: Question) => void;
  deleteQuestion: (id: string) => void;

  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;
  togglePinFlashcard: (id: string) => void;
  updateFlashcardConfidence: (id: string, confidence: number) => Promise<void>;
  addFlashcard: (flashcard: Flashcard) => void;
  deleteFlashcard: (id: string) => void;

  saveChanges: () => Promise<void>;
  clearToast: () => void;
  showToast: (msg: string) => void;
}

let debounceTimer: NodeJS.Timeout | null = null;

export const useKitStore = create<KitState>((set, get) => ({
  currentKit: null,
  originalKit: null,
  saveStatus: 'idle',
  lastSaveError: null,
  toastMessage: null,

  setKit: (kit: Kit) => {
    set({
      currentKit: kit,
      originalKit: JSON.parse(JSON.stringify(kit)),
      saveStatus: 'idle',
      lastSaveError: null,
    });
  },

  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 4000);
  },

  clearToast: () => set({ toastMessage: null }),

  triggerDebouncedSave: () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });

    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  updateQuestion: (id: string, updates: Partial<Question>) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const updatedQuestions = currentKit.questions.map((q) =>
      q.id === id ? { ...q, ...updates, edited: true } : q
    );

    set({
      currentKit: { ...currentKit, questions: updatedQuestions },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  togglePinQuestion: (id: string) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const updatedQuestions = currentKit.questions.map((q) =>
      q.id === id ? { ...q, pinned: !q.pinned } : q
    );

    set({
      currentKit: { ...currentKit, questions: updatedQuestions },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  reorderQuestions: (newQuestions: Question[]) => {
    const { currentKit } = get();
    if (!currentKit) return;

    set({
      currentKit: { ...currentKit, questions: newQuestions },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  addQuestion: (question: Question) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const updatedQuestions = [...currentKit.questions, question];
    set({
      currentKit: { ...currentKit, questions: updatedQuestions },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  deleteQuestion: (id: string) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const updatedQuestions = currentKit.questions.filter((q) => q.id !== id);
    set({
      currentKit: { ...currentKit, questions: updatedQuestions },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  updateFlashcard: (id: string, updates: Partial<Flashcard>) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const updatedCards = currentKit.flashcards.map((f) =>
      f.id === id ? { ...f, ...updates, edited: true } : f
    );

    set({
      currentKit: { ...currentKit, flashcards: updatedCards },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  togglePinFlashcard: (id: string) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const updatedCards = currentKit.flashcards.map((f) =>
      f.id === id ? { ...f, pinned: !f.pinned } : f
    );

    set({
      currentKit: { ...currentKit, flashcards: updatedCards },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  updateFlashcardConfidence: async (id: string, confidence: number) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const now = new Date().toISOString();
    const updatedCards = currentKit.flashcards.map((f) =>
      f.id === id ? { ...f, confidence, last_reviewed_at: now } : f
    );

    const newKit = { ...currentKit, flashcards: updatedCards };
    set({ currentKit: newKit, saveStatus: 'saving' });

    try {
      await api.kits.update(currentKit._id, newKit);
      set({
        originalKit: JSON.parse(JSON.stringify(newKit)),
        saveStatus: 'saved',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update confidence score';
      set({
        currentKit: get().originalKit,
        saveStatus: 'error',
        lastSaveError: message,
      });
      get().showToast('Failed to save score. Restored state.');
    }
  },

  addFlashcard: (flashcard: Flashcard) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const updatedCards = [...currentKit.flashcards, flashcard];
    set({
      currentKit: { ...currentKit, flashcards: updatedCards },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  deleteFlashcard: (id: string) => {
    const { currentKit } = get();
    if (!currentKit) return;

    const updatedCards = currentKit.flashcards.filter((f) => f.id !== id);
    set({
      currentKit: { ...currentKit, flashcards: updatedCards },
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    set({ saveStatus: 'saving' });
    debounceTimer = setTimeout(() => {
      get().saveChanges();
    }, 500);
  },

  saveChanges: async () => {
    const { currentKit, originalKit } = get();
    if (!currentKit) return;

    try {
      const { kit: saved } = await api.kits.update(currentKit._id, currentKit);
      set({
        originalKit: JSON.parse(JSON.stringify(saved)),
        saveStatus: 'saved',
        lastSaveError: null,
      });

      setTimeout(() => {
        if (get().saveStatus === 'saved') {
          set({ saveStatus: 'idle' });
        }
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save changes.';
      console.error('Failed to save kit workspace state:', err);
      // Rollback to original kit on failure
      if (originalKit) {
        set({ currentKit: JSON.parse(JSON.stringify(originalKit)) });
      }
      set({
        saveStatus: 'error',
        lastSaveError: message,
      });
      get().showToast(`Save failed: ${message}`);
    }
  },
}));
