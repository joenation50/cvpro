"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

interface UserInfo {
  email: string;
  name: string;
}

export function AuthHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({
          email: authUser.email || "",
          name:
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0] ||
            "there",
        });
      }
      setLoading(false);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || "",
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "there",
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 -mx-4 mb-4 border-b border-white/5 bg-ink/80 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/favicon-192.png"
            alt="CVPro"
            className="h-8 w-8 rounded-lg"
          />
          <span className="font-grotesk text-lg font-bold tracking-tight">
            <span className="text-white">CV</span>
            <span className="text-cyan">Pro</span>
          </span>
        </Link>

        {/* Desktop nav — only when logged in */}
        {user && (
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive("/")
                  ? "bg-white/10 text-white"
                  : "text-stone hover:text-white"
              }`}
            >
              CV Fixer
            </Link>
            <Link
              href="/cover-letter"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive("/cover-letter")
                  ? "bg-white/10 text-white"
                  : "text-stone hover:text-white"
              }`}
            >
              Cover Letter
            </Link>
            <Link
              href="/interview-prep"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive("/interview-prep")
                  ? "bg-white/10 text-white"
                  : "text-stone hover:text-white"
              }`}
            >
              Interview Prep
            </Link>
          </nav>
        )}

        {/* Auth area */}
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded-lg bg-white/5" />
        ) : user ? (
          <Link
            href="/account"
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition shrink-0 ${
              isActive("/account")
                ? "bg-white/10 text-white ring-white/20"
                : "bg-white/5 text-white ring-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-xs font-bold text-ink">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">My account</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-hover"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile nav — horizontal scroll */}
      {user && (
        <nav className="sm:hidden mt-2 flex items-center gap-1 overflow-x-auto -mx-1 px-1">
          <Link
            href="/"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              isActive("/")
                ? "bg-white/10 text-white"
                : "text-stone hover:text-white"
            }`}
          >
            CV Fixer
          </Link>
          <Link
            href="/cover-letter"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              isActive("/cover-letter")
                ? "bg-white/10 text-white"
                : "text-stone hover:text-white"
            }`}
          >
            Cover Letter
          </Link>
          <Link
            href="/interview-prep"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              isActive("/interview-prep")
                ? "bg-white/10 text-white"
                : "text-stone hover:text-white"
            }`}
          >
            Interview Prep
          </Link>
          <Link
            href="/account"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              isActive("/account")
                ? "bg-white/10 text-white"
                : "text-stone hover:text-white"
            }`}
          >
            Account
          </Link>
        </nav>
      )}
    </header>
  );
}
