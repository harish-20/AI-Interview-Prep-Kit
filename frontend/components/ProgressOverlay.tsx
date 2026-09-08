'use client';

import { PipelineStep } from '@/types/kit';
import { Loader2, CheckCircle2, Circle, XCircle, MinusCircle, Sparkles } from 'lucide-react';

interface ProgressOverlayProps {
  steps: PipelineStep[];
}

export default function ProgressOverlay({ steps }: ProgressOverlayProps) {
  return (
    <div className="w-full max-w-2xl mx-auto my-12 bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6 text-center">
      <div className="space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1 animate-pulse">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Generating Your Interview Kit</h2>
        <p className="text-xs text-zinc-400">
          Extracting role requirements, researching company insights, and curating practice questions...
        </p>
      </div>

      <div className="space-y-3 pt-2 text-left">
        {steps.map((step, idx) => {
          const isPending = step.status === 'pending';
          const isRunning = step.status === 'running';
          const isDone = step.status === 'done';
          const isSkipped = step.status === 'skipped';
          const isFailed = step.status === 'failed';

          return (
            <div
              key={step.id || idx}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                isRunning
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
                  : isDone
                  ? 'bg-zinc-950/40 border-zinc-800 text-zinc-200'
                  : isSkipped
                  ? 'bg-zinc-950/20 border-zinc-800/50 text-zinc-500'
                  : isFailed
                  ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                  : 'bg-zinc-950/20 border-zinc-900 text-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  {isPending && <Circle className="h-4 w-4 text-zinc-600" />}
                  {isRunning && <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />}
                  {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {isSkipped && (
                    <div title={step.reason || 'Skipped step'}>
                      <MinusCircle className="h-4 w-4 text-zinc-500" />
                    </div>
                  )}
                  {isFailed && <XCircle className="h-4 w-4 text-rose-400" />}
                </div>

                <span className="text-sm font-medium">{step.label}</span>
              </div>

              <div className="text-xs">
                {isRunning && <span className="text-indigo-400 font-mono text-[11px]">Processing...</span>}
                {isDone && <span className="text-emerald-400 font-mono text-[11px]">Completed</span>}
                {isSkipped && (
                  <span className="text-zinc-500 italic text-[11px]" title={step.reason}>
                    {step.reason ? `Skipped (${step.reason})` : 'Skipped'}
                  </span>
                )}
                {isFailed && <span className="text-rose-400 font-semibold">{step.error || 'Failed'}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
