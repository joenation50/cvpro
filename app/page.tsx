"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { CvDocument, type TemplateId } from "./components/CvDocument";
import { FileUploader } from "./components/FileUploader";
import { AuthHeader } from "./components/AuthHeader";
import { PaywallModal } from "./components/PaywallModal";
import { getSupabase } from "./lib/supabase";
import {
  TEMPLATES,
  FREE_TEMPLATES,
  STANDARD_TEMPLATES,
  PREMIUM_TEMPLATES,
  FREE_FIX_LIMIT,
} from "./lib/useCredits";

type FixResult = {
  atsScore: number;
  rewrittenCv: string;
  missingKeywords: string[];
  improvements: string[];
  isFreeFix?: boolean;
  fixesRemaining?: number;
};

// ============================================================================
// Content data
// ============================================================================
const FEATURES = [
  {
    icon: "✅",
    title: "ATS Optimization",
    desc: "Beat the bots that filter out 75% of CVs before a human sees them.",
  },
  {
    icon: "🇳🇬",
    title: "Built for Nigeria",
    desc: "NYSC, WAEC, HND, ICAN formatting. Naira salary phrasing.",
  },
  {
    icon: "📄",
    title: "Fix or Build",
    desc: "Upload an existing CV — or build one from scratch.",
  },
  {
    icon: "🎨",
    title: "9 Templates",
    desc: "From traditional to creative. Pick the one that fits your industry.",
  },
  {
    icon: "⚡",
    title: "60-Second Fix",
    desc: "Upload, fix, download. No delays.",
  },
  {
    icon: "🔒",
    title: "Your Data is Safe",
    desc: "We never store your CV. Processed in real-time.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I sent 40 applications with my old CV. Zero callbacks. After CVPro, I got 3 interviews in one week.",
    name: "Chidi O.",
    role: "Product Manager, Lagos",
  },
  {
    quote:
      "The ATS score showed me exactly what was missing. Best ₦1,000 I've spent on my career.",
    name: "Amaka N.",
    role: "Marketing Lead, Abuja",
  },
  {
    quote:
      "Used the Japa template for a UK job application. Got shortlisted. Thank you CVPro.",
    name: "Tunde A.",
    role: "Software Engineer, Remote",
  },
];

const FAQ = [
  {
    q: "Do I need an account to use CVPro?",
    a: "Yes, a free account. It takes 30 seconds to sign up and gives you 3 free CV fixes.",
  },
  {
    q: "Do I need an existing CV to use CVPro?",
    a: "No. You can either fix an existing CV, or build one from scratch by answering a few questions. Both count toward your 3 free uses.",
  },
  {
    q: "How much does it cost after the free fixes?",
    a: "₦1,000 per fix for Classic, Minimal, Modern, or Executive templates. ₦1,500 per fix for Premium templates (Creative, Corporate, Academic, Japa, Tech).",
  },
  {
    q: "Is there a subscription?",
    a: "No. You pay once per fix. No monthly charges, no hidden fees.",
  },
  {
    q: "Is my CV safe?",
    a: "Yes. We never store your CV on our servers. It's processed in real-time and immediately discarded.",
  },
  {
    q: "Can I edit the AI-generated CV?",
    a: "Absolutely. After the fix, you can copy the text, edit it, and download the PDF in your chosen template.",
  },
];

