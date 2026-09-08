'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Question, QuestionCategory } from '@/types/kit';
import { useKitStore } from '@/store/useKitStore';
import { api } from '@/lib/api';
import {
  Pin,
  PinOff,
  Trash2,
  RefreshCw,
  Plus,
  GripVertical,
  Edit3,
  Check,
  Code2,
  Users,
  Cpu,
  Building,
  Loader2,
} from 'lucide-react';

const CATEGORIES: { id: QuestionCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'technical', label: 'Technical Core', icon: Code2 },
  { id: 'system-design', label: 'System Design & Architecture', icon: Cpu },
  { id: 'behavioural', label: 'Behavioural & Leadership', icon: Users },
  { id: 'company-fit', label: 'Company Fit & Culture', icon: Building },
];

function SortableQuestionItem({
  question,
  onEditPrompt,
  onEditAnswer,
  onTogglePin,
  onDelete,
}: {
  question: Question;
  onEditPrompt: (id: string, text: string) => void;
  onEditAnswer: (id: string, text: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptText, setPromptText] = useState(question.prompt);
  const [answerText, setAnswerText] = useState(question.answer_outline);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-2xl border bg-zinc-900/70 p-5 transition-all ${
        question.pinned
          ? 'border-amber-500/40 bg-amber-500/5 shadow-md shadow-amber-500/5'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Accessible Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder (or press Space/Enter then Arrow keys)"
            aria-label="Drag handle"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Difficulty Badge */}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono ${
              question.difficulty === 1
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : question.difficulty === 2
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            Level {question.difficulty}
          </span>

          {question.edited && (
            <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
              Edited
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Pin Button */}
          <button
            onClick={() => onTogglePin(question.id)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              question.pinned
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
            title={question.pinned ? 'Unpin item' : 'Pin item (preserve across regeneration)'}
          >
            {question.pinned ? <Pin className="h-4 w-4 fill-amber-400/20" /> : <PinOff className="h-4 w-4" />}
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(question.id)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            title="Delete Question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Question Prompt Editor */}
      <div className="mt-3">
        {isEditingPrompt ? (
          <div className="space-y-2">
            <textarea
              rows={2}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-950 border border-indigo-500 text-zinc-100 focus:outline-none"
            />
            <button
              onClick={() => {
                onEditPrompt(question.id, promptText);
                setIsEditingPrompt(false);
              }}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium inline-flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Save Prompt
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between group/prompt">
            <h4 className="text-sm font-semibold text-zinc-100 leading-snug">{question.prompt}</h4>
            <button
              onClick={() => setIsEditingPrompt(true)}
              className="opacity-0 group-hover/prompt:opacity-100 p-1 text-zinc-500 hover:text-indigo-400 transition-all ml-2"
              title="Edit Question Prompt"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Answer Outline Editor */}
      <div className="mt-3 pt-3 border-t border-zinc-800/60">
        <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
          Answer Outline & Key Talking Points
        </label>
        <textarea
          rows={3}
          value={answerText}
          onChange={(e) => {
            setAnswerText(e.target.value);
            onEditAnswer(question.id, e.target.value);
          }}
          placeholder="Add guidance or key bullet points to address in your response..."
          className="w-full px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-zinc-300 text-xs focus:outline-none focus:border-indigo-500/50 leading-relaxed"
        />
      </div>
    </div>
  );
}

export default function QuestionBankSection({ kitId }: { kitId: string }) {
  const {
    currentKit,
    updateQuestion,
    togglePinQuestion,
    reorderQuestions,
    addQuestion,
    deleteQuestion,
    showToast,
  } = useKitStore();

  const [regeneratingCategory, setRegeneratingCategory] = useState<QuestionCategory | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!currentKit) return null;

  const questions = currentKit.questions || [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = [...questions];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      reorderQuestions(reordered);
    }
  };

  const handleRegenerateCategory = async (category: QuestionCategory) => {
    setRegeneratingCategory(category);
    try {
      const result = await api.kits.regenerateSection(kitId, category);
      useKitStore.setState({ currentKit: result.kit });
      showToast(
        `${result.regeneratedCount} questions regenerated — your ${result.preservedCount} edits/pins were kept.`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      showToast(`Regeneration failed: ${message}`);
    } finally {
      setRegeneratingCategory(null);
    }
  };

  const handleAddNewQuestion = (category: QuestionCategory) => {
    const newQ: Question = {
      id: `q_custom_${Date.now()}`,
      category,
      prompt: 'New Custom Question - click pencil to edit prompt',
      answer_outline: 'Bullet points or key metrics to cover in your response',
      difficulty: 2,
      edited: true,
    };
    addQuestion(newQ);
    showToast('Added custom question');
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-10">
        {CATEGORIES.map(({ id: categoryId, label, icon: Icon }) => {
          const categoryQuestions = questions.filter((q) => q.category === categoryId);

          return (
            <div key={categoryId} className="space-y-4">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">{label}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-400">
                    {categoryQuestions.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRegenerateCategory(categoryId)}
                    disabled={regeneratingCategory === categoryId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors disabled:opacity-50"
                    title="Regenerate unpinned/unedited questions in this category"
                  >
                    {regeneratingCategory === categoryId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span>Regenerate Category</span>
                  </button>

                  <button
                    onClick={() => handleAddNewQuestion(categoryId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {/* Questions List with Sortable Context */}
              {categoryQuestions.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30 text-xs text-zinc-500">
                  No questions in this category yet. Click &quot;Add Question&quot; above.
                </div>
              ) : (
                <SortableContext
                  items={categoryQuestions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 gap-4">
                    {categoryQuestions.map((q) => (
                      <SortableQuestionItem
                        key={q.id}
                        question={q}
                        onEditPrompt={(id, text) => updateQuestion(id, { prompt: text })}
                        onEditAnswer={(id, text) => updateQuestion(id, { answer_outline: text })}
                        onTogglePin={togglePinQuestion}
                        onDelete={deleteQuestion}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
