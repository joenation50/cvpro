"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/AuthHeader";
import { FileUploader } from "@/components/FileUploader";
import { PaywallModal } from "@/components/PaywallModal";
import { getSupabase } from "@/lib/supabase";
import { FREE_FIX_LIMIT, TEMPLATES, type TemplateId } from "@/lib/useCredits";
import { pdf } from "@react-pdf/renderer";
import { InterviewPrepDocument } from "@/components/InterviewPrepDocument";

interface InterviewQuestion {
  category: "Behavioral" | "Technical" | "Nigeria-Specific";
  question: string;
  answer: string;
  coachTip: string;
}

interface PrepResult {
  readinessScore: number;
  questions: InterviewQuestion[];
  topStrengths: string[];
  watchOuts: string[];
  isFreeFix?: boolean;
  fixesRemaining?: number;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Behavioral: {
    bg: "bg-blue/15",
    text: "text-blue",
    label: "💬 Behavioral",
  },
  Technical: {
    bg: "bg-cyan/15",
    text: "text-cyan",
    label: "⚙️ Technical",
  },
  "Nigeria-Specific": {
    bg: "bg-emerald/15",
    text: "text-emerald",
    label: "🇳🇬 Nigeria",
  },
};

export default function InterviewPrepPage() {
  const router = useRouter();
  const supabase = getSupabase();

  // ---- Form state ----
  const [cv, setCv] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [template, setTemplate] = useState<TemplateId>("classic");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrepResult | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // ---- Input modes ----
  const [cvMode, setCvMode] = useState<"paste" | "upload">("paste");
  const [jobMode, setJobMode] = useState<"paste" | "upload">("paste");
  const [uploadedCvName, setUploadedCvName] = useState<string | null>(null);
  const [uploadedJobName, setUploadedJobName] = useState<string | null>(null);

  // ---- Auth + credits ----
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [fixesLeft, setFixesLeft] = useState<number>(FREE_FIX_LIMIT);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    async function load() {
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
        .select("free_fixes_used")
        .eq("id", user.id)
        .single();

      const used = profile?.free_fixes_used ?? 0;
      setFixesLeft(Math.max(0, FREE_FIX_LIMIT - used));
    }
    load();
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
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv,
          jobDescription,
          template,
          paidFix,
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

      setResult(data as PrepResult);
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
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaywallPaid(selectedTemplate: TemplateId) {
    setShowPaywall(false);
    setTemplate(selectedTemplate);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(fakeEvent, true);
  }

  // ---- PDF ----
  async function downloadPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const blob = await pdf(
        <InterviewPrepDocument result={result} template={template} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CVPro-InterviewPrep.pdf`;
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
    setCv("");
    setJobDescription("");
    setResult(null);
    setError(null);
    setUploadedCvName(null);
    setUploadedJobName(null);
    setCvMode("paste");
    setJobMode("paste");
    setTemplate("classic");
    setExpandedIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const scoreColor = result
    ? result.readinessScore >= 75
      ? "text-emerald"
      : result.readinessScore >= 50
      ? "text-amber"
      : "text-coral"
    : "";

  const behavioralCount = result?.questions.filter(
    (q) => q.category === "Behavioral"
  ).length;
  const technicalCount = result?.questions.filter(
    (q) => q.category === "Technical"
  ).length;
  const nigeriaCount = result?.questions.filter(
    (q) => q.category === "Nigeria-Specific"
  ).length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20">
      <AuthHeader />

      {/* HERO */}
      <section className="pt-4 pb-8 text-center">
        {loggedIn && (
          <div
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-3 ${
              fixesLeft > 0 ? "bg-cyan/15 text-cyan" : "bg-coral/15 text-coral"
            }`}
          >
            {fixesLeft > 0
              ? `🎁 ${fixesLeft} free ${fixesLeft === 1 ? "use" : "uses"} left`
              : "🔒 Free uses exhausted — pay ₦2,000 per prep"}
          </div>
        )}

        <h1 className="font-grotesk text-3xl font-bold leading-tight sm:text-4xl">
          Ace Your <span className="text-cyan">Interview</span>
          <br />
          With Personalized Prep.
        </h1>
        <p className="mt-4 text-sm text-stone sm:text-base max-w-md mx-auto">
          AI generates 10 likely interview questions + STAR-method answers,
          tailored to your CV and the exact job.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-stone">
          <span>💬 5 Behavioral</span>
          <span>·</span>
          <span>⚙️ 3 Technical</span>
          <span>·</span>
          <span>🇳🇬 2 Local</span>
        </div>
      </section>

      {/* FORM */}
      {!result && (
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10 space-y-5"
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
                rows={6}
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
                      rows={4}
                      className="w-full rounded-xl bg-white/5 p-3 text-xs text-gray-200 ring-1 ring-white/10"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* JOB DESCRIPTION */}
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

          {/* TEMPLATE */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              PDF template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["classic", "modern", "minimal"] as TemplateId[]).map((id) => {
                const info = TEMPLATES[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTemplate(id)}
                    className={`rounded-xl p-3 text-left transition ${
                      template === id
                        ? "bg-blue/20 ring-2 ring-cyan"
                        : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-xs font-semibold text-white">
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

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading || !cv.trim() || !jobDescription.trim()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue font-grotesk text-lg font-bold text-white transition hover:bg-blue-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Preparing your interview pack...
              </>
            ) : !loggedIn ? (
              <>Sign up free to continue</>
            ) : fixesLeft > 0 ? (
              <>🎤 Prepare Me (Free)</>
            ) : (
              <>💳 Pay ₦2,000 & Prepare</>
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

      {/* RESULTS */}
      {result && (
        <section
          id="results"
          className="space-y-5"
        >
          {/* Readiness Score */}
          <div className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-grotesk text-lg font-bold text-white">
                  Interview Readiness
                </h2>
                <p className="text-xs text-stone mt-1">
                  How prepared you are based on your CV vs this role
                </p>
              </div>
              <span
                className={`font-grotesk text-4xl font-extrabold ${scoreColor}`}
              >
                {result.readinessScore}%
              </span>
            </div>
          </div>

          {/* Category summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-blue/10 p-3 ring-1 ring-blue/20 text-center">
              <div className="text-lg">💬</div>
              <div className="mt-1 text-lg font-bold text-white">
                {behavioralCount}
              </div>
              <div className="text-[10px] text-stone">Behavioral</div>
            </div>
            <div className="rounded-xl bg-cyan/10 p-3 ring-1 ring-cyan/20 text-center">
              <div className="text-lg">⚙️</div>
              <div className="mt-1 text-lg font-bold text-white">
                {technicalCount}
              </div>
              <div className="text-[10px] text-stone">Technical</div>
            </div>
            <div className="rounded-xl bg-emerald/10 p-3 ring-1 ring-emerald/20 text-center">
              <div className="text-lg">🇳🇬</div>
              <div className="mt-1 text-lg font-bold text-white">
                {nigeriaCount}
              </div>
              <div className="text-[10px] text-stone">Local</div>
            </div>
          </div>

          {/* Strengths */}
          {result.topStrengths.length > 0 && (
            <div className="rounded-2xl bg-emerald/5 p-5 ring-1 ring-emerald/20">
              <h3 className="mb-3 text-sm font-semibold text-emerald">
                ✅ Your strengths for this role
              </h3>
              <ul className="space-y-1.5">
                {result.topStrengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-200 flex gap-2">
                    <span className="text-emerald">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Watch outs */}
          {result.watchOuts.length > 0 && (
            <div className="rounded-2xl bg-amber/5 p-5 ring-1 ring-amber/20">
              <h3 className="mb-3 text-sm font-semibold text-amber">
                ⚠️ Prepare to address
              </h3>
              <ul className="space-y-1.5">
                {result.watchOuts.map((w, i) => (
                  <li key={i} className="text-xs text-gray-200 flex gap-2">
                    <span className="text-amber">→</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-3">
            <h2 className="font-grotesk text-lg font-bold text-white">
              Your 10 questions
            </h2>

            {result.questions.map((q, i) => {
              const style = CATEGORY_STYLES[q.category] || CATEGORY_STYLES.Behavioral;
              const isOpen = expandedIndex === i;

              return (
                <div
                  key={i}
                  className="rounded-2xl bg-navy/40 ring-1 ring-white/10 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isOpen ? null : i)}
                    className="w-full text-left p-4 hover:bg-white/5 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${style.bg} ${style.text}`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold mb-2 ${style.bg} ${style.text}`}
                        >
                          {style.label}
                        </div>
                        <p className="text-sm font-medium text-white leading-snug">
                          {q.question}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-cyan transition ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        ▾
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/5">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-cyan mb-1 mt-3">
                          STAR Answer
                        </div>
                        <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                          {q.answer}
                        </p>
                      </div>
                      {q.coachTip && (
                        <div className="rounded-xl bg-cyan/5 p-3 ring-1 ring-cyan/20">
                          <div className="text-[10px] uppercase tracking-wider text-cyan mb-1">
                            💡 Coach Tip
                          </div>
                          <p className="text-xs text-gray-200">
                            {q.coachTip}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald font-bold text-ink transition hover:brightness-110 disabled:opacity-60"
            >
              {pdfLoading ? "Generating PDF..." : "📄 Download Prep Pack"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              🔄 Prepare Another
            </button>
          </div>
        </section>
      )}

      {/* PAYWALL */}
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
