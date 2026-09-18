import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CVPro — /api/fix
 * Accepts { cv, job }, calls OpenRouter (free models), returns
 * { atsScore, rewrittenCv, missingKeywords, improvements }.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS = [
  "google/gemini-flash-1.5-8b:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
];

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
    const body = await req.json();
    const cv = body?.cv;
    const job = body?.jobDescription ||body?.job;

    if (!cv || !job) {
      return NextResponse.json(
        { error: "Both CV and job description are required." },
        { status: 400 }
      );
    }

    if (cv.length > 15000 || job.length > 15000) {
      return NextResponse.json(
        { error: "Input too long. Please keep under 15,000 characters each." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing API key." },
        { status: 500 }
      );
    }

    const userMessage = `CURRENT CV:\n${cv}\n\n---\n\nTARGET JOB DESCRIPTION:\n${job}\n\n---\n\nReturn the JSON as specified.`;

    let lastError: unknown = null;

    for (const model of MODELS) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://getcvpro.netlify.app",
            "X-Title": "CVPro",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userMessage },
            ],
            temperature: 0.4,
            max_tokens: 3000,
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`OpenRouter error [${model}]:`, res.status, errText.slice(0, 300));
          lastError = new Error(`Model ${model} failed: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (!raw) {
          lastError = new Error(`Empty response from ${model}`);
          continue;
        }

        const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          lastError = new Error(`Malformed JSON from ${model}`);
          continue;
        }

        const result = {
          atsScore: typeof parsed.atsScore === "number" ? parsed.atsScore : 0,
          rewrittenCv: typeof parsed.rewrittenCv === "string" ? parsed.rewrittenCv : "",
          missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        };

        return NextResponse.json(result);
      } catch (err: any) {
        console.error(`Attempt [${model}] threw:`, err?.message);
        lastError = err;
      }
    }

    const msg = lastError instanceof Error ? lastError.message : "All models failed";
    return NextResponse.json(
      { error: `AI service unavailable. ${msg}` },
      { status: 502 }
    );
  } catch (err: any) {
    console.error("API error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
