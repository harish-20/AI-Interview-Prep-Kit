'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Kit } from '@/types/kit';
import {
  Plus,
  Building2,
  Loader2,
  Trash2,
  ExternalLink,
  BookOpen,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['kits'],
    queryFn: api.kits.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.kits.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kits'] });
      setDeleteConfirmId(null);
    },
  });

  const kits = data?.kits || [];

  const getStatusBadge = (status: Kit['status']) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Your Interview Prep Kits
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your AI-generated company research, question banks, and flashcard sets
          </p>
        </div>

        <Link
          href="/kits/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-500/30 active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Kit</span>
        </Link>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-5 bg-zinc-800 rounded w-1/3" />
                <div className="h-6 bg-zinc-800 rounded w-3/4" />
                <div className="h-4 bg-zinc-800/60 rounded w-1/2" />
              </div>
              <div className="h-10 bg-zinc-800/50 rounded-lg w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-rose-200">Unable to load kits</h3>
            <p className="text-sm mt-1 text-rose-300/80">
              {(error as { message?: string })?.message || 'Something went wrong while connecting to the server.'}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && kits.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-indigo-400 shadow-xl mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No interview kits yet</h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-md">
            Paste a job description or company link to generate customized questions, flashcards, and a day-by-day prep plan.
          </p>
          <Link
            href="/kits/new"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-500/30"
          >
            <Plus className="h-4 w-4" />
            <span>Generate First Kit</span>
          </Link>
        </div>
      )}

      {/* Kit Grid */}
      {!isLoading && !error && kits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map((kit) => (
            <div
              key={kit._id}
              className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm transition-all hover:border-zinc-700 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  {getStatusBadge(kit.status)}
                  <button
                    onClick={() => setDeleteConfirmId(kit._id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                    title="Delete Kit"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{kit.source?.company || 'Company Research'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {kit.role?.title || kit.source?.role || 'Interview Prep Kit'}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {kit.company_brief?.summary || 'Targeted prep questions and flashcards.'}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-b border-zinc-800/80 py-3 text-center text-xs">
                  <div>
                    <span className="block font-semibold text-zinc-200">{kit.questions?.length || 0}</span>
                    <span className="text-zinc-500">Questions</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-zinc-200">{kit.flashcards?.length || 0}</span>
                    <span className="text-zinc-500">Flashcards</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-zinc-200">{kit.schedule?.days_available || 7}d</span>
                    <span className="text-zinc-500">Schedule</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Link
                  href={`/kits/${kit._id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs transition-colors"
                >
                  <span>Open Workspace</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>

                {kit.status === 'ready' && kit.flashcards && kit.flashcards.length > 0 && (
                  <Link
                    href={`/kits/${kit._id}/practice`}
                    className="inline-flex items-center justify-center p-2 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition-all"
                    title="Start Practice Session"
                  >
                    <BookOpen className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {/* Delete Confirmation Modal / Overlay */}
              {deleteConfirmId === kit._id && (
                <div className="absolute inset-0 z-10 rounded-2xl bg-zinc-950/95 backdrop-blur-md p-6 flex flex-col justify-center items-center text-center space-y-4 animate-in fade-in duration-150">
                  <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Delete this kit?</h4>
                    <p className="text-xs text-zinc-400 mt-1">This action cannot be undone.</p>
                  </div>
                  <div className="flex items-center gap-2 w-full pt-2">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(kit._id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1"
                    >
                      {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
