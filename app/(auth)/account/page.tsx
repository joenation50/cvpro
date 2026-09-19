"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  free_fixes_used: number;
  created_at: string;
}

interface Payment {
  id: string;
  template_id: string;
  amount_paid: number;
  currency: string;
  status: string;
  created_at: string;
}

const FREE_FIX_LIMIT = 3;

export default function AccountPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccount() {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login?redirect=/account");
          return;
        }

        setUserEmail(user.email || "");

        // Load profile
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileErr && profileErr.code !== "PGRST116") {
          // PGRST116 = row not found (fine, we'll just show defaults)
          console.warn("Profile fetch error:", profileErr);
        }
        if (profileData) setProfile(profileData);

        // Load payments
        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (paymentData) setPayments(paymentData);
      } catch (err: any) {
        setError(err.message || "Could not load account.");
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan" />
        <p className="mt-4 text-sm text-stone">Loading your account...</p>
      </div>
    );
  }

  // ---------- Error ----------
  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <div className="rounded-2xl bg-coral/10 p-6 text-center ring-1 ring-coral/20">
          <p className="text-sm text-coral">{error}</p>
          <button
            onClick={handleLogout}
            className="mt-4 text-xs text-stone hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const fixesUsed = profile?.free_fixes_used ?? 0;
  const fixesLeft = Math.max(0, FREE_FIX_LIMIT - fixesUsed);
  const displayName =
    profile?.full_name?.split(" ")[0] || userEmail.split("@")[0] || "there";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-stone transition hover:text-cyan"
      >
        ← Back to CVPro
      </Link>

      {/* Header */}
      <div className="rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-stone uppercase tracking-wider">
              Welcome back
            </p>
            <h1 className="mt-1 font-grotesk text-2xl font-bold text-white capitalize">
              Hi, {displayName} 👋
            </h1>
            <p className="mt-1 text-sm text-stone">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-stone ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Free fixes card */}
      <div className="mt-6 rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-grotesk text-lg font-bold text-white">
            Free fixes
          </h2>
          <span className="text-xs text-stone">Lifetime</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={`font-grotesk text-4xl font-extrabold ${
              fixesLeft > 0 ? "text-cyan" : "text-coral"
            }`}
          >
            {fixesLeft}
          </span>
          <span className="text-sm text-stone">of {FREE_FIX_LIMIT} remaining</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full transition-all ${
              fixesLeft === 0
                ? "bg-coral"
                : fixesLeft === 1
                ? "bg-amber"
                : "bg-cyan"
            }`}
            style={{ width: `${(fixesLeft / FREE_FIX_LIMIT) * 100}%` }}
          />
        </div>

        <p className="mt-4 text-xs text-stone">
          {fixesLeft > 0
            ? `You can fix ${fixesLeft} more ${
                fixesLeft === 1 ? "CV" : "CVs"
              } for free. After that, pay ₦1,000+ per fix.`
            : "You've used all your free fixes. Pay ₦1,000+ per fix from now on."}
        </p>

        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-hover"
        >
          ⚡ Fix a CV
        </Link>
      </div>

      {/* Payment history */}
      <div className="mt-6 rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10">
        <h2 className="font-grotesk text-lg font-bold text-white mb-3">
          Payment history
        </h2>

        {payments.length === 0 ? (
          <div className="rounded-xl bg-white/5 p-5 text-center ring-1 ring-white/5">
            <p className="text-sm text-stone">No payments yet.</p>
            <p className="mt-1 text-xs text-gray-600">
              You're on the free plan. When you buy a premium fix, it'll show
              here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-white/5 p-3 ring-1 ring-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-white capitalize">
                    {p.template_id} template
                  </p>
                  <p className="text-xs text-stone">
                    {new Date(p.created_at).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-cyan">
                    ₦{(p.amount_paid / 100).toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase text-stone">
                    {p.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/"
          className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 text-center"
        >
          <div className="text-2xl">⚡</div>
          <p className="mt-1 text-sm font-medium text-white">Fix a CV</p>
        </Link>
        <Link
          href="/about"
          className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 text-center"
        >
          <div className="text-2xl">💬</div>
          <p className="mt-1 text-sm font-medium text-white">About</p>
        </Link>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs text-gray-600">
        Need help? Email{" "}
        <a
          href="mailto:joenation98@gmail.com"
          className="text-stone hover:text-cyan"
        >
          joenation98@gmail.com
        </a>
      </p>
    </div>
  );
}
