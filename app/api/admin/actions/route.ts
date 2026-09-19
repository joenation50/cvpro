import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Auth via session
    const userSupabase = createServerSupabase();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Email allowlist
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // 3. Password check
    const body = await req.json().catch(() => ({}));
    const providedPassword = body?.password || "";
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminPassword || providedPassword !== adminPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const action = body?.action;
    const targetUserId = body?.userId;

    if (!action || !targetUserId) {
      return NextResponse.json(
        { error: "Missing action or userId" },
        { status: 400 }
      );
    }

    // 4. Service role client
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    // 5. Fetch current target user
    const { data: targetUser, error: fetchError } = await adminSupabase
      .from("profiles")
      .select("id, free_fixes_used, bonus_fixes, is_banned")
      .eq("id", targetUserId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 6. Route action
    if (action === "grant_fixes") {
      const amount = parseInt(body?.amount || "3", 10);
      if (amount < 1 || amount > 100) {
        return NextResponse.json(
          { error: "Amount must be between 1 and 100" },
          { status: 400 }
        );
      }

      const newBonus = (targetUser.bonus_fixes || 0) + amount;
      const { error } = await adminSupabase
        .from("profiles")
        .update({ bonus_fixes: newBonus })
        .eq("id", targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true, bonusFixes: newBonus });
    }

    if (action === "reset_fixes") {
      const { error } = await adminSupabase
        .from("profiles")
        .update({ free_fixes_used: 0, bonus_fixes: 0 })
        .eq("id", targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "ban") {
      const { error } = await adminSupabase
        .from("profiles")
        .update({ is_banned: true })
        .eq("id", targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true, banned: true });
    }

    if (action === "unban") {
      const { error } = await adminSupabase
        .from("profiles")
        .update({ is_banned: false })
        .eq("id", targetUserId);

      if (error) throw error;
      return NextResponse.json({ success: true, banned: false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[/api/admin/actions] error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
