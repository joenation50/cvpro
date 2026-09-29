import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

const FREE_FIX_LIMIT = 3;

const SYSTEM_PROMPT = `You are CVPro, an expert CV writer specializing in the Nigerian job market and ATS (Applicant Tracking System) optimization.

You receive a user's current CV and a target job description. You must:
1. Analyze the CV against the job description.
2. Rewrite the CV to maximize ATS match while preserving the user's real experience — never fabricate.
3. Use strong action verbs (Led, Delivered, Engineered, Launched, Built, Drove).
4. Quantify achievements wherever possible.
5. Format for Nigerian recruiters — proper NYSC section, certifications, address format.
6. Keep it concise. Nigerian recruiters scan fast.

You MUST respond with ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact shape:
{
  "atsScore": <number between 0 and 100>,
  "rewrittenCv": "<the full rewritten CV as plain text with line breaks>",
  "missingKeywords": ["keyword1", "keyword2"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}

Rules:
- Never invent work experience.
- Never change dates.
- Never add fake degrees.
- atsScore must reflect real match between CV and job.
- missingKeywords: list 5-10 keywords/terms in the job description that are missing from the CV.
- improvements: list 3-6 short bullets describing what you improved.
- rewrittenCv: complete, ready-to-use CV text.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();

    // ---- 1. Auth required ----
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please log in to fix your CV.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    // ---- 2. Fetch profile + free-fix count ----
    const { data: profile } = await supabase
      .from("profiles")
      .select("free_fixes_used, bonus_fixes, is_banned")
      .eq("id", user.id)
      .single();

    if (profile?.is_banned) {
      return NextResponse.json(
        { error: "Your account has been suspended." },
        { status: 403 }
      );
    }

    const fixesUsed = profile?.free_fixes_used ?? 0;
    const bonusFixes = profile?.bonus_fixes ?? 0;
    const available = FREE_FIX_LIMIT + bonusFixes - fixesUsed;
    const isFreeFix = available > 0;

    // ---- 3. Parse + validate body ----
    const body = await req.json();
    const cv = body?.cv;
    const job = body?.jobDescription || body?.job;
    const template = body?.template || "classic";
    const paidFix = body?.paidFix === true;

    if (!cv || !job) {
      return NextResponse.json(
        { error: "Both CV and job description are required." },
        { status: 400 }
      );
    }

    if (typeof cv !== "string" || typeof job !== "string") {
      return NextResponse.json(
        { error: "CV and job description must be text." },
        { status: 400 }
      );
    }

    if (cv.length > 15000 || job.length > 15000) {
      return NextResponse.json(
        { error: "Input too long. Please keep under 15,000 characters each." },
        { status: 400 }
      );
    }

    // ---- 4. Payment gate ----
    if (!isFreeFix && !paidFix) {
      return NextResponse.json(
        {
          error: "You've used your free fixes. Pay to continue.",
          code: "PAYMENT_REQUIRED",
        },
        { status: 402 }
      );
    }

    // ---- 5. Check Gemini key ----
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Gemini API key." },
        { status: 500 }
      );
    }

    const userMessage = `CURRENT CV:\n${cv}\n\n---\n\nTARGET JOB DESCRIPTION:\n${job}\n\n---\n\nReturn the JSON as specified.`;

    // ---- 6. Call Gemini ----
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + "\n\n---\n\n" + userMessage }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error:", res.status, errText.slice(0, 300));
      return NextResponse.json(
        { error: `AI service error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw || typeof raw !== "string") {
      return NextResponse.json(
        { error: "Empty response from AI. Try again." },
        { status: 502 }
      );
    }

    // ---- 7. Parse JSON ----
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let jsonString = cleaned;
    if (!jsonString.startsWith("{")) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) jsonString = match[0];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return NextResponse.json(
        { error: "Malformed AI response. Try again." },
        { status: 502 }
      );
    }

    // ---- 8. Normalize result ----
    const result = {
      atsScore:
        typeof parsed.atsScore === "number"
          ? Math.max(0, Math.min(100, Math.round(parsed.atsScore)))
          : 0,
      rewrittenCv:
        typeof parsed.rewrittenCv === "string" ? parsed.rewrittenCv : "",
      missingKeywords: Array.isArray(parsed.missingKeywords)
        ? parsed.missingKeywords.filter((k: any) => typeof k === "string")
        : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.filter((i: any) => typeof i === "string")
        : [],
    };

    if (!result.rewrittenCv) {
      return NextResponse.json(
        { error: "AI returned empty CV. Try again." },
        { status: 502 }
      );
    }

    // ---- 9. Increment free_fixes_used if this was a free fix ----
    if (isFreeFix) {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ free_fixes_used: fixesUsed + 1 })
        .eq("id", user.id);

      if (updateErr) {
        console.error("[/api/fix] Failed to increment free_fixes_used:", updateErr);
      }
    }

    return NextResponse.json({
      ...result,
      isFreeFix,
      fixesRemaining: isFreeFix
        ? Math.max(0, FREE_FIX_LIMIT + bonusFixes - (fixesUsed + 1))
        : Math.max(0, FREE_FIX_LIMIT + bonusFixes - fixesUsed),
    });
  } catch (err: any) {
    console.error("[/api/fix] Top-level error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
