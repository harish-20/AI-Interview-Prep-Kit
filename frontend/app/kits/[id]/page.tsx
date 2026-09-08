'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useKitStore } from '@/store/useKitStore';
import { PipelineStep } from '@/types/kit';
import ProgressOverlay from '@/components/ProgressOverlay';
import QuestionBankSection from '@/components/QuestionBankSection';
import FlashcardsSection from '@/components/FlashcardsSection';
import {
  Building2,
  Briefcase,
  HelpCircle,
  Layers,
  Calendar,
  ChevronLeft,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  Globe,
  Award,
} from 'lucide-react';

const DEFAULT_PIPELINE_STEPS: PipelineStep[] = [
  { id: 'extract', label: 'Extracting requirements & tech stack from JD', status: 'done' },
  { id: 'crawl', label: 'Crawling target company careers & tech blog', status: 'done' },
  { id: 'research', label: 'Analyzing company culture & engineering values', status: 'running' },
  { id: 'generate', label: 'Generating categorized question bank & flashcards', status: 'pending' },
  { id: 'coverage', label: 'Running coverage check across requirements', status: 'pending' },
  { id: 'schedule', label: 'Building day-by-day practice schedule', status: 'pending' },
];

export default function KitWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const kitId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<'brief' | 'role' | 'questions' | 'flashcards' | 'schedule'>('brief');
  const { currentKit, setKit } = useKitStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kit', kitId],
    queryFn: () => api.kits.get(kitId),
    refetchInterval: (query) => {
      const kit = query.state.data?.kit;
      return kit?.status === 'generating' ? 2000 : false;
    },
  });

  useEffect(() => {
    if (data?.kit) {
      setKit(data.kit);
    }
  }, [data, setKit]);

  const kit = currentKit || data?.kit;

  if (isLoading && !kit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-400 font-medium">Loading prep workspace...</p>
      </div>
    );
  }

  if (error || !kit) {
    return (
      <div className="mx-auto max-w-xl my-16 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Kit Not Found</h2>
        <p className="text-xs text-zinc-400">
          {(error as { message?: string })?.message || 'The requested prep kit could not be found or access was denied.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  // GENERATING STATE OVERLAY
  if (kit.status === 'generating') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProgressOverlay steps={DEFAULT_PIPELINE_STEPS} />
      </div>
    );
  }

  // FAILED STATE DISPLAY
  if (kit.status === 'failed') {
    return (
      <div className="mx-auto max-w-xl my-16 p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 text-center space-y-6">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Generation Failed</h2>
          <p className="text-xs text-rose-300">
            {kit.error || 'The research pipeline encountered an issue while scraping or generating your kit.'}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry Generation
          </button>
        </div>
      </div>
    );
  }

  // READY STATE - FULL WORKSPACE VIEW
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Workspace Breadcrumb & Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              <span>{kit.source?.company || 'Company Research'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              {kit.role?.title || 'Interview Workspace'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {kit.flashcards && kit.flashcards.length > 0 && (
              <Link
                href={`/kits/${kit._id}/practice`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all"
              >
                <BookOpen className="h-4 w-4" />
                <span>Practice Flashcards</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-zinc-800">
        <nav className="-mb-px flex space-x-8 overflow-x-auto text-sm font-medium">
          {[
            { id: 'brief', label: 'Company Brief', icon: Building2 },
            { id: 'role', label: 'Role & Requirements', icon: Briefcase },
            { id: 'questions', label: `Question Bank (${kit.questions?.length || 0})`, icon: HelpCircle },
            { id: 'flashcards', label: `Flashcards (${kit.flashcards?.length || 0})`, icon: Layers },
            { id: 'schedule', label: `Schedule (${kit.schedule?.days_available || 7}d)`, icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-xs sm:text-sm font-semibold transition-colors shrink-0 ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. COMPANY BRIEF TAB */}
      {activeTab === 'brief' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-400" />
                Executive Summary
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {kit.company_brief?.summary || 'No summary available.'}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
              <h3 className="text-base font-bold text-white">What They Do & Product Strategy</h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {kit.company_brief?.what_they_do || 'No product details parsed.'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Sources Analyzed</h3>
              <ul className="space-y-2 text-xs">
                {kit.company_brief?.sources?.map((src, i) => (
                  <li key={i} className="truncate text-indigo-400 hover:underline">
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      {src}
                    </a>
                  </li>
                )) || <li className="text-zinc-500">No external URLs parsed</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. ROLE & REQUIREMENTS TAB */}
      {activeTab === 'role' && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono uppercase text-indigo-400">{kit.role?.seniority || 'Mid/Senior'}</span>
                <h3 className="text-xl font-bold text-white">{kit.role?.title || 'Role Requirements'}</h3>
              </div>
            </div>

            {kit.role?.responsibilities && kit.role.responsibilities.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-mono uppercase text-zinc-400">Key Responsibilities</h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-zinc-300">
                  {kit.role.responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-400" />
              Parsed Requirements Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kit.role?.requirements?.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        req.kind === 'technical'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : req.kind === 'behavioural'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {req.kind}
                    </span>

                    <span
                      className={`text-[10px] font-mono uppercase font-semibold ${
                        req.priority === 'must' ? 'text-amber-400' : 'text-zinc-500'
                      }`}
                    >
                      {req.priority === 'must' ? 'Must Have' : 'Nice to Have'}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-zinc-200">{req.text}</p>
                </div>
              )) || <div className="text-xs text-zinc-500">No extracted requirements</div>}
            </div>
          </div>
        </div>
      )}

      {/* 3. QUESTION BANK TAB */}
      {activeTab === 'questions' && <QuestionBankSection kitId={kit._id} />}

      {/* 4. FLASHCARDS TAB */}
      {activeTab === 'flashcards' && <FlashcardsSection kitId={kit._id} />}

      {/* 5. SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white">Daily Study Plan ({kit.schedule?.days_available || 7} Days)</h3>
            <p className="text-xs text-zinc-400">Structured timeline to review all questions and flashcards before your interview.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kit.schedule?.days?.map((d) => (
              <div key={d.day} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase">Day {d.day}</span>
                  <span className="text-xs font-mono text-zinc-500">{d.minutes} mins</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{d.focus}</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {d.question_ids?.length || 0} questions assigned for review today.
                  </p>
                </div>
              </div>
            )) || <div className="text-xs text-zinc-500">No schedule generated yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
