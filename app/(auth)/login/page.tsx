"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabase();

  const redirectTo = searchParams.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/account`,
        }
      );
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Could not send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- Reset success screen ----------
  if (resetSent) {
    return (
      <div className="rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10 text-center">
        <div className="text-4xl mb-3">📧</div>
        <h2 className="font-grotesk text-xl font-bold text-white">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-stone">
          We sent a password reset link to <strong>{email}</strong>.
        </p>
        <button
          onClick={() => {
            setResetSent(false);
            setResetMode(false);
          }}
          className="mt-5 text-sm text-cyan hover:underline"
        >
          Back to login
        </button>
      </div>
    );
  }

  // ---------- Reset form ----------
  if (resetMode) {
    return (
      <div className="rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10">
        <h1 className="font-grotesk text-2xl font-bold text-white text-center">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-stone text-center">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="resetEmail"
              className="block text-xs font-medium text-stone mb-1"
            >
              Email
            </label>
            <input
              id="resetEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none transition"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-coral/10 p-3 text-xs text-coral ring-1 ring-coral/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue font-semibold text-white transition hover:bg-blue-hover active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Sending...
              </>
            ) : (
              <>Send reset link</>
            )}
          </button>
        </form>

        <button
          onClick={() => {
            setResetMode(false);
            setError(null);
          }}
          className="mt-5 block w-full text-center text-sm text-cyan hover:underline"
        >
          Back to login
        </button>
      </div>
    );
  }

  // ---------- Login form ----------
  return (
    <div className="rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10">
      <h1 className="font-grotesk text-2xl font-bold text-white text-center">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-stone text-center">
        Log in to keep fixing your CV.
      </p>

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-stone mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-stone"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setResetMode(true)}
              className="text-xs text-cyan hover:underline"
            >
              Forgot?
            </button>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none transition"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-coral/10 p-3 text-xs text-coral ring-1 ring-coral/20">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue font-semibold text-white transition hover:bg-blue-hover active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Logging in...
            </>
          ) : (
            <>Log in</>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-stone">
        Don't have an account?{" "}
        <Link href="/signup" className="text-cyan hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
