'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Sparkles, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isExpired = searchParams.get('expired') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login(email, password);
      setUser(response.user);
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-zinc-900/60 p-8 rounded-2xl border border-zinc-800 backdrop-blur-xl shadow-2xl">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/25 mb-2">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
        <p className="text-sm text-zinc-400">Log in to access your interview prep workspace</p>
      </div>

      {isExpired && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Your session has expired. Please log in again.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition-all hover:shadow-indigo-500/35 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-zinc-800/80">
        <p className="text-xs text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-zinc-400 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
