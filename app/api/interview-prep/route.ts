import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash",
];

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const FREE_FIX_LIMIT = 3;

const SYSTEM_PROMPT = `You are CVPro Interview Coach, an expert interview preparation assistant specializing in the Nigerian job market.

You receive:
- The applicant's CV
- A target job description

You must generate a personalized interview prep pack with 10 likely questions and model answers.

For EACH question, structure the answer using the STAR method:
- Situation: brief context
- Task: what needed to be done
- Action: what the candidate did (from their CV)
- Result: the outcome (with a number if possible)

RULES:
1. Questions must be tailored to the specific job + industry.
2. Include 5 behavioral + 3 technical/role-specific + 2 Nigeria-specific (e.g., "Why do you want to work in Lagos?").
3. Answers must draw ONLY from the candidate's actual CV — never fabricate experience.
4. Keep each answer to 60-90 seconds of speaking time (100-150 words).
5. Use Nigerian professional register — respectful, warm, confident.
6. Add a "coach tip" for each question (1 sentence on how to deliver it).

You MUST respond with ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact shape:
{
  "readinessScore": <number 0-100>,
  "questions": [
    {
      "category": "Behavioral" | "Technical" | "Nigeria-Specific",
      "question": "Tell me about a time...",
      "answer": "Situation: ... Task: ... Action: ... Result: ...",
      "coachTip": "Speak slowly and pause after the Result."
    }
  ],
  "topStrengths": ["strength 1", "strength 2", "strength 3"],
  "watchOuts": ["potential weakness 1", "potential weakness 2"]
}

Rules:
- 10 questions total (5 behavioral, 3 technical, 2 Nigeria-specific).
- readinessScore reflects actual match between CV and job.
- topStrengths: 3 specific strengths from the CV matching the job.
- watchOuts: 2 honest gaps the candidate should prepare to address.
- Never invent work experience.
- Never change dates.
- Never add fake degrees.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to prepare for your interview.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

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

    if (!isFreeFix && !paidFix) {
      return NextResponse.json(
        {
          error: "You've used your free fixes. Pay to continue.",
          code: "PAYMENT_REQUIRED",
        },
        { status: 402 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing Gemini API key." },
        { status: 500 }
      );
    }

    const userMessage = `CANDIDATE'S CV:\n${cv}\n\n---\n\nTARGET JOB DESCRIPTION:\n${job}\n\n---\n\nGenerate the interview prep pack. Return the JSON as specified.`;

    let lastError = "All Gemini models failed";
    let raw: string | null = null;

    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[/api/interview-prep] Trying Gemini model: ${model}`);

        const res = await fetch(
          `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`,
          {
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
                temperature: 0.5,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
              },
            }),
            signal: AbortSignal.timeout(60000),
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[${model}] HTTP ${res.status}:`, errText.slice(0, 200));
          lastError = `${model} failed: ${res.status}`;
          continue;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text || typeof text !== "string") {
          lastError = `${model} returned empty`;
          continue;
        }

        raw = text;
        console.log(`[/api/interview-prep] ✅ Success with ${model}`);
        break;
      } catch (err: any) {
        console.error(`[${model}] threw:`, err?.message);
        lastError = err?.message || `Error with ${model}`;
        continue;
      }
    }

    if (!raw) {
      return NextResponse.json(
        { error: `AI service unavailable. ${lastError}` },
        { status: 502 }
      );
    }

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

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
          .filter((q: any) => q && typeof q.question === "string")
          .map((q: any) => ({
            category: ["Behavioral", "Technical", "Nigeria-Specific"].includes(q.category)
              ? q.category
              : "Behavioral",
            question: q.question,
            answer: typeof q.answer === "string" ? q.answer : "",
            coachTip: typeof q.coachTip === "string" ? q.coachTip : "",
          }))
      : [];

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "AI returned no questions. Try again." },
        { status: 502 }
      );
    }

    const result = {
      readinessScore:
        typeof parsed.readinessScore === "number"
          ? Math.max(0, Math.min(100, Math.round(parsed.readinessScore)))
          : 60,
      questions,
      topStrengths: Array.isArray(parsed.topStrengths)
        ? parsed.topStrengths.filter((s: any) => typeof s === "string").slice(0, 5)
        : [],
      watchOuts: Array.isArray(parsed.watchOuts)
        ? parsed.watchOuts.filter((w: any) => typeof w === "string").slice(0, 5)
        : [],
    };

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
    console.error("[/api/interview-prep] Top-level error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
