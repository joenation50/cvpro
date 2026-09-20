"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { AuthHeader } from "@/components/AuthHeader";
import { PaywallModal } from "@/components/PaywallModal";
import { CvDocument, type TemplateId } from "@/components/CvDocument";
import { getSupabase } from "@/lib/supabase";
import { FREE_FIX_LIMIT, TEMPLATES, FREE_TEMPLATES, STANDARD_TEMPLATES, PREMIUM_TEMPLATES } from "@/lib/useCredits";

// ---------- Types ----------
interface WorkEntry {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  employmentType: string;
  description: string;
  achievements: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
}

interface LanguageEntry {
  name: string;
  proficiency: string;
}

interface ProjectEntry {
  name: string;
  description: string;
  role: string;
  technologies: string;
  link: string;
}

interface VolunteerEntry {
  role: string;
  organization: string;
  dates: string;
  description: string;
}

interface Award {
  name: string;
  issuer: string;
  year: string;
}

interface BuildResult {
  cvText: string;
  atsScore: number;
  suggestions: string[];
  isFreeFix?: boolean;
  fixesRemaining?: number;
}

const TOTAL_STEPS = 6;

export default function BuildCvPage() {
  const router = useRouter();
  const supabase = getSupabase();

  // ---------- Auth state ----------
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [fixesLeft, setFixesLeft] = useState<number>(FREE_FIX_LIMIT);
  const [showPaywall, setShowPaywall] = useState(false);

  // ---------- Step state ----------
  const [step, setStep] = useState(1);

  // ---------- Basics ----------
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [github, setGithub] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");

  // ---------- Work ----------
  const [work, setWork] = useState<WorkEntry[]>([
    {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      employmentType: "Full-time",
      description: "",
      achievements: "",
    },
  ]);

  // ---------- Education ----------
  const [education, setEducation] = useState<EducationEntry[]>([
    {
      institution: "",
      degree: "",
      field: "",
      location: "",
      startDate: "",
      endDate: "",
      grade: "",
    },
  ]);

  // ---------- NYSC ----------
  const [nyscServed, setNyscServed] = useState(false);
  const [nyscState, setNyscState] = useState("");
  const [nyscPpa, setNyscPpa] = useState("");
  const [nyscYear, setNyscYear] = useState("");

  // ---------- Skills ----------
  const [skills, setSkills] = useState("");
  const [softSkills, setSoftSkills] = useState("");

  // ---------- Extras ----------
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [volunteer, setVolunteer] = useState<VolunteerEntry[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [interests, setInterests] = useState("");

  // ---------- Submit state ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [pdfLoading, setPdfLoading] = useState(false);

  // ---------- Auth check ----------
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      setEmail(user.email || "");
      setFullName(user.user_metadata?.full_name || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("free_fixes_used, bonus_fixes")
        .eq("id", user.id)
        .single();

      const used = profile?.free_fixes_used ?? 0;
      const bonus = profile?.bonus_fixes ?? 0;
      setFixesLeft(Math.max(0, FREE_FIX_LIMIT + bonus - used));
    }
    load();
  }, [supabase]);

  // ---------- Helpers: dynamic array management ----------
  function addWork() {
    setWork([...work, {
      title: "", company: "", location: "", startDate: "", endDate: "",
      employmentType: "Full-time", description: "", achievements: "",
    }]);
  }
  function removeWork(i: number) {
    setWork(work.filter((_, idx) => idx !== i));
  }
  function updateWork(i: number, field: keyof WorkEntry, value: string) {
    const copy = [...work];
    copy[i][field] = value;
    setWork(copy);
  }

  function addEducation() {
    setEducation([...education, {
      institution: "", degree: "", field: "", location: "",
      startDate: "", endDate: "", grade: "",
    }]);
  }
  function removeEducation(i: number) {
    setEducation(education.filter((_, idx) => idx !== i));
  }
  function updateEducation(i: number, field: keyof EducationEntry, value: string) {
    const copy = [...education];
    copy[i][field] = value;
    setEducation(copy);
  }

  function addCertification() {
    setCertifications([...certifications, { name: "", issuer: "", year: "" }]);
  }
  function removeCertification(i: number) {
    setCertifications(certifications.filter((_, idx) => idx !== i));
  }
  function updateCertification(i: number, field: keyof Certification, value: string) {
    const copy = [...certifications];
    copy[i][field] = value;
    setCertifications(copy);
  }

  function addLanguage() {
    setLanguages([...languages, { name: "", proficiency: "Fluent" }]);
  }
  function removeLanguage(i: number) {
    setLanguages(languages.filter((_, idx) => idx !== i));
  }
  function updateLanguage(i: number, field: keyof LanguageEntry, value: string) {
    const copy = [...languages];
    copy[i][field] = value;
    setLanguages(copy);
  }

  function addProject() {
    setProjects([...projects, { name: "", description: "", role: "", technologies: "", link: "" }]);
  }
  function removeProject(i: number) {
    setProjects(projects.filter((_, idx) => idx !== i));
  }
  function updateProject(i: number, field: keyof ProjectEntry, value: string) {
    const copy = [...projects];
    copy[i][field] = value;
    setProjects(copy);
  }

  function addVolunteer() {
    setVolunteer([...volunteer, { role: "", organization: "", dates: "", description: "" }]);
  }
  function removeVolunteer(i: number) {
    setVolunteer(volunteer.filter((_, idx) => idx !== i));
  }
  function updateVolunteer(i: number, field: keyof VolunteerEntry, value: string) {
    const copy = [...volunteer];
    copy[i][field] = value;
    setVolunteer(copy);
  }

  function addAward() {
    setAwards([...awards, { name: "", issuer: "", year: "" }]);
  }
  function removeAward(i: number) {
    setAwards(awards.filter((_, idx) => idx !== i));
  }
  function updateAward(i: number, field: keyof Award, value: string) {
    const copy = [...awards];
    copy[i][field] = value;
    setAwards(copy);
  }

  // ---------- Validation per step ----------
  function canProceed(): boolean {
    if (step === 1) {
      return !!(fullName.trim() && email.trim() && targetRole.trim());
    }
    if (step === 2) {
      return work.some((w) => w.title.trim() && w.company.trim());
    }
    if (step === 3) {
      return education.some((e) => e.institution.trim() && e.degree.trim());
    }
    if (step === 4) {
      return skills.trim().length > 0;
    }
    return true;
  }

  // ---------- Submit ----------
  async function handleSubmit(paidFix = false) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/build-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidFix,
          basics: {
            fullName, email, phone, location, targetRole, industry,
            linkedin, portfolio, github,
          },
          yearsExperience,
          work,
          education,
          nysc: nyscServed ? { served: true, state: nyscState, ppa: nyscPpa, year: nyscYear } : { served: false },
          skills,
          softSkills,
          certifications,
          languages,
          projects,
          volunteer,
          awards,
          interests,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "AUTH_REQUIRED") {
          router.push("/signup");
          return;
        }
        if (data.code === "PAYMENT_REQUIRED") {
          setFixesLeft(0);
          setShowPaywall(true);
          return;
        }
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data as BuildResult);
      if (typeof data.fixesRemaining === "number") {
        setFixesLeft(data.fixesRemaining);
      }
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaywallPaid(selectedTemplate: TemplateId) {
    setShowPaywall(false);
    setTemplate(selectedTemplate);
    await handleSubmit(true);
  }

  async function downloadPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const blob = await pdf(
        <CvDocument cvText={result.cvText} template={template} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CVPro-Built-CV-${template}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not generate PDF. Try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Style helper ----------
  const inputClass = "w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-stone ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none transition";
  const labelClass = "block text-xs font-medium text-stone mb-1";
  const cardClass = "rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10";

  // ---------- RENDER ----------
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-24">
      <AuthHeader />

      {/* HERO */}
      {!result && (
        <section className="pt-4 pb-6 text-center">
          {loggedIn && (
            <div className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-3 ${
              fixesLeft > 0 ? "bg-cyan/15 text-cyan" : "bg-coral/15 text-coral"
            }`}>
              {fixesLeft > 0
                ? `🎁 ${fixesLeft} free ${fixesLeft === 1 ? "use" : "uses"} left`
                : "🔒 Free uses exhausted"}
            </div>
          )}
          <h1 className="font-grotesk text-3xl font-bold leading-tight sm:text-4xl">
            Build Your <span className="text-cyan">CV</span>
            <br />
            From Scratch.
          </h1>
          <p className="mt-4 text-sm text-stone sm:text-base max-w-md mx-auto">
            No existing CV? No problem. Answer a few questions, get a professional CV in 3 minutes.
          </p>
        </section>
      )}

      {/* PROGRESS BAR */}
      {!result && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-wider text-stone">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-blue to-cyan transition-all"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ============ STEP 1: BASIC INFO ============ */}
      {!result && step === 1 && (
        <div className={cardClass + " space-y-4"}>
          <h2 className="font-grotesk text-lg font-bold text-white">Personal details</h2>

          <div>
            <label className={labelClass}>Full name *</label>
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Chinedu Okafor" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email *</label>
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 803 ..." />
            </div>
          </div>

          <div>
            <label className={labelClass}>Location (City, Country)</label>
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria" />
          </div>

          <div>
            <label className={labelClass}>Target role *</label>
            <input className={inputClass} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Digital Marketing Specialist" />
          </div>

          <div>
            <label className={labelClass}>Industry</label>
            <select className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">Select...</option>
              <option>Technology</option>
              <option>Finance / Banking</option>
              <option>Marketing</option>
              <option>Sales</option>
              <option>Education</option>
              <option>Healthcare</option>
              <option>Engineering</option>
              <option>Government</option>
              <option>Oil & Gas</option>
              <option>Consulting</option>
              <option>Creative / Design</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Years of experience</label>
            <input className={inputClass} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="e.g. 3 years" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>LinkedIn (optional)</label>
              <input className={inputClass} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/you" />
            </div>
            <div>
              <label className={labelClass}>Portfolio / Website (optional)</label>
              <input className={inputClass} value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="yoursite.com" />
            </div>
            <div>
              <label className={labelClass}>GitHub (optional)</label>
              <input className={inputClass} value={github} onChange={(e) => setGithub(e.target.value)} placeholder="github.com/you" />
            </div>
          </div>
        </div>
      )}

      {/* ============ STEP 2: WORK EXPERIENCE ============ */}
      {!result && step === 2 && (
        <div className="space-y-4">
          <div className={cardClass}>
            <h2 className="font-grotesk text-lg font-bold text-white mb-1">Work experience</h2>
            <p className="text-xs text-stone mb-3">Add at least one. Skip if you're a fresh graduate with no experience yet.</p>

            {work.map((w, i) => (
              <div key={i} className="mb-5 pb-5 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-cyan">Job {i + 1}</span>
                  {work.length > 1 && (
                    <button onClick={() => removeWork(i)} className="text-xs text-coral hover:text-coral/80">Remove</button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputClass} value={w.title} onChange={(e) => updateWork(i, "title", e.target.value)} placeholder="Job title *" />
                    <input className={inputClass} value={w.company} onChange={(e) => updateWork(i, "company", e.target.value)} placeholder="Company *" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputClass} value={w.location} onChange={(e) => updateWork(i, "location", e.target.value)} placeholder="Location" />
                    <select className={inputClass} value={w.employmentType} onChange={(e) => updateWork(i, "employmentType", e.target.value)}>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Internship</option>
                      <option>Freelance</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputClass} value={w.startDate} onChange={(e) => updateWork(i, "startDate", e.target.value)} placeholder="Start (e.g. Jan 2022)" />
                    <input className={inputClass} value={w.endDate} onChange={(e) => updateWork(i, "endDate", e.target.value)} placeholder="End (or Present)" />
                  </div>

                  <textarea rows={3} className={inputClass} value={w.description} onChange={(e) => updateWork(i, "description", e.target.value)} placeholder="What did you do? (2-3 sentences)" />
                  <textarea rows={2} className={inputClass} value={w.achievements} onChange={(e) => updateWork(i, "achievements", e.target.value)} placeholder="Key achievements (e.g. Grew followers by 200%)" />
                </div>
              </div>
            ))}

            <button onClick={addWork} className="mt-3 text-xs font-semibold text-cyan hover:text-cyan/80">+ Add another job</button>
          </div>
        </div>
      )}

      {/* ============ STEP 3: EDUCATION ============ */}
      {!result && step === 3 && (
        <div className="space-y-4">
          <div className={cardClass}>
            <h2 className="font-grotesk text-lg font-bold text-white mb-3">Education</h2>

            {education.map((e, i) => (
              <div key={i} className="mb-5 pb-5 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-cyan">Degree {i + 1}</span>
                  {education.length > 1 && (
                    <button onClick={() => removeEducation(i)} className="text-xs text-coral hover:text-coral/80">Remove</button>
                  )}
                </div>

                <div className="space-y-3">
                  <input className={inputClass} value={e.institution} onChange={(ev) => updateEducation(i, "institution", ev.target.value)} placeholder="Institution (e.g. University of Lagos) *" />
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputClass} value={e.degree} onChange={(ev) => updateEducation(i, "degree", ev.target.value)} placeholder="Degree (B.Sc., HND, etc.) *" />
                    <input className={inputClass} value={e.field} onChange={(ev) => updateEducation(i, "field", ev.target.value)} placeholder="Field of study" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputClass} value={e.startDate} onChange={(ev) => updateEducation(i, "startDate", ev.target.value)} placeholder="Start year" />
                    <input className={inputClass} value={e.endDate} onChange={(ev) => updateEducation(i, "endDate", ev.target.value)} placeholder="End year" />
                  </div>
                  <input className={inputClass} value={e.grade} onChange={(ev) => updateEducation(i, "grade", ev.target.value)} placeholder="Grade (e.g. Second Class Upper)" />
                </div>
              </div>
            ))}

            <button onClick={addEducation} className="mt-3 text-xs font-semibold text-cyan hover:text-cyan/80">+ Add another degree</button>
          </div>
        </div>
      )}

      {/* ============ STEP 4: SKILLS ============ */}
      {!result && step === 4 && (
        <div className={cardClass + " space-y-4"}>
          <h2 className="font-grotesk text-lg font-bold text-white">Skills</h2>

          <div>
            <label className={labelClass}>Technical / Professional skills *</label>
            <textarea rows={3} className={inputClass} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Social Media Management, Canva, Google Analytics, Content Writing" />
            <p className="mt-1 text-[10px] text-stone">Separate with commas. These matter most for ATS.</p>
          </div>

          <div>
            <label className={labelClass}>Soft skills (optional)</label>
            <textarea rows={2} className={inputClass} value={softSkills} onChange={(e) => setSoftSkills(e.target.value)} placeholder="e.g. Communication, Teamwork, Leadership" />
          </div>
        </div>
      )}

      {/* ============ STEP 5: EXTRAS (ALL OPTIONAL) ============ */}
      {!result && step === 5 && (
        <div className="space-y-4">
          <div className={cardClass}>
            <div className="mb-4">
              <h2 className="font-grotesk text-lg font-bold text-white">Extras</h2>
              <p className="text-xs text-stone mt-1">All optional — skip anything you don't have.</p>
            </div>

            {/* NYSC */}
            <details className="mb-3 rounded-xl bg-white/5 ring-1 ring-white/10">
              <summary className="cursor-pointer p-3 text-sm font-medium text-white">🇳🇬 NYSC</summary>
              <div className="px-3 pb-3 space-y-3">
                <label className="flex items-center gap-2 text-xs text-white">
                  <input type="checkbox" checked={nyscServed} onChange={(e) => setNyscServed(e.target.checked)} />
                  I completed NYSC
                </label>
                {nyscServed && (
                  <div className="grid grid-cols-2 gap-3">
                    <input className={inputClass} value={nyscState} onChange={(e) => setNyscState(e.target.value)} placeholder="State served" />
                    <input className={inputClass} value={nyscYear} onChange={(e) => setNyscYear(e.target.value)} placeholder="Year" />
                    <input className={inputClass + " col-span-2"} value={nyscPpa} onChange={(e) => setNyscPpa(e.target.value)} placeholder="Place of Primary Assignment (PPA)" />
                  </div>
                )}
              </div>
            </details>

            {/* Certifications */}
            <details className="mb-3 rounded-xl bg-white/5 ring-1 ring-white/10">
              <summary className="cursor-pointer p-3 text-sm font-medium text-white">📜 Certifications</summary>
              <div className="px-3 pb-3 space-y-3">
                {certifications.map((c, i) => (
                  <div key={i} className="space-y-2 pb-3 border-b border-white/5 last:border-0">
                    <input className={inputClass} value={c.name} onChange={(e) => updateCertification(i, "name", e.target.value)} placeholder="Certification name" />
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputClass} value={c.issuer} onChange={(e) => updateCertification(i, "issuer", e.target.value)} placeholder="Issuer" />
                      <input className={inputClass} value={c.year} onChange={(e) => updateCertification(i, "year", e.target.value)} placeholder="Year" />
                    </div>
                    <button onClick={() => removeCertification(i)} className="text-xs text-coral">Remove</button>
                  </div>
                ))}
                <button onClick={addCertification} className="text-xs font-semibold text-cyan">+ Add certification</button>
              </div>
            </details>

            {/* Languages */}
            <details className="mb-3 rounded-xl bg-white/5 ring-1 ring-white/10">
              <summary className="cursor-pointer p-3 text-sm font-medium text-white">🗣️ Languages</summary>
              <div className="px-3 pb-3 space-y-3">
                {languages.map((l, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 pb-3 border-b border-white/5 last:border-0">
                    <input className={inputClass} value={l.name} onChange={(e) => updateLanguage(i, "name", e.target.value)} placeholder="Language" />
                    <select className={inputClass} value={l.proficiency} onChange={(e) => updateLanguage(i, "proficiency", e.target.value)}>
                      <option>Native</option>
                      <option>Fluent</option>
                      <option>Intermediate</option>
                      <option>Basic</option>
                    </select>
                    <button onClick={() => removeLanguage(i)} className="col-span-2 text-left text-xs text-coral">Remove</button>
                  </div>
                ))}
                <button onClick={addLanguage} className="text-xs font-semibold text-cyan">+ Add language</button>
              </div>
            </details>

            {/* Projects */}
            <details className="mb-3 rounded-xl bg-white/5 ring-1 ring-white/10">
              <summary className="cursor-pointer p-3 text-sm font-medium text-white">🚀 Projects</summary>
              <div className="px-3 pb-3 space-y-3">
                {projects.map((p, i) => (
                  <div key={i} className="space-y-2 pb-3 border-b border-white/5 last:border-0">
                    <input className={inputClass} value={p.name} onChange={(e) => updateProject(i, "name", e.target.value)} placeholder="Project name" />
                    <textarea rows={2} className={inputClass} value={p.description} onChange={(e) => updateProject(i, "description", e.target.value)} placeholder="Brief description" />
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputClass} value={p.role} onChange={(e) => updateProject(i, "role", e.target.value)} placeholder="Your role" />
                      <input className={inputClass} value={p.technologies} onChange={(e) => updateProject(i, "technologies", e.target.value)} placeholder="Tools used" />
                    </div>
                    <input className={inputClass} value={p.link} onChange={(e) => updateProject(i, "link", e.target.value)} placeholder="Link (optional)" />
                    <button onClick={() => removeProject(i)} className="text-xs text-coral">Remove</button>
                  </div>
                ))}
                <button onClick={addProject} className="text-xs font-semibold text-cyan">+ Add project</button>
              </div>
            </details>

            {/* Volunteer */}
            <details className="mb-3 rounded-xl bg-white/5 ring-1 ring-white/10">
              <summary className="cursor-pointer p-3 text-sm font-medium text-white">🤝 Volunteer work</summary>
              <div className="px-3 pb-3 space-y-3">
                {volunteer.map((v, i) => (
                  <div key={i} className="space-y-2 pb-3 border-b border-white/5 last:border-0">
                    <input className={inputClass} value={v.role} onChange={(e) => updateVolunteer(i, "role", e.target.value)} placeholder="Role" />
                    <input className={inputClass} value={v.organization} onChange={(e) => updateVolunteer(i, "organization", e.target.value)} placeholder="Organization" />
                    <input className={inputClass} value={v.dates} onChange={(e) => updateVolunteer(i, "dates", e.target.value)} placeholder="Dates" />
                    <textarea rows={2} className={inputClass} value={v.description} onChange={(e) => updateVolunteer(i, "description", e.target.value)} placeholder="What you did" />
                    <button onClick={() => removeVolunteer(i)} className="text-xs text-coral">Remove</button>
                  </div>
                ))}
                <button onClick={addVolunteer} className="text-xs font-semibold text-cyan">+ Add volunteer role</button>
              </div>
            </details>

            {/* Awards */}
            <details className="mb-3 rounded-xl bg-white/5 ring-1 ring-white/10">
              <summary className="cursor-pointer p-3 text-sm font-medium text-white">🏆 Awards & honors</summary>
              <div className="px-3 pb-3 space-y-3">
                {awards.map((a, i) => (
                  <div key={i} className="space-y-2 pb-3 border-b border-white/5 last:border-0">
                    <input className={inputClass} value={a.name} onChange={(e) => updateAward(i, "name", e.target.value)} placeholder="Award name" />
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputClass} value={a.issuer} onChange={(e) => updateAward(i, "issuer", e.target.value)} placeholder="Issuer" />
                      <input className={inputClass} value={a.year} onChange={(e) => updateAward(i, "year", e.target.value)} placeholder="Year" />
                    </div>
                    <button onClick={() => removeAward(i)} className="text-xs text-coral">Remove</button>
                  </div>
                ))}
                <button onClick={addAward} className="text-xs font-semibold text-cyan">+ Add award</button>
              </div>
            </details>

            {/* Interests */}
            <details className="rounded-xl bg-white/5 ring-1 ring-white/10">
              <summary className="cursor-pointer p-3 text-sm font-medium text-white">🎯 Interests</summary>
              <div className="px-3 pb-3">
                <textarea rows={2} className={inputClass} value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g. Reading, Football, Photography" />
              </div>
            </details>
          </div>
        </div>
      )}

      {/* ============ STEP 6: PREVIEW/SUBMIT ============ */}
      {!result && step === 6 && (
        <div className={cardClass}>
          <h2 className="font-grotesk text-lg font-bold text-white mb-3">Ready to generate</h2>
          <div className="text-xs text-stone space-y-2 mb-4">
            <p>✓ <strong className="text-white">{work.filter(w => w.title).length}</strong> work entries</p>
            <p>✓ <strong className="text-white">{education.filter(e => e.institution).length}</strong> education entries</p>
            <p>✓ <strong className="text-white">{skills.split(",").filter(s => s.trim()).length}</strong> skills</p>
            <p>✓ <strong className="text-white">{certifications.length}</strong> certifications</p>
            <p>✓ <strong className="text-white">{languages.length}</strong> languages</p>
          </div>

          {error && (
            <p className="rounded-xl bg-coral/10 p-3 text-xs text-coral ring-1 ring-coral/20 mb-3">
              {error}
            </p>
          )}

          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue font-grotesk text-lg font-bold text-white transition hover:bg-blue-hover disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Building your CV...
              </>
            ) : !loggedIn ? (
              <>Sign up free to build</>
            ) : fixesLeft > 0 ? (
              <>✨ Build My CV (Free)</>
            ) : (
              <>💳 Pay ₦1,000 & Build</>
            )}
          </button>
        </div>
      )}

      {/* NAVIGATION */}
      {!result && (
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12 rounded-xl bg-white/5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
            >
              ← Back
            </button>
          )}
          {step < TOTAL_STEPS && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 h-12 rounded-xl bg-cyan text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-40"
            >
              Continue →
            </button>
          )}
        </div>
      )}

      {/* ============ RESULT ============ */}
      {result && (
        <section id="result" className="space-y-5 pt-4">
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-grotesk text-lg font-bold text-white">Your CV is ready</h2>
              <span className="font-grotesk text-3xl font-extrabold text-emerald">{result.atsScore}%</span>
            </div>
            <p className="text-xs text-stone mb-4">Est. ATS match score for your target role</p>
          </div>

          {result.suggestions.length > 0 && (
            <div className={cardClass}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone">Suggestions</h3>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-gray-200 flex gap-2">
                    <span className="text-amber">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Template picker */}
          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-semibold text-white">Choose a template</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone mb-2">Free</p>
                <div className="grid grid-cols-3 gap-2">
                  {FREE_TEMPLATES.map((t) => (
                    <button key={t} onClick={() => setTemplate(t)} className={`rounded-lg p-2 text-xs font-semibold ${template === t ? "bg-blue text-white ring-2 ring-cyan" : "bg-white/5 text-gray-200 ring-1 ring-white/10"}`}>
                      {TEMPLATES[t].name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone">Your CV</h3>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-ink p-4 text-[11px] text-gray-200 ring-1 ring-white/10">{result.cvText}</pre>
          </div>

          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald font-bold text-ink hover:brightness-110 disabled:opacity-60"
          >
            {pdfLoading ? "Generating PDF..." : "📄 Download PDF"}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => { navigator.clipboard.writeText(result.cvText); alert("Copied!"); }}
              className="flex-1 h-11 rounded-xl bg-white/5 text-sm font-semibold text-white ring-1 ring-white/10"
            >
              📋 Copy
            </button>
            <button
              onClick={reset}
              className="flex-1 h-11 rounded-xl bg-white/5 text-sm font-semibold text-white ring-1 ring-white/10"
            >
              🔄 Build Another
            </button>
          </div>
        </section>
      )}

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPaid={handlePaywallPaid}
        feature="cv"
        defaultTemplate={template}
      />
    </div>
  );
}
