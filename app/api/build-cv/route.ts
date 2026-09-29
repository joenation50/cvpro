import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

const FREE_FIX_LIMIT = 3;

const SYSTEM_PROMPT = `You are CVPro, an expert CV writer specializing in the Nigerian job market and ATS optimization.

You are given structured information from a job seeker. Craft a complete, professional, ATS-optimized CV.

RULES:
1. Organize into proper sections: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS, PROJECTS, VOLUNTEER EXPERIENCE, AWARDS, LANGUAGES, INTERESTS.
2. Write a compelling 3-4 line professional summary.
3. Expand each job into achievement-focused bullets with strong action verbs.
4. Quantify achievements when numbers are provided.
5. Use Nigerian conventions: NYSC section, proper date format, certifications.
6. SKIP any section where the user provided NO data.
7. Keep it concise. ATS-friendly. No graphics, no tables.
8. NEVER fabricate information. Only use what the user provided.

Respond ONLY with valid JSON in this exact shape:
{
  "cvText": "<full CV as plain text with \\n line breaks>",
  "atsScore": <number 0-100>,
  "suggestions": ["tip 1", "tip 2", "tip 3"]
}`;

interface WorkEntry {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  employmentType?: string;
  description: string;
  achievements?: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  startDate: string;
  endDate: string;
  grade?: string;
}

interface BuildCvBody {
  paidFix?: boolean;
  basics: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    targetRole: string;
    industry?: string;
    linkedin?: string;
    portfolio?: string;
    github?: string;
  };
  summary?: string;
  yearsExperience?: string;
  work: WorkEntry[];
  education: EducationEntry[];
  nysc?: { served: boolean; state?: string; ppa?: string; year?: string };
  skills: string;
  softSkills?: string;
  certifications?: { name: string; issuer?: string; year?: string }[];
  languages?: { name: string; proficiency?: string }[];
  projects?: {
    name: string;
    description: string;
    role?: string;
    technologies?: string;
    link?: string;
  }[];
  volunteer?: {
    role: string;
    organization: string;
    dates?: string;
    description: string;
  }[];
  awards?: { name: string; issuer?: string; year?: string }[];
  interests?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to build your CV.", code: "AUTH_REQUIRED" },
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

    const freeUsed = profile?.free_fixes_used ?? 0;
    const bonusFixes = profile?.bonus_fixes ?? 0;
    const available = FREE_FIX_LIMIT + bonusFixes - freeUsed;
    const isFreeFix = available > 0;

    const body = (await req.json()) as BuildCvBody;
    const paidFix = body?.paidFix === true;
    const basics = body?.basics;

    if (!basics?.fullName || !basics?.email || !basics?.targetRole) {
      return NextResponse.json(
        { error: "Full name, email, and target role are required." },
        { status: 400 }
      );
    }

    const work = body?.work || [];
    const education = body?.education || [];

    if (work.length === 0 && education.length === 0) {
      return NextResponse.json(
        { error: "Add at least one work or education entry." },
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

    const userMessage = `PERSONAL DETAILS:
Full Name: ${basics.fullName}
Email: ${basics.email}
Phone: ${basics.phone || "(not provided)"}
Location: ${basics.location || "(not provided)"}
Target Role: ${basics.targetRole}
Industry: ${basics.industry || "(not specified)"}
LinkedIn: ${basics.linkedin || "(not provided)"}
Portfolio: ${basics.portfolio || "(not provided)"}
GitHub: ${basics.github || "(not provided)"}

PROFESSIONAL SUMMARY:
Years of Experience: ${body?.yearsExperience || "(not specified)"}
Self-Description: ${body?.summary || "(write one based on the below)"}

WORK EXPERIENCE:
${
  work.length
    ? work
        .map(
          (w, i) => `[Job ${i + 1}]
Title: ${w.title}
Company: ${w.company}
Location: ${w.location || "(not provided)"}
Dates: ${w.startDate} – ${w.endDate}
Type: ${w.employmentType || "Full-time"}
Description: ${w.description}
Achievements: ${w.achievements || "(none)"}`
        )
        .join("\n\n")
    : "(none)"
}

EDUCATION:
${
  education.length
    ? education
        .map(
          (e, i) => `[Degree ${i + 1}]
Institution: ${e.institution}
Degree: ${e.degree}
Field: ${e.field || "(not specified)"}
Location: ${e.location || "(not provided)"}
Dates: ${e.startDate} – ${e.endDate}
Grade: ${e.grade || "(not provided)"}`
        )
        .join("\n\n")
    : "(none)"
}

NYSC:
${body?.nysc?.served ? `Served in ${body.nysc.state || "?"} at ${body.nysc.ppa || "?"} (${body.nysc.year || "?"})` : "Not applicable"}

SKILLS:
Technical: ${body?.skills || "(none)"}
Soft: ${body?.softSkills || "(none)"}

CERTIFICATIONS:
${body?.certifications?.map((c) => `• ${c.name}${c.issuer ? ` — ${c.issuer}` : ""}${c.year ? ` (${c.year})` : ""}`).join("\n") || "(none)"}

LANGUAGES:
${body?.languages?.map((l) => `• ${l.name}${l.proficiency ? ` — ${l.proficiency}` : ""}`).join("\n") || "(none)"}

PROJECTS:
${body?.projects?.map((p) => `• ${p.name}: ${p.description}${p.role ? ` (Role: ${p.role})` : ""}${p.technologies ? ` [${p.technologies}]` : ""}${p.link ? ` ${p.link}` : ""}`).join("\n") || "(none)"}

VOLUNTEER:
${body?.volunteer?.map((v) => `• ${v.role} at ${v.organization}${v.dates ? ` (${v.dates})` : ""}: ${v.description}`).join("\n") || "(none)"}

AWARDS:
${body?.awards?.map((a) => `• ${a.name}${a.issuer ? ` — ${a.issuer}` : ""}${a.year ? ` (${a.year})` : ""}`).join("\n") || "(none)"}

INTERESTS:
${body?.interests || "(none)"}

Generate the complete CV. Return JSON only.`;

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
          temperature: 0.5,
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

    const cvText =
      typeof parsed.cvText === "string" ? parsed.cvText.trim() : "";

    if (!cvText || cvText.length < 100) {
      return NextResponse.json(
        { error: "AI returned empty CV. Try again." },
        { status: 502 }
      );
    }

    const result = {
      cvText,
      atsScore:
        typeof parsed.atsScore === "number"
          ? Math.max(0, Math.min(100, Math.round(parsed.atsScore)))
          : 70,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions
            .filter((s: any) => typeof s === "string")
            .slice(0, 5)
        : [],
    };

    if (isFreeFix) {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ free_fixes_used: freeUsed + 1 })
        .eq("id", user.id);
      if (updateErr) console.error("Increment failed:", updateErr);
    }

    return NextResponse.json({
      ...result,
      isFreeFix,
      fixesRemaining: isFreeFix
        ? Math.max(0, FREE_FIX_LIMIT + bonusFixes - (freeUsed + 1))
        : Math.max(0, FREE_FIX_LIMIT + bonusFixes - freeUsed),
    });
  } catch (err: any) {
    console.error("[/api/build-cv] error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
