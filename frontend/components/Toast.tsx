'use client';

import { useKitStore } from '@/store/useKitStore';
import { Info, X } from 'lucide-react';

export default function Toast() {
  const { toastMessage, clearToast } = useKitStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-2xl shadow-black/80 max-w-md">
        <Info className="h-5 w-5 text-indigo-400 shrink-0" />
        <span className="text-sm font-medium leading-snug">{toastMessage}</span>
        <button
          onClick={clearToast}
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-auto"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
