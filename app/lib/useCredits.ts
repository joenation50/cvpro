"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export type TemplateId =
  | "classic"
  | "minimal"
  | "modern"
  | "executive"
  | "creative"
  | "corporate"
  | "academic"
  | "japa"
  | "tech";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  priceNaira: number;
  tier: "free" | "standard" | "premium";
  bestFor: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Template catalog — this is the single source of truth for pricing and labels
// ---------------------------------------------------------------------------
export const TEMPLATES: Record<TemplateId, TemplateInfo> = {
  classic: {
    id: "classic",
    name: "Classic",
    priceNaira: 0,
    tier: "free",
    bestFor: "Banks · Government · Law",
    description: "Traditional serif layout. Safe and formal.",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    priceNaira: 0,
    tier: "free",
    bestFor: "Tech · Remote · Startups",
    description: "Clean, spacious, distraction-free.",
  },
  modern: {
    id: "modern",
    name: "Modern",
    priceNaira: 1000,
    tier: "standard",
    bestFor: "Marketing · Product · Agencies",
    description: "Bold blue header, sans-serif.",
  },
  executive: {
    id: "executive",
    name: "Executive",
    priceNaira: 1000,
    tier: "standard",
    bestFor: "Senior roles · Management",
    description: "Two-column premium with gold accents.",
  },
  creative: {
    id: "creative",
    name: "Creative",
    priceNaira: 1500,
    tier: "premium",
    bestFor: "Designers · Creators",
    description: "Bold colors, expressive typography.",
  },
  corporate: {
    id: "corporate",
    name: "Corporate",
    priceNaira: 1500,
    tier: "premium",
    bestFor: "Consulting · Finance · Big 4",
    description: "Structured, dense, corporate-ready.",
  },
  academic: {
    id: "academic",
    name: "Academic",
    priceNaira: 1500,
    tier: "premium",
    bestFor: "Lecturers · Researchers · PhD",
    description: "Numbered sections, publications-friendly.",
  },
  japa: {
    id: "japa",
    name: "Japa",
    priceNaira: 1500,
    tier: "premium",
    bestFor: "UK · Canada · US · Australia",
    description: "Western format, ATS-optimized.",
  },
  tech: {
    id: "tech",
    name: "Tech",
    priceNaira: 1500,
    tier: "premium",
    bestFor: "Developers · Engineers · Data",
    description: "Monospace accents, GitHub-inspired.",
  },
};

export const FREE_FIX_LIMIT = 3;

export const FREE_TEMPLATES: TemplateId[] = ["classic", "minimal"];

export const STANDARD_TEMPLATES: TemplateId[] = ["modern", "executive"];

export const PREMIUM_TEMPLATES: TemplateId[] = [
  "creative",
  "corporate",
  "academic",
  "japa",
  "tech",
];

// ---------------------------------------------------------------------------
// Hook: fetch the logged-in user's profile (includes free_fixes_used)
// ---------------------------------------------------------------------------
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  free_fixes_used: number;
}

export function useCredits() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoggedIn(false);
          setLoading(false);
          return;
        }

        setLoggedIn(true);

        const { data } = await supabase
          .from("profiles")
          .select("id, email, full_name, free_fixes_used")
          .eq("id", user.id)
          .single();

        if (data) setProfile(data);
      } catch (err) {
        console.error("useCredits error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const fixesUsed = profile?.free_fixes_used ?? 0;
  const fixesLeft = Math.max(0, FREE_FIX_LIMIT - fixesUsed);
  const hasFreeFixesLeft = fixesLeft > 0;

  return {
    profile,
    loading,
    loggedIn,
    fixesUsed,
    fixesLeft,
    hasFreeFixesLeft,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function getTemplatePrice(templateId: TemplateId): number {
  return TEMPLATES[templateId]?.priceNaira ?? 0;
}
