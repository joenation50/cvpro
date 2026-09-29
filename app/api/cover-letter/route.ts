import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

const FREE_FIX_LIMIT = 3;

type Tone = "professional" | "friendly" | "bold";

const TONE_GUIDES: Record<Tone, string> = {
  professional:
    "Professional, formal, and business-appropriate. Confident but not boastful. Standard corporate register.",
  friendly:
    "Warm, approachable, and genuine. Conversational but still respectful. Feels human, not robotic.",
  bold:
    "Confident, direct, and assertive. Strong opening line. Shows ambition and initiative. Memorable but not arrogant.",
};

const SYSTEM_PROMPT = `You are CVPro, an expert cover letter writer specializing in the Nigerian job market.

You receive:
- The applicant's CV (their background, experience, skills, education)
- A target job description
- A tone preference (professional, friendly, or bold)

You must write a cover letter that:
1. Is tailored to the specific job — references the company/role where possible.
2. Opens with a compelling hook (NOT "I am writing to apply for...")
3. Highlights 2-3 achievements from the CV that directly match the job requirements.
4. Uses Nigerian-appropriate professional language (respectful, warm, confident).
5. Is concise — maximum 350 words.
6. Closes with a clear call to action.
7. Never fabricates experience, dates, or credentials.
8. Never uses generic filler phrases.

Format:
- Include a header with "Dear Hiring Manager," (or the company name if given).
- 3-4 paragraphs: hook, fit, achievements, close.
- Sign off professionally.

You MUST respond with ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact shape:
{
  "coverLetter": "<the full cover letter as plain text with proper line breaks>",
  "wordCount": <number>,
  "highlights": ["key point 1", "key point 2", "key point 3"]
}

Rules:
- Never invent work experience.
- Never change dates.
- Never add fake degrees.
- Maximum 350 words.
- Nigerian professional register — respectful, warm, direct.
- Highlights: 3 short bullets showing what you emphasized.
- coverLetter: complete, ready-to-send text.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();

    // ---- 1. Auth required ----
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to generate a cover letter.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // ---- 2. Free-fix check ----
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

    // ---- 3. Parse body ----
    const body = await req.json();
    const cv = body?.cv;
    const job = body?.jobDescription || body?.job;
    const template = body?.template || "classic";
    const tone: Tone = body?.tone || "professional";
    const companyName = body?.companyName || "";
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

    if (!["professional", "friendly", "bold"].includes(tone)) {
      return NextResponse.json(
        { error: "Invalid tone. Choose professional, friendly, or bold." },
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

    const toneGuide = TONE_GUIDES[tone];
    const companyLine = companyName
      ? `\n\nCOMPANY NAME (use in opening): ${companyName}`
      : "";

    const userMessage = `APPLICANT'S CV:\n${cv}\n\n---\n\nTARGET JOB DESCRIPTION:\n${job}${companyLine}\n\n---\n\nTONE: ${tone}\nTONE GUIDE: ${toneGuide}\n\nWrite the cover letter. Return the JSON as specified.`;

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
          temperature: 0.6,
          maxOutputTokens: 2048,
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

    // ---- 8. Normalize ----
    const coverLetter =
      typeof parsed.coverLetter === "string" ? parsed.coverLetter : "";

    if (!coverLetter || coverLetter.length < 100) {
      return NextResponse.json(
        { error: "AI returned empty letter. Try again." },
        { status: 502 }
      );
    }

    const result = {
      coverLetter,
      wordCount:
        typeof parsed.wordCount === "number"
          ? parsed.wordCount
          : coverLetter.split(/\s+/).filter(Boolean).length,
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.filter((h: any) => typeof h === "string")
        : [],
    };

    // ---- 9. Increment free_fixes_used ----
    if (isFreeFix) {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ free_fixes_used: fixesUsed + 1 })
        .eq("id", user.id);
      if (updateErr) console.error("Increment failed:", updateErr);
    }

    return NextResponse.json({
      ...result,
      isFreeFix,
      fixesRemaining: isFreeFix
        ? Math.max(0, FREE_FIX_LIMIT + bonusFixes - (fixesUsed + 1))
        : Math.max(0, FREE_FIX_LIMIT + bonusFixes - fixesUsed),
    });
  } catch (err: any) {
    console.error("[/api/cover-letter] Top-level error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
