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

const SYSTEM_PROMPT = `You are CVPro, an expert CV writer specializing in the Nigerian job market and ATS (Applicant Tracking System) optimization.

You are given structured information collected from a job seeker. Craft a complete, professional, ATS-optimized CV.

RULES:
1. Organize into proper sections: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS, PROJECTS, VOLUNTEER EXPERIENCE, AWARDS, LANGUAGES, INTERESTS, REFERENCES.
2. Write a compelling 3-4 line professional summary based on the target role and background.
3. Expand each job into achievement-focused bullets using strong action verbs (Led, Managed, Delivered, Built, Engineered, Drove, Launched).
4. Quantify achievements when numbers are provided.
5. Use Nigerian conventions: NYSC section, proper date format, certifications.
6. SKIP any section where the user provided NO data. Do not include empty sections.
7. Keep it concise. ATS-friendly. No graphics, no tables.
8. NEVER fabricate information. Only use what the user provided.

OUTPUT: Respond with ONLY valid JSON in this exact shape:
{
  "cvText": "<full CV as plain text with \\n line breaks>",
  "atsScore": <number 0-100>,
  "suggestions": ["tip 1", "tip 2", "tip 3"]
}

Rules for cvText:
- ALL CAPS section headers (e.g., PROFESSIONAL SUMMARY)
- "•" or "-" for bullets
- Complete, ready-to-use CV in plain text
- Never invent experience, dates, or credentials`;

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

interface Certification {
  name: string;
  issuer?: string;
  year?: string;
}

interface Language {
  name: string;
  proficiency?: string;
}

interface ProjectEntry {
  name: string;
  description: string;
  role?: string;
  technologies?: string;
  link?: string;
}

interface VolunteerEntry {
  role: string;
  organization: string;
  dates?: string;
  description: string;
}

interface Award {
  name: string;
  issuer?: string;
  year?: string;
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
  nysc?: {
    served: boolean;
    state?: string;
    ppa?: string;
    year?: string;
  };
  skills: string;
  softSkills?: string;
  certifications?: Certification[];
  languages?: Language[];
  projects?: ProjectEntry[];
  volunteer?: VolunteerEntry[];
  awards?: Award[];
  interests?: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();

    // 1. Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to build your CV.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // 2. Free fix check
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

    // 3. Parse + validate
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

    // 4. Payment gate
    if (!isFreeFix && !paidFix) {
      return NextResponse.json(
        {
          error: "You've used your free fixes. Pay to continue.",
          code: "PAYMENT_REQUIRED",
        },
        { status: 402 }
      );
    }

