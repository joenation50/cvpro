import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = [
  "deepseek/deepseek-v4-flash-0731:free",
  "inclusionai/ling-3.0-flash-fin:free",
  "nvidia/nemotron-3.5-lightning:free",
  "liquid/lfm2.5-2.6b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

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
  "readinessScore": <number 0-100, how prepared the candidate currently is based on CV vs job>,
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

    // ---- 1. Auth required ----
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to prepare for your interview.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // ---- 2. Free-fix check ----
    const { data: profile } = await supabase
      .from("profiles")
      .select("free_fixes_used")
      .eq("id", user.id)
      .single();

    const fixesUsed = profile?.free_fixes_used ?? 0;
    const isFreeFix = fixesUsed < FREE_FIX_LIMIT;

    // ---- 3. Parse + validate ----
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

    // ---- 5. AI call ----
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing API key." },
        { status: 500 }
      );
    }

    const userMessage = `CANDIDATE'S CV:\n${cv}\n\n---\n\nTARGET JOB DESCRIPTION:\n${job}\n\n---\n\nGenerate the interview prep pack. Return the JSON as specified.`;

    let lastError = "All models failed";

    for (const model of MODELS) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://getcvpro.netlify.app",
            "X-Title": "CVPro Interview Prep",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userMessage },
            ],
            temperature: 0.5,
            max_tokens: 4000,
          }),
          signal: AbortSignal.timeout(9000),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[interview-prep/${model}] HTTP ${res.status}:`, errText.slice(0, 200));
          lastError = `Model ${model} failed: ${res.status}`;
          continue;
        }

        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (!raw || typeof raw !== "string") {
          lastError = `Empty response from ${model}`;
          continue;
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
          lastError = `Malformed JSON from ${model}`;
          continue;
        }

        // ---- 6. Normalize ----
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
          lastError = `No questions from ${model}`;
          continue;
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

        // ---- 7. Increment free_fixes_used ----
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
            ? Math.max(0, FREE_FIX_LIMIT - (fixesUsed + 1))
            : 0,
        });
      } catch (err: any) {
        console.error(`[interview-prep/${model}] threw:`, err?.message);
        lastError = err?.message || `Error with ${model}`;
        continue;
      }
    }

    return NextResponse.json(
      { error: `AI service unavailable. ${lastError}` },
      { status: 502 }
    );
  } catch (err: any) {
    console.error("[/api/interview-prep] Top-level error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
