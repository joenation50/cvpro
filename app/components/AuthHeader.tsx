"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

interface UserInfo {
  email: string;
  name: string;
}

export function AuthHeader() {
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

    // Listen for auth changes
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

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/10 transition hover:bg-white/10"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan text-xs font-bold text-ink">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline">My account</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
  );
}
