import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "edge";
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

    // ---- 2. Check free fix count ----
    const { data: profile } = await supabase
      .from("profiles")
      .select("free_fixes_used")
      .eq("id", user.id)
      .single();

    const fixesUsed = profile?.free_fixes_used ?? 0;
    const isFreeFix = fixesUsed < FREE_FIX_LIMIT;

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

    // ---- 4. Enforce payment if free fixes exhausted ----
    if (!isFreeFix && !paidFix) {
      return NextResponse.json(
        {
          error: "You've used your free fixes. Pay to continue.",
          code: "PAYMENT_REQUIRED",
        },
        { status: 402 }
      );
    }

    // ---- 5. Build AI request ----
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing API key." },
        { status: 500 }
      );
    }

    const toneGuide = TONE_GUIDES[tone];
    const companyLine = companyName
      ? `\n\nCOMPANY NAME (use in opening): ${companyName}`
      : "";

    const userMessage = `APPLICANT'S CV:\n${cv}\n\n---\n\nTARGET JOB DESCRIPTION:\n${job}${companyLine}\n\n---\n\nTONE: ${tone}\nTONE GUIDE: ${toneGuide}\n\nWrite the cover letter. Return the JSON as specified.`;

    let lastError = "All models failed";

    // ---- 6. Try each model with fallback ----
    for (const model of MODELS) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://getcvpro.netlify.app",
            "X-Title": "CVPro Cover Letter",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userMessage },
            ],
            temperature: 0.6,
            max_tokens: 2000,
          }),
          signal: AbortSignal.timeout(9000),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[cover-letter/${model}] HTTP ${res.status}:`, errText.slice(0, 200));
          lastError = `Model ${model} failed: ${res.status}`;
          continue;
        }

        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content;
        if (!raw || typeof raw !== "string") {
          lastError = `Empty response from ${model}`;
          continue;
        }

        // Strip markdown fences and extract JSON
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
          console.error(`[cover-letter/${model}] malformed JSON:`, jsonString.slice(0, 200));
          lastError = `Malformed JSON from ${model}`;
          continue;
        }

        // ---- 7. Normalize result ----
        const coverLetter =
          typeof parsed.coverLetter === "string" ? parsed.coverLetter : "";

        if (!coverLetter || coverLetter.length < 100) {
          lastError = `No cover letter content from ${model}`;
          continue;
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

        // ---- 8. Increment free_fixes_used if this was a free fix ----
        if (isFreeFix) {
          await supabase
            .from("profiles")
            .update({ free_fixes_used: fixesUsed + 1 })
            .eq("id", user.id);
        }

        return NextResponse.json({
          ...result,
          isFreeFix,
          fixesRemaining: isFreeFix
            ? Math.max(0, FREE_FIX_LIMIT - (fixesUsed + 1))
            : 0,
        });
      } catch (err: any) {
        console.error(`[cover-letter/${model}] threw:`, err?.message);
        lastError = err?.message || `Error with ${model}`;
        continue;
      }
    }

    return NextResponse.json(
      { error: `AI service unavailable. ${lastError}` },
      { status: 502 }
    );
  } catch (err: any) {
    console.error("[/api/cover-letter] Top-level error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
