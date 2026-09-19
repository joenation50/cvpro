"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/account`,
        },
      });

      if (error) throw error;

      // If email confirmation is enabled in Supabase, data.user exists but no session
      if (data.user && !data.session) {
        setSuccess(true);
        return;
      }

      // If confirmation is disabled, redirect immediately
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Could not create account. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10 text-center">
        <div className="text-4xl mb-3">📬</div>
        <h2 className="font-grotesk text-xl font-bold text-white">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-stone">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm text-cyan hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10">
      <h1 className="font-grotesk text-2xl font-bold text-white text-center">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-stone text-center">
        Get <strong className="text-white">3 free CV fixes</strong> — no card
        required.
      </p>

      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs font-medium text-stone mb-1"
          >
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Chinedu Okafor"
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none transition"
          />
        </div>

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none transition"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-stone mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
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
              Creating account...
            </>
          ) : (
            <>Create account — Free</>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-stone">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan hover:underline">
          Log in
        </Link>
      </p>

            <p className="mt-5 text-center text-[11px] text-gray-600 leading-relaxed">
        By signing up you agree to our{" "}
        <Link href="/terms" className="text-stone hover:text-cyan">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-stone hover:text-cyan">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
