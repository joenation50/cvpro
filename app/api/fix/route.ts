import { NextRequest, NextResponse } from "next/server";

/**
 * CVPro — /api/fix
 * Accepts { cv, jobDescription }, calls OpenRouter (free models), returns
 * { atsScore, rewrittenCv, missingKeywords, improvements }.
 * Rate-limited per IP with a simple in-memory map (Phase 1 only).
 */

// ---------- OpenRouter config (free models with fallback) ----------
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free", // fallback if the first rate-limits/fails
];

const SYSTEM_PROMPT = `You are CVPro, an expert CV writer specializing in the Nigerian job market and ATS (Applicant Tracking System) optimization. You receive a user's current CV and a target job description. You must:
1. Analyze the CV against the job description.
2. Rewrite the CV to maximize ATS match while preserving the user's real experience — never fabricate.
3. Use strong action verbs (Led, Delivered, Engineered, Launched).
4. Quantify achievements wherever possible (add realistic metrics if missing, but mark them [estimate] for the user to confirm).
5. Format for Nigerian recruiters — proper NYSC section, certifications, address format.
6. Return JSON with: { atsScore (0-100), rewrittenCv (markdown), missingKeywords (array), improvements (array of 3-5 bullet points) }
Never invent work experience. Never change dates. Never add fake degrees.`;

// ---------- In-memory rate limiting (Phase 1) ----------
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5; // 5 CV fixes per hour per IP — keep API costs at zero
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

// ---------- OpenRouter call ----------
async function callOpenRouter(cv: string, jobDescription: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const lastError: unknown = null;
  for (const model of MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          // Optional but recommended by OpenRouter for app attribution
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://cvpro.vercel.app",
          "X-Title": "CVPro",
        },
        body: JSON.stringify({
          // Try each free model in order; fall back if one fails
          model,
          temperature: 0.4,
          max_tokens: 3000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `CURRENT CV:\n"""\n${cv.slice(0, 12000)}\n"""\n\nTARGET JOB DESCRIPTION:\n"""\n${jobDescription.slice(0, 6000)}\n"""\n\nReturn ONLY valid JSON.`,
            },
          ],
        }),
      });

      if (!res.ok) continue; // try fallback model

      const data = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) continue;

      // Parse the model's JSON output (strip optional markdown fences)
      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        atsScore: typeof parsed.atsScore === "number" ? parsed.atsScore : 0,
        rewrittenCv: String(parsed.rewrittenCv ?? ""),
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 10) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 6) : [],
      };
    } catch {
      // try next model
    }
  }
  void lastError;
  throw new Error("AI_FAILED");
}

// ---------- POST handler ----------
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: "Rate limit reached. Try again in an hour.",
          pidgin: "You don do too much for now. Come back after one hour.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const cv = typeof body?.cv === "string" ? body.cv.trim() : "";
    const jobDescription =
      typeof body?.jobDescription === "string" ? body.jobDescription.trim() : "";

    if (!cv || cv.length < 50) {
      return NextResponse.json(
        { error: "Please paste your full CV.", pidgin: "Abeg paste your CV well." },
        { status: 400 }
      );
    }
    if (!jobDescription || jobDescription.length < 30) {
      return NextResponse.json(
        {
          error: "Please paste the job description.",
          pidgin: "Abeg paste the job description too.",
        },
        { status: 400 }
      );
    }

    const result = await callOpenRouter(cv, jobDescription);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";
    const map: Record<string, { msg: string; status: number }> = {
      MISSING_API_KEY: { msg: "Service not configured yet. Contact support.", status: 503 },
      AI_FAILED: { msg: "Something spoil. Try again.", status: 502 },
    };
    const fallback = { msg: "Something spoil. Try again.", status: 500 };
    const m = map[message] ?? fallback;
    return NextResponse.json({ error: m.msg, pidgin: "Something spoil. Try again." }, { status: m.status });
  }
}