// ============================================================================
// Main component
// ============================================================================
export default function Home() {
  const router = useRouter();
  const supabase = getSupabase();

  // ---- Form state ----
  const [cv, setCv] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FixResult | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [template, setTemplate] = useState<TemplateId>("classic");

  // ---- Input mode ----
  const [cvMode, setCvMode] = useState<"paste" | "upload">("paste");
  const [jobMode, setJobMode] = useState<"paste" | "upload">("paste");
  const [uploadedCvName, setUploadedCvName] = useState<string | null>(null);
  const [uploadedJobName, setUploadedJobName] = useState<string | null>(null);

  // ---- Auth + credits ----
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [fixesLeft, setFixesLeft] = useState<number>(FREE_FIX_LIMIT);
  const [showPaywall, setShowPaywall] = useState(false);

  // ---- Auth check + free-fix count ----
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("free_fixes_used, bonus_fixes")
        .eq("id", user.id)
        .single();

      const used = profile?.free_fixes_used ?? 0;
      const bonus = profile?.bonus_fixes ?? 0;
      setFixesLeft(Math.max(0, FREE_FIX_LIMIT + bonus - used));
    }
    checkAuth();
  }, [supabase]);

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent, paidFix = false) {
    e.preventDefault();

    if (!loggedIn) {
      router.push("/signup");
      return;
    }

    if (fixesLeft <= 0 && !paidFix) {
      setShowPaywall(true);
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv, jobDescription, template, paidFix }),
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

      setResult(data as FixResult);
      if (typeof data.fixesRemaining === "number") {
        setFixesLeft(data.fixesRemaining);
      }

      setTimeout(
        () =>
          document
            .getElementById("results")
            ?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---- Paywall callback ----
  async function handlePaywallPaid(selectedTemplate: TemplateId) {
    setShowPaywall(false);
    setTemplate(selectedTemplate);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(fakeEvent, true);
  }

  // ---- PDF download ----
  async function downloadPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const blob = await pdf(
        <CvDocument cvText={result.rewrittenCv} template={template} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CVPro-${template}.pdf`;
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

  async function copyText() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.rewrittenCv);
      alert("Copied to clipboard!");
    } catch {
      alert("Could not copy. Long-press the text and copy manually.");
    }
  }

  function reset() {
    setCv("");
    setJobDescription("");
    setResult(null);
    setError(null);
    setUploadedCvName(null);
    setUploadedJobName(null);
    setCvMode("paste");
    setJobMode("paste");
    setTemplate("classic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const scoreColor = result
    ? result.atsScore >= 75
      ? "text-emerald"
      : result.atsScore >= 50
      ? "text-amber"
      : "text-coral"
    : "";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20">
      <AuthHeader />

      {/* ============ HERO ============ */}
      <section className="pt-6 pb-10 text-center">
        {loggedIn && (
          <div
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4 ${
              fixesLeft > 0 ? "bg-cyan/15 text-cyan" : "bg-coral/15 text-coral"
            }`}
          >
            {fixesLeft > 0
              ? `🎁 ${fixesLeft} free ${fixesLeft === 1 ? "use" : "uses"} left`
              : "🔒 Free uses used — pay ₦1,000+ per fix"}
          </div>
        )}
        {!loggedIn && loggedIn !== null && (
          <div className="inline-block rounded-full bg-cyan/15 px-3 py-1 text-xs font-semibold text-cyan mb-4">
            🎁 3 free uses when you sign up
          </div>
        )}

        <h1 className="font-grotesk text-3xl font-bold leading-tight sm:text-4xl">
          Fix Your CV.
          <br />
          <span className="text-cyan">Land the Job.</span>
        </h1>
        <p className="mt-4 text-sm text-stone sm:text-base max-w-md mx-auto">
          Fix an existing CV or build one from scratch. AI rewrites it to pass
          ATS and match the role — in 60 seconds.
        </p>

        {/* Two mode buttons */}
        <div className="mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto">
          <a
            href="#fix"
            className="rounded-xl bg-blue/10 p-4 ring-2 ring-blue text-left transition hover:bg-blue/20 active:scale-[0.98]"
          >
            <div className="text-2xl mb-1">📝</div>
            <div className="text-sm font-bold text-white">Fix my CV</div>
            <div className="text-[10px] text-stone mt-1">
              I have an existing CV
            </div>
          </a>
          <Link
            href="/build-cv"
            className="rounded-xl bg-cyan/10 p-4 ring-2 ring-cyan text-left transition hover:bg-cyan/20 active:scale-[0.98]"
          >
            <div className="text-2xl mb-1">✨</div>
            <div className="text-sm font-bold text-white">
              Build from scratch
            </div>
            <div className="text-[10px] text-stone mt-1">
              No CV yet — help me make one
            </div>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-stone">
          <span>🇳🇬 Built for Nigeria</span>
          <span>·</span>
          <span>🔒 Data never stored</span>
          <span>·</span>
          <span>⚡ 60-second fix</span>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="mb-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: "1", icon: "📤", t: "Upload CV" },
            { n: "2", icon: "🤖", t: "AI Fixes It" },
            { n: "3", icon: "📄", t: "Download PDF" },
          ].map((step) => (
            <div
              key={step.n}
              className="rounded-2xl bg-navy/40 p-4 ring-1 ring-white/10 text-center"
            >
              <div className="text-2xl mb-1">{step.icon}</div>
              <div className="text-[10px] font-semibold text-cyan">
                STEP {step.n}
              </div>
              <div className="mt-1 text-xs font-medium text-white">
                {step.t}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FIXER FORM ============ */}
      {!result && (
        <form
          id="fix"
          onSubmit={(e) => handleSubmit(e)}
          className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10 space-y-5 scroll-mt-24"
        >
          {/* CV INPUT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white">Your CV</label>
              <div className="flex gap-1 rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
                <button
                  type="button"
                  onClick={() => setCvMode("paste")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    cvMode === "paste"
                      ? "bg-blue text-white"
                      : "text-stone hover:text-white"
                  }`}
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setCvMode("upload")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    cvMode === "upload"
                      ? "bg-blue text-white"
                      : "text-stone hover:text-white"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {cvMode === "paste" ? (
              <textarea
                value={cv}
                onChange={(e) => setCv(e.target.value)}
                rows={7}
                placeholder="Paste your full CV text here..."
                className="w-full rounded-xl bg-white/5 p-4 text-sm text-white placeholder-stone ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none"
              />
            ) : (
              <>
                <FileUploader
                  label="Upload your CV"
                  onExtracted={(text, filename) => {
                    setCv(text);
                    setUploadedCvName(filename);
                  }}
                />
                {cv && uploadedCvName && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-emerald">
                        Extracted from {uploadedCvName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCv("");
                          setUploadedCvName(null);
                        }}
                        className="text-xs text-stone hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <textarea
                      value={cv}
                      onChange={(e) => setCv(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl bg-white/5 p-3 text-xs text-gray-200 ring-1 ring-white/10"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* JOB INPUT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white">
                Job Description
              </label>
              <div className="flex gap-1 rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
                <button
                  type="button"
                  onClick={() => setJobMode("paste")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    jobMode === "paste"
                      ? "bg-blue text-white"
                      : "text-stone hover:text-white"
                  }`}
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setJobMode("upload")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    jobMode === "upload"
                      ? "bg-blue text-white"
                      : "text-stone hover:text-white"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {jobMode === "paste" ? (
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={5}
                placeholder="Paste the job description (Jobberman, LinkedIn, etc.)..."
                className="w-full rounded-xl bg-white/5 p-4 text-sm text-white placeholder-stone ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none"
              />
            ) : (
              <>
                <FileUploader
                  label="Upload job description"
                  onExtracted={(text, filename) => {
                    setJobDescription(text);
                    setUploadedJobName(filename);
                  }}
                />
                {jobDescription && uploadedJobName && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-emerald">
                        Extracted from {uploadedJobName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setJobDescription("");
                          setUploadedJobName(null);
                        }}
                        className="text-xs text-stone hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl bg-white/5 p-3 text-xs text-gray-200 ring-1 ring-white/10"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* TEMPLATE PICKER */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Choose your template
            </label>

            <div className="mb-2">
              <div className="text-[10px] uppercase tracking-wider text-stone mb-1">
                Free
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FREE_TEMPLATES.map((t) => {
                  const info = TEMPLATES[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplate(t)}
                      className={`rounded-xl p-3 text-left transition ${
                        template === t
                          ? "bg-blue/20 ring-2 ring-cyan"
                          : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-sm font-semibold text-white">
                        {info.name}
                      </div>
                      <div className="text-[10px] text-stone">
                        {info.bestFor}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-2">
              <div className="text-[10px] uppercase tracking-wider text-stone mb-1">
                Standard · ₦1,000 per fix
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STANDARD_TEMPLATES.map((t) => {
                  const info = TEMPLATES[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplate(t)}
                      className={`rounded-xl p-3 text-left transition ${
                        template === t
                          ? "bg-blue/20 ring-2 ring-cyan"
                          : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          {info.name}
                        </span>
                        <span className="text-[10px] text-cyan font-semibold">
                          ₦{info.priceNaira}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone">
                        {info.bestFor}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone mb-1">
                Premium · ₦1,500 per fix
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PREMIUM_TEMPLATES.map((t) => {
                  const info = TEMPLATES[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTemplate(t)}
                      className={`rounded-xl p-3 text-left transition ${
                        template === t
                          ? "bg-blue/20 ring-2 ring-cyan"
                          : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          💎 {info.name}
                        </span>
                        <span className="text-[10px] text-cyan font-semibold">
                          ₦{info.priceNaira}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone">
                        {info.bestFor}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading || !cv.trim() || !jobDescription.trim()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue font-grotesk text-lg font-bold text-white transition hover:bg-blue-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Fixing your CV...
              </>
            ) : !loggedIn ? (
              <>Sign up free to fix</>
            ) : fixesLeft > 0 ? (
              <>⚡ Fix My CV (Free)</>
            ) : (
              <>💳 Pay ₦{TEMPLATES[template].priceNaira} & Fix</>
            )}
          </button>

          {error && (
            <p className="rounded-xl bg-coral/10 p-3 text-xs text-coral ring-1 ring-coral/20">
              {error}
            </p>
          )}

          <p className="text-center text-[11px] text-stone">
            🔒 Your CV is never stored. Processed in real-time.
          </p>
        </form>
      )}

      {/* ============ RESULTS ============ */}
      {result && (
        <section
          id="results"
          className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-grotesk text-lg font-bold text-white">
              Your ATS Score
            </h2>
            <span
              className={`font-grotesk text-4xl font-extrabold ${scoreColor}`}
            >
              {result.atsScore}%
            </span>
          </div>

          {result.missingKeywords.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone">
                Missing keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-coral/15 px-2.5 py-1 text-[11px] text-coral"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.improvements.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone">
                What we improved
              </h3>
              <ul className="space-y-1.5">
                {result.improvements.map((imp, i) => (
                  <li key={i} className="text-xs text-gray-200 flex gap-2">
                    <span className="text-emerald">✓</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone">
              Rewritten CV
            </h3>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-ink p-4 text-[11px] text-gray-200 ring-1 ring-white/10">
              {result.rewrittenCv}
            </pre>
          </div>

          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald font-bold text-ink transition hover:brightness-110 disabled:opacity-60"
          >
            {pdfLoading ? "Generating PDF..." : "📄 Download PDF"}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={copyText}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              📋 Copy
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              🔄 Fix Another
            </button>
          </div>
        </section>
      )}

      {/* ============ FEATURES ============ */}
      <section className="mt-14">
        <h2 className="mb-6 text-center font-grotesk text-2xl font-bold text-white">
          Why CVPro?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-navy/40 p-4 ring-1 ring-white/10"
            >
              <div className="text-xl">{f.icon}</div>
              <h3 className="mt-2 font-grotesk text-sm font-bold text-white">
                {f.title}
              </h3>
              <p className="mt-1 text-[11px] text-stone leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ TEMPLATE GALLERY ============ */}
      <section className="mt-14">
        <h2 className="mb-2 text-center font-grotesk text-2xl font-bold text-white">
          9 Professional Templates
        </h2>
        <p className="mb-6 text-center text-xs text-stone">
          From bank-ready to creative. Pick what fits your industry.
        </p>

        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone mb-2">
              Free with signup
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FREE_TEMPLATES.map((t) => (
                <TemplateCard key={t} template={t} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone mb-2">
              Standard
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STANDARD_TEMPLATES.map((t) => (
                <TemplateCard key={t} template={t} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone mb-2">
              💎 Premium
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PREMIUM_TEMPLATES.map((t) => (
                <TemplateCard key={t} template={t} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="mt-14">
        <h2 className="mb-6 text-center font-grotesk text-2xl font-bold text-white">
          What users say
        </h2>
        <div className="space-y-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10"
            >
              <p className="text-sm text-gray-200 leading-relaxed">
                "{t.quote}"
              </p>
              <p className="mt-3 text-xs text-stone">
                — <span className="text-white">{t.name}</span>, {t.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="mt-14">
        <h2 className="mb-2 text-center font-grotesk text-2xl font-bold text-white">
          Simple Pricing
        </h2>
        <p className="mb-6 text-center text-xs text-stone">
          No subscriptions. Pay per use — fix or build.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-grotesk font-bold text-white">🟢 Free</h3>
              <span className="font-grotesk text-2xl font-extrabold text-white">
                ₦0
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-stone">
              <li>✓ 3 free uses (fix or build)</li>
              <li>✓ Classic + Minimal templates</li>
              <li>✓ ATS score + keyword analysis</li>
              <li>✓ PDF download</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-grotesk font-bold text-white">
                🔵 Standard
              </h3>
              <span className="font-grotesk text-2xl font-extrabold text-cyan">
                ₦1,000
              </span>
            </div>
            <p className="text-xs text-stone mb-3">per use</p>
            <ul className="space-y-1.5 text-xs text-stone">
              <li>✓ Modern template</li>
              <li>✓ Executive template</li>
              <li>✓ All free templates (after free uses)</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-blue/10 p-5 ring-2 ring-blue">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-grotesk font-bold text-white">
                💎 Premium
              </h3>
              <span className="font-grotesk text-2xl font-extrabold text-cyan">
                ₦1,500
              </span>
            </div>
            <p className="text-xs text-stone mb-3">per use</p>
            <ul className="space-y-1.5 text-xs text-stone">
              <li>✓ Creative, Corporate, Academic</li>
              <li>✓ Japa (Western format)</li>
              <li>✓ Tech (developer-focused)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="mt-14">
        <h2 className="mb-6 text-center font-grotesk text-2xl font-bold text-white">
          Frequently asked
        </h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-navy/40 ring-1 ring-white/10 overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-white">
                {item.q}
                <span className="text-cyan transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-4 pb-4 text-xs text-stone leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="mt-14 rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/10 p-6 ring-1 ring-blue/30 text-center">
        <h2 className="font-grotesk text-2xl font-bold text-white">
          Ready to get started?
        </h2>
        <p className="mt-2 text-sm text-stone">
          Sign up free — get 3 fixes or builds on the house.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={loggedIn ? "#fix" : "/signup"}
            onClick={(e) => {
              if (loggedIn) {
                e.preventDefault();
                document
                  .getElementById("fix")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-6 py-3 font-grotesk font-bold text-white transition hover:bg-blue-hover active:scale-[0.98]"
          >
            {loggedIn ? "⚡ Fix My CV" : "✨ Sign up free"}
          </Link>
          <Link
            href="/build-cv"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan/20 px-6 py-3 font-grotesk font-bold text-white ring-1 ring-cyan transition hover:bg-cyan/30 active:scale-[0.98]"
          >
            ✨ Build from scratch
          </Link>
        </div>
      </section>

      {/* ============ PAYWALL ============ */}
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

// ============================================================================
// Template card component
// ============================================================================
function TemplateCard({ template }: { template: TemplateId }) {
  const info = TEMPLATES[template];
  return (
    <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">
          {info.tier === "premium" && "💎 "}
          {info.name}
        </span>
        <span
          className={`text-[10px] font-semibold ${
            info.priceNaira === 0 ? "text-emerald" : "text-cyan"
          }`}
        >
          {info.priceNaira === 0 ? "FREE" : `₦${info.priceNaira}`}
        </span>
      </div>
      <div className="mt-1 text-[10px] text-stone">{info.bestFor}</div>
      <div className="mt-1 text-[10px] text-gray-500">
        {info.description}
      </div>
    </div>
  );
}
