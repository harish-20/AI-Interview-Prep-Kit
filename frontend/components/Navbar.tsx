'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useKitStore } from '@/store/useKitStore';
import { Sparkles, Plus, LogOut, Check, Loader2, AlertCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const { saveStatus, lastSaveError } = useKitStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for session expiry custom events
  useEffect(() => {
    const handleExpired = () => {
      logout();
    };
    window.addEventListener('auth-session-expired', handleExpired);
    return () => window.removeEventListener('auth-session-expired', handleExpired);
  }, [logout]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md text-zinc-100">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              AI Interview Prep Kit
            </span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  pathname === '/'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                Dashboard
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Save Status Badge for Kit Workspace */}
          {pathname.startsWith('/kits/') && saveStatus !== 'idle' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-zinc-800 bg-zinc-900/60">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span className="text-zinc-300">Saving edits...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">All changes saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  <span className="text-rose-400" title={lastSaveError || ''}>
                    Save failed
                  </span>
                </>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/kits/new"
                className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-500/30 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>New Kit</span>
              </Link>

              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs text-zinc-400">Logged in as</span>
                <span className="text-xs font-medium text-zinc-200 max-w-[160px] truncate">
                  {user?.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
