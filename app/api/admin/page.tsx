"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  fixes: number;
  freeUsed: number;
  bonus: number;
  banned: boolean;
  joined: string;
  lastLogin: string | null;
}

interface Payment {
  id: string;
  userId: string;
  template: string;
  amount: number;
  status: string;
  date: string;
}

interface Stats {
  totals: { users: number; fixes: number; revenue: number; banned: number };
  recentUsers: User[];
  recentPayments: Payment[];
  revenueByTemplate: Record<string, { count: number; total: number }>;
  dailyStats: Record<string, { signups: number; revenue: number }>;
  adminEmail: string;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "payments">(
    "overview"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?redirect=/admin");
        return;
      }
      setUserEmail(user.email || "");

      const cached = sessionStorage.getItem("cvpro_admin_unlocked");
      const cachedPw = sessionStorage.getItem("cvpro_admin_pw");
      if (cached === "true" && cachedPw) {
        setUnlocked(true);
        loadStats(cachedPw);
      } else {
        setCheckingAuth(false);
      }
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!unlocked || !stats) return;
    const interval = setInterval(() => {
      const cachedPw = sessionStorage.getItem("cvpro_admin_pw");
      if (cachedPw) loadStats(cachedPw, true);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, stats]);

  async function loadStats(pw: string, silent = false) {
    if (!silent) setStatsError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, search }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (!silent) {
          setStatsError(data.error || "Failed to load stats");
          setUnlocked(false);
          sessionStorage.removeItem("cvpro_admin_unlocked");
          sessionStorage.removeItem("cvpro_admin_pw");
          setCheckingAuth(false);
        }
        return;
      }

      setStats(data);
      setUnlocked(true);
      sessionStorage.setItem("cvpro_admin_unlocked", "true");
      sessionStorage.setItem("cvpro_admin_pw", pw);
      setCheckingAuth(false);
    } catch (err: any) {
      if (!silent) {
        setStatsError(err?.message || "Something went wrong");
        setCheckingAuth(false);
      }
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUnlockError(data.error || "Incorrect password");
        return;
      }
      setStats(data);
      setUnlocked(true);
      sessionStorage.setItem("cvpro_admin_unlocked", "true");
      sessionStorage.setItem("cvpro_admin_pw", password);
    } catch (err: any) {
      setUnlockError(err?.message || "Something went wrong");
    } finally {
      setUnlocking(false);
    }
  }

  async function doAction(userId: string, action: string, amount?: number) {
    const cachedPw = sessionStorage.getItem("cvpro_admin_pw");
    if (!cachedPw) return;

    setActionLoading(`${userId}:${action}`);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: cachedPw,
          action,
          userId,
          amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMessage(`Error: ${data.error}`);
        return;
      }
      setActionMessage(`✓ Action "${action}" applied`);
      await loadStats(cachedPw, true);
    } catch (err: any) {
      setActionMessage(`Error: ${err?.message}`);
    } finally {
      setActionLoading(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const cachedPw = sessionStorage.getItem("cvpro_admin_pw");
    if (cachedPw) loadStats(cachedPw);
  }

  async function handleLogout() {
    sessionStorage.removeItem("cvpro_admin_unlocked");
    sessionStorage.removeItem("cvpro_admin_pw");
    await supabase.auth.signOut();
    router.push("/");
  }

  // ---- Loading ----
  if (checkingAuth) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan" />
        <p className="mt-4 text-sm text-stone">Checking access...</p>
      </div>
    );
  }

  // ---- Password gate ----
  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl bg-navy/40 p-6 ring-1 ring-white/10">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🛡️</div>
            <h1 className="font-grotesk text-2xl font-bold text-white">
              Admin Access
            </h1>
            <p className="mt-1 text-xs text-stone">
              Signed in as {userEmail}
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label
                htmlFor="pw"
                className="block text-xs font-medium text-stone mb-1"
              >
                Admin password
              </label>
              <input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none transition"
                autoFocus
              />
            </div>

            {unlockError && (
              <p className="rounded-xl bg-coral/10 p-3 text-xs text-coral ring-1 ring-coral/20">
                {unlockError}
              </p>
            )}

            <button
              type="submit"
              disabled={unlocking || !password.trim()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue font-semibold text-white transition hover:bg-blue-hover active:scale-[0.98] disabled:opacity-60"
            >
              {unlocking ? "Verifying..." : "Unlock admin panel"}
            </button>
          </form>

          <button
            onClick={handleLogout}
            className="mt-4 block w-full text-center text-xs text-stone hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const days = Object.entries(stats.dailyStats).slice(-7);
  const maxSignups = Math.max(...days.map(([, v]) => v.signups), 1);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-grotesk text-2xl font-bold text-white">
            🛡️ CVPro Admin
          </h1>
          <p className="mt-1 text-xs text-stone">
            {stats.adminEmail} · auto-refresh 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sessionStorage.clear();
              setUnlocked(false);
              setStats(null);
              setPassword("");
            }}
            className="rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-stone ring-1 ring-white/10 hover:bg-white/10"
          >
            Lock
          </button>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-coral/10 px-3 py-2 text-xs font-medium text-coral ring-1 ring-coral/20 hover:bg-coral/20"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Action message toast */}
      {actionMessage && (
        <div
          className={`mb-4 rounded-xl p-3 text-xs ${
            actionMessage.startsWith("Error")
              ? "bg-coral/10 text-coral ring-1 ring-coral/20"
              : "bg-emerald/10 text-emerald ring-1 ring-emerald/20"
          }`}
        >
          {actionMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-navy/40 p-1 ring-1 ring-white/10">
        {(["overview", "users", "payments"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${
              activeTab === tab
                ? "bg-blue text-white"
                : "text-stone hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ============ OVERVIEW TAB ============ */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard icon="👥" label="Users" value={stats.totals.users.toString()} color="cyan" />
            <StatCard icon="⚡" label="Fixes" value={stats.totals.fixes.toString()} color="emerald" />
            <StatCard icon="💰" label="Revenue" value={`₦${(stats.totals.revenue / 100).toLocaleString()}`} color="amber" />
            <StatCard icon="🚫" label="Banned" value={stats.totals.banned.toString()} color="coral" />
          </div>

          {/* 7-day chart */}
          <section className="mb-8">
            <h2 className="mb-3 font-grotesk text-lg font-bold text-white">
              Last 7 days
            </h2>
            <div className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10">
              <div className="flex items-end justify-between gap-2 h-32">
                {days.map(([date, d]) => {
                  const height = (d.signups / maxSignups) * 100;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-[10px] text-cyan font-semibold">
                        {d.signups > 0 ? d.signups : ""}
                      </div>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-blue to-cyan"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                      </div>
                      <div className="text-[9px] text-stone">
                        {new Date(date).toLocaleDateString("en-NG", { weekday: "short" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Revenue by template */}
          <section className="mb-8">
            <h2 className="mb-3 font-grotesk text-lg font-bold text-white">
              Revenue by template
            </h2>
            {Object.keys(stats.revenueByTemplate).length === 0 ? (
              <div className="rounded-2xl bg-navy/40 p-6 text-center ring-1 ring-white/10">
                <p className="text-sm text-stone">No payments yet.</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-navy/40 p-4 ring-1 ring-white/10 space-y-2">
                {Object.entries(stats.revenueByTemplate)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([template, data]) => (
                    <div
                      key={template}
                      className="flex items-center justify-between rounded-xl bg-white/5 p-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white capitalize">
                          {template}
                        </div>
                        <div className="text-[10px] text-stone">
                          {data.count} {data.count === 1 ? "purchase" : "purchases"}
                        </div>
                      </div>
                      <div className="font-grotesk text-lg font-extrabold text-cyan">
                        ₦{(data.total / 100).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============ USERS TAB ============ */}
      {activeTab === "users" && (
        <>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by email or name..."
              className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-stone ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue px-4 py-3 text-sm font-semibold text-white hover:bg-blue-hover"
            >
              Search
            </button>
          </form>

          {stats.recentUsers.length === 0 ? (
            <div className="rounded-2xl bg-navy/40 p-6 text-center ring-1 ring-white/10">
              <p className="text-sm text-stone">
                {search ? "No matching users." : "No users yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-2xl bg-navy/40 p-4 ring-1 ring-white/10"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">
                        {u.email}
                        {u.banned && (
                          <span className="ml-2 rounded-full bg-coral/20 px-2 py-0.5 text-[10px] text-coral">
                            BANNED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone">
                        {u.name || "—"} · joined{" "}
                        {new Date(u.joined).toLocaleDateString("en-NG")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-stone">
                        Fixes
                      </div>
                      <div className="text-lg font-bold text-cyan">
                        {u.fixes}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {u.freeUsed} used · {u.bonus} bonus
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={actionLoading === `${u.id}:grant_fixes`}
                      onClick={() => doAction(u.id, "grant_fixes", 3)}
                      className="rounded-lg bg-emerald/15 px-3 py-1.5 text-[11px] font-semibold text-emerald hover:bg-emerald/25 disabled:opacity-50"
                    >
                      +3 fixes
                    </button>
                    <button
                      disabled={actionLoading === `${u.id}:reset_fixes`}
                      onClick={() => {
                        if (confirm("Reset all fixes for this user?"))
                          doAction(u.id, "reset_fixes");
                      }}
                      className="rounded-lg bg-amber/15 px-3 py-1.5 text-[11px] font-semibold text-amber hover:bg-amber/25 disabled:opacity-50"
                    >
                      Reset
                    </button>
                    {u.banned ? (
                      <button
                        disabled={actionLoading === `${u.id}:unban`}
                        onClick={() => doAction(u.id, "unban")}
                        className="rounded-lg bg-cyan/15 px-3 py-1.5 text-[11px] font-semibold text-cyan hover:bg-cyan/25 disabled:opacity-50"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        disabled={actionLoading === `${u.id}:ban`}
                        onClick={() => {
                          if (confirm("Ban this user?")) doAction(u.id, "ban");
                        }}
                        className="rounded-lg bg-coral/15 px-3 py-1.5 text-[11px] font-semibold text-coral hover:bg-coral/25 disabled:opacity-50"
                      >
                        Ban
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ PAYMENTS TAB ============ */}
      {activeTab === "payments" && (
        <>
          {stats.recentPayments.length === 0 ? (
            <div className="rounded-2xl bg-navy/40 p-6 text-center ring-1 ring-white/10">
              <p className="text-sm text-stone">No payments yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-navy/40 ring-1 ring-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-white/5">
                    <tr className="text-left text-stone">
                      <th className="px-4 py-3 font-medium">Template</th>
                      <th className="px-4 py-3 font-medium text-center">Amount</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPayments.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`border-t border-white/5 ${
                          i % 2 === 1 ? "bg-white/[0.02]" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-white capitalize font-medium">
                          {p.template}
                        </td>
                        <td className="px-4 py-3 text-center text-cyan font-semibold">
                          ₦{(p.amount / 100).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              p.status === "success"
                                ? "bg-emerald/15 text-emerald"
                                : "bg-amber/15 text-amber"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-stone">
                          {new Date(p.date).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <p className="mt-8 text-center text-[11px] text-gray-600">
        Admin session locks when you close this tab.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: "cyan" | "emerald" | "amber" | "coral";
}) {
  const colorClasses = {
    cyan: "text-cyan",
    emerald: "text-emerald",
    amber: "text-amber",
    coral: "text-coral",
  };
  return (
    <div className="rounded-2xl bg-navy/40 p-4 ring-1 ring-white/10">
      <div className="text-xl">{icon}</div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-stone">
        {label}
      </div>
      <div className={`mt-1 font-grotesk text-xl font-extrabold ${colorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
}
