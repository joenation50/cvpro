"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { FileUploader } from "@/components/FileUploader";
import { PaywallModal } from "@/components/PaywallModal";
import { getSupabase } from "@/lib/supabase";
import { FREE_FIX_LIMIT, TEMPLATES, type TemplateId } from "@/lib/useCredits";
import {
  CoverLetterDocument,
  type LetterTone,
} from "@/components/CoverLetterDocument";
import { pdf } from "@react-pdf/renderer";

interface CoverResult {
  coverLetter: string;
  wordCount: number;
  highlights: string[];
  isFreeFix?: boolean;
  fixesRemaining?: number;
}

const TONES: { id: LetterTone; name: string; desc: string; emoji: string }[] = [
  {
    id: "professional",
    name: "Professional",
    desc: "Formal, standard corporate register",
    emoji: "💼",
  },
  {
    id: "friendly",
    name: "Friendly",
    desc: "Warm, approachable, human",
    emoji: "😊",
  },
  {
    id: "bold",
    name: "Bold",
    desc: "Confident, direct, memorable",
    emoji: "🔥",
  },
];

export default function CoverLetterPage() {
  const router = useRouter();
  const supabase = getSupabase();

  // ---- Form state ----
  const [cv, setCv] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tone, setTone] = useState<LetterTone>("professional");
  const [template, setTemplate] = useState<TemplateId>("classic");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoverResult | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

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
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv,
          jobDescription,
          tone,
          companyName,
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

      setResult(data as CoverResult);
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

  // ---- PDF download ----
  async function downloadPdf() {
    if (!result) return;
    setPdfLoading(true);
    try {
      const blob = await pdf(
        <CoverLetterDocument
          letterText={result.coverLetter}
          tone={tone}
          template={template}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CVPro-CoverLetter-${template}.pdf`;
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
      await navigator.clipboard.writeText(result.coverLetter);
      alert("Copied to clipboard!");
    } catch {
      alert("Could not copy. Long-press the text and copy manually.");
    }
  }

  function reset() {
    setCv("");
    setJobDescription("");
    setCompanyName("");
    setTone("professional");
    setTemplate("classic");
    setResult(null);
    setError(null);
    setUploadedCvName(null);
    setUploadedJobName(null);
    setCvMode("paste");
    setJobMode("paste");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handlePaywallPaid(selectedTemplate: TemplateId) {
    setShowPaywall(false);
    setTemplate(selectedTemplate);
    // Retry with paidFix = true (simulated payment for now)
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(fakeEvent, true);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20">
      <AppHeader />

      {/* ============ HERO ============ */}
      <section className="pt-4 pb-8 text-center">
        {loggedIn && (
          <div
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-3 ${
              fixesLeft > 0 ? "bg-cyan/15 text-cyan" : "bg-coral/15 text-coral"
            }`}
          >
            {fixesLeft > 0
              ? `🎁 ${fixesLeft} free ${fixesLeft === 1 ? "use" : "uses"} left`
              : "🔒 Free uses exhausted — pay ₦1,000+ per use"}
          </div>
        )}

        <h1 className="font-grotesk text-3xl font-bold leading-tight sm:text-4xl">
          Write a <span className="text-cyan">Cover Letter</span>
          <br />
          That Gets You Interviews.
        </h1>
        <p className="mt-4 text-sm text-stone sm:text-base max-w-md mx-auto">
          AI writes a personalized cover letter from your CV and the job
          description — in 30 seconds.
        </p>
      </section>

      {/* ============ FORM ============ */}
      {!result && (
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10 space-y-5"
        >
          {/* CV INPUT */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white">
                Your CV
              </label>
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

          {/* COMPANY NAME (optional) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Company name <span className="text-stone">(optional)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Paystack, GTBank, Flutterwave"
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-stone ring-1 ring-white/10 focus:ring-2 focus:ring-cyan outline-none"
            />
          </div>

          {/* TONE */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`rounded-xl p-3 text-left transition ${
                    tone === t.id
                      ? "bg-blue/20 ring-2 ring-cyan"
                      : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="text-lg">{t.emoji}</div>
                  <div className="text-xs font-semibold text-white mt-1">
                    {t.name}
                  </div>
                  <div className="text-[10px] text-stone leading-tight">
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
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
            <p className="mt-2 text-[10px] text-stone">
              Note: Cover letters currently use free templates. Premium letter
              templates coming soon.
            </p>
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
                Writing your letter...
              </>
            ) : !loggedIn ? (
              <>Sign up free to continue</>
            ) : fixesLeft > 0 ? (
              <>✍️ Write My Cover Letter (Free)</>
            ) : (
              <>💳 Pay ₦1,000 & Write</>
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
              Your cover letter
            </h2>
            <span className="text-xs text-stone">
              {result.wordCount} words
            </span>
          </div>

          {result.highlights.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone">
                What we emphasized
              </h3>
              <ul className="space-y-1.5">
                {result.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-gray-200 flex gap-2">
                    <span className="text-cyan">→</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone">
              Letter preview
            </h3>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-ink p-4 text-[11px] text-gray-200 ring-1 ring-white/10 leading-relaxed">
              {result.coverLetter}
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
              🔄 Write Another
            </button>
          </div>
        </section>
      )}

      {/* ============ PAYWALL ============ */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPaid={handlePaywallPaid}
        feature="cover-letter"
        defaultTemplate={template}
      />
    </div>
  );
}
