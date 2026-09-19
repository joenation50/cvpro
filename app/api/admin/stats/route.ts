import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Auth via user's session (for admin verification)
    const userSupabase = createServerSupabase();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Email allowlist check
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
    const search = (body?.search || "").toString().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "";

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }

    if (providedPassword !== adminPassword) {
      return NextResponse.json(
        { error: "Invalid admin password" },
        { status: 401 }
      );
    }

    // 4. Service role client — bypasses RLS to read ALL profiles
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

    // 5. Fetch data with service role
    let userQuery = adminSupabase
      .from("profiles")
      .select(
        "id, email, full_name, free_fixes_used, bonus_fixes, is_banned, last_login, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (search) {
      userQuery = userQuery.or(
        `email.ilike.%${search}%,full_name.ilike.%${search}%`
      );
    }

    const [profilesRes, paymentsRes] = await Promise.all([
      userQuery,
      adminSupabase
        .from("payments")
        .select("id, user_id, template_id, amount_paid, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (profilesRes.error) {
      console.error("Profiles fetch error:", profilesRes.error);
      return NextResponse.json(
        { error: "Failed to fetch profiles: " + profilesRes.error.message },
        { status: 500 }
      );
    }

    const profiles = profilesRes.data || [];
    const payments = paymentsRes.data || [];

    // 6. Compute totals
    const totalUsers = profiles.length;
    const totalFixes = profiles.reduce(
      (sum, p) => sum + (p.free_fixes_used || 0) + (p.bonus_fixes || 0),
      0
    );
    const successPayments = payments.filter((p) => p.status === "success");
    const totalRevenue = successPayments.reduce(
      (sum, p) => sum + (p.amount_paid || 0),
      0
    );

    // 7. Revenue per template
    const revenueByTemplate: Record<
      string,
      { count: number; total: number }
    > = {};
    successPayments.forEach((p) => {
      const t = p.template_id || "unknown";
      if (!revenueByTemplate[t]) revenueByTemplate[t] = { count: 0, total: 0 };
      revenueByTemplate[t].count += 1;
      revenueByTemplate[t].total += p.amount_paid || 0;
    });

    // 8. Last 7 days stats
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyStats: Record<string, { signups: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dailyStats[d.toISOString().split("T")[0]] = { signups: 0, revenue: 0 };
    }

    profiles.forEach((p) => {
      if (!p.created_at) return;
      const date = new Date(p.created_at);
      if (date >= sevenDaysAgo) {
        const key = date.toISOString().split("T")[0];
        if (dailyStats[key]) dailyStats[key].signups += 1;
      }
    });

    successPayments.forEach((p) => {
      if (!p.created_at) return;
      const date = new Date(p.created_at);
      if (date >= sevenDaysAgo) {
        const key = date.toISOString().split("T")[0];
        if (dailyStats[key]) dailyStats[key].revenue += p.amount_paid || 0;
      }
    });

    return NextResponse.json({
      totals: {
        users: totalUsers,
        fixes: totalFixes,
        revenue: totalRevenue,
        banned: profiles.filter((p) => p.is_banned).length,
      },
      recentUsers: profiles.slice(0, 30).map((p) => ({
        id: p.id,
        email: p.email,
        name: p.full_name,
        fixes: (p.free_fixes_used || 0) + (p.bonus_fixes || 0),
        freeUsed: p.free_fixes_used || 0,
        bonus: p.bonus_fixes || 0,
        banned: p.is_banned || false,
        joined: p.created_at,
        lastLogin: p.last_login,
      })),
      recentPayments: payments.slice(0, 20).map((p) => ({
        id: p.id,
        userId: p.user_id,
        template: p.template_id,
        amount: p.amount_paid,
        status: p.status,
        date: p.created_at,
      })),
      revenueByTemplate,
      dailyStats,
      adminEmail: user.email,
    });
  } catch (err: any) {
    console.error("[/api/admin/stats] error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