    // 5. Check API key
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // 6. Build prompt
    const userMessage = `
=== PERSONAL DETAILS ===
Full Name: ${basics.fullName}
Email: ${basics.email}
Phone: ${basics.phone || "(not provided)"}
Location: ${basics.location || "(not provided)"}
Target Role: ${basics.targetRole}
Industry: ${basics.industry || "(not specified)"}
LinkedIn: ${basics.linkedin || "(not provided)"}
Portfolio: ${basics.portfolio || "(not provided)"}
GitHub: ${basics.github || "(not provided)"}

=== PROFESSIONAL SUMMARY ===
Years of Experience: ${body?.yearsExperience || "(not specified)"}
Self-Description: ${body?.summary || "(none provided — write one based on the below)"}

=== WORK EXPERIENCE ===
${work.length === 0 ? "(none provided)" : ""}
${work
  .map(
    (w, i) => `
[Job ${i + 1}]
Title: ${w.title}
Company: ${w.company}
Location: ${w.location || "(not provided)"}
Dates: ${w.startDate} – ${w.endDate}
Employment Type: ${w.employmentType || "Full-time"}
Description: ${w.description}
Key Achievements: ${w.achievements || "(none provided)"}
`
  )
  .join("\n")}

=== EDUCATION ===
${education.length === 0 ? "(none provided)" : ""}
${education
  .map(
    (e, i) => `
[Degree ${i + 1}]
Institution: ${e.institution}
Degree: ${e.degree}
Field of Study: ${e.field || "(not specified)"}
Location: ${e.location || "(not provided)"}
Dates: ${e.startDate} – ${e.endDate}
Grade/Class: ${e.grade || "(not provided)"}
`
  )
  .join("\n")}

=== NYSC ===
${body?.nysc?.served ? `Served in ${body.nysc.state || "(state not provided)"} at ${body.nysc.ppa || "(PPA not provided)"} (${body.nysc.year || "year not provided"})` : "Not applicable"}

=== SKILLS ===
Technical: ${body?.skills || "(none provided)"}
Soft Skills: ${body?.softSkills || "(none provided)"}

=== CERTIFICATIONS ===
${body?.certifications?.length ? body.certifications.map((c) => `• ${c.name}${c.issuer ? ` — ${c.issuer}` : ""}${c.year ? ` (${c.year})` : ""}`).join("\n") : "(none provided)"}

=== LANGUAGES ===
${body?.languages?.length ? body.languages.map((l) => `• ${l.name}${l.proficiency ? ` — ${l.proficiency}` : ""}`).join("\n") : "(none provided)"}

=== PROJECTS ===
${body?.projects?.length ? body.projects.map((p, i) => `[Project ${i + 1}]\nName: ${p.name}\nDescription: ${p.description}\nRole: ${p.role || "(not specified)"}\nTechnologies: ${p.technologies || "(not specified)"}\nLink: ${p.link || "(not provided)"}`).join("\n\n") : "(none provided)"}

=== VOLUNTEER EXPERIENCE ===
${body?.volunteer?.length ? body.volunteer.map((v) => `• ${v.role} at ${v.organization}${v.dates ? ` (${v.dates})` : ""}\n  ${v.description}`).join("\n") : "(none provided)"}

=== AWARDS & HONORS ===
${body?.awards?.length ? body.awards.map((a) => `• ${a.name}${a.issuer ? ` — ${a.issuer}` : ""}${a.year ? ` (${a.year})` : ""}`).join("\n") : "(none provided)"}

=== INTERESTS ===
${body?.interests || "(none provided)"}

---

Generate the complete CV. Return JSON per the specified format.`;

    let lastError = "All models failed";

    // 7. Try models with fallback
    for (const model of MODELS) {
      try {
        console.log(`[/api/build-cv] Trying model: ${model}`);

        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://cvpro-2uy.pages.dev",
            "X-Title": "CVPro Build CV",
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
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[/api/build-cv] ${model} HTTP ${res.status}:`, errText.slice(0, 200));
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

        const cvText = typeof parsed.cvText === "string" ? parsed.cvText.trim() : "";
        if (!cvText || cvText.length < 100) {
          lastError = `No CV content from ${model}`;
          continue;
        }

        const result = {
          cvText,
          atsScore:
            typeof parsed.atsScore === "number"
              ? Math.max(0, Math.min(100, Math.round(parsed.atsScore)))
              : 70,
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions.filter((s: any) => typeof s === "string").slice(0, 5)
            : [],
        };

        if (isFreeFix) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({ free_fixes_used: freeUsed + 1 })
            .eq("id", user.id);
          if (updateErr) console.error("Increment failed:", updateErr);
        }

        console.log(`[/api/build-cv] ✅ Success with ${model}`);

        return NextResponse.json({
          ...result,
          isFreeFix,
          fixesRemaining: isFreeFix
            ? Math.max(0, FREE_FIX_LIMIT + bonusFixes - (freeUsed + 1))
            : Math.max(0, FREE_FIX_LIMIT + bonusFixes - freeUsed),
        });
      } catch (err: any) {
        console.error(`[/api/build-cv] ${model} threw:`, err?.message);
        lastError = err?.message || `Error with ${model}`;
        continue;
      }
    }

    return NextResponse.json(
      { error: `AI service unavailable. ${lastError}` },
      { status: 502 }
    );
  } catch (err: any) {
    console.error("[/api/build-cv] Top-level error:", err?.message);
    return NextResponse.json(
      { error: err?.message || "Something went wrong. Try again." },
      { status: 500 }
    );
  }
}
