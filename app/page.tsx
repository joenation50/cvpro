"use client";

import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { CvDocument } from "./components/CvDocument";
import { FileUploader } from "./components/FileUploader";
import {
  usePaystack,
  isTemplateUnlocked,
  PREMIUM_TEMPLATES,
} from "./lib/usePaystack";

/**
 * CVPro — Landing page + form (Phase 1 MVP).
 * Features:
 *  - Paste OR upload CV (PDF / DOCX / TXT)
 *  - Paste OR upload job description
 *  - AI rewrite via /api/fix
 *  - 3 free templates + 2 premium (Paystack)
 *  - Real PDF download
 *
 * Made by PrimeWeb Designs
 */

type FixResult = {
  atsScore: number;
  rewrittenCv: string;
  missingKeywords: string[];
  improvements: string[];
};

type Template = "classic" | "modern" | "minimal" | "executive" | "creative";

// ---- Feature grid data ----
const FEATURES = [
  {
    icon: "✅",
    title: "ATS Optimization",
    desc: "Beat the bots that filter out 75% of CVs.",
  },
  {
    icon: "🇳🇬",
    title: "Nigeria-specific",
    desc: "NYSC section, WAEC/ICAN/HND formatting, Naira salary phrasing.",
  },
  {
    icon: "📄",
    title: "Upload or Paste",
    desc: "Drop your existing CV as PDF or Word — no retyping.",
  },
  {
    icon: "⚡",
    title: "60 Seconds",
    desc: "Upload, fix, download. No account needed.",
  },
];

const PRICING = [
  {
    plan: "Free",
    price: "₦0",
    perks: ["1 CV fix", "3 basic templates", "Copy text"],
  },
  {
    plan: "Starter",
    price: "₦1,500",
    perks: ["1 clean CV", "Executive template", "No watermark"],
    featured: true,
  },
  {
    plan: "Pro",
    price: "₦4,500/mo",
    perks: ["Unlimited fixes", "Cover letters", "Priority queue"],
  },
];

export default function Home() {
  // ---- Form state ----
  const [cv, setCv] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FixResult | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [template, setTemplate] = useState<Template>("classic");

  // ---- Input mode (paste vs upload) ----
  const [cvMode, setCvMode] = useState<"paste" | "upload">("paste");
  const [jobMode, setJobMode] = useState<"paste" | "upload">("paste");
  const [uploadedCvName, setUploadedCvName] = useState<string | null>(null);
  const [uploadedJobName, setUploadedJobName] = useState<string | null>(null);

  // ---- Premium unlock state ----
  const [showUnlockModal, setShowUnlockModal] = useState<
    null | "executive" | "creative"
  >(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const { pay } = usePaystack();

  // ---- Load any previously-unlocked templates ----
  useEffect(() => {
    const ids = ["executive", "creative"].filter((id) =>
      isTemplateUnlocked(id)
    );
    setUnlocked(ids);
  }, []);

  // ---- Submit to /api/fix ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Something spoil. Try again.");
      setResult(data as FixResult);

      setTimeout(
        () =>
          document
            .getElementById("results")
            ?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something spoil. Try again."
      );
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

  // ---- Copy rewritten CV ----
  async function copyText() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.rewrittenCv);
      alert("Copied to clipboard!");
    } catch {
      alert("Could not copy. Long-press the text and copy manually.");
    }
  }

  // ---- Reset ----
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
      ? "text-yellow-400"
      : "text-red-400"
    : "";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16">
      {/* ---------- Hero ---------- */}
      <header className="pt-10 pb-8 text-center">
        <span className="inline-block rounded-full bg-deepBlue/20 px-3 py-1 text-xs font-semibold text-deepBlue">
          🇳🇬 Built for Nigerian job seekers
        </span>
        <h1 className="mt-4 font-grotesk text-3xl font-bold leading-tight sm:text-4xl">
          Fix Your CV. Land the Job. In 60 Seconds.
        </h1>
        <p className="mt-3 text-sm text-gray-400 sm:text-base">
          Upload or paste your CV and the job description. AI rewrites it to pass ATS.
        </p>
      </header>

      {/* ---------- Form ---------- */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ============ CV INPUT ============ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Your CV
              </label>
              <div className="flex gap-1 rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
                <button
                  type="button"
                  onClick={() => setCvMode("paste")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    cvMode === "paste"
                      ? "bg-deepBlue text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setCvMode("upload")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    cvMode === "upload"
                      ? "bg-deepBlue text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {cvMode === "paste" ? (
              <textarea
                id="cv"
                value={cv}
                onChange={(e) => setCv(e.target.value)}
                rows={8}
                placeholder="Paste your full CV text here..."
                className="w-full rounded-xl bg-greyCard/5 p-4 text-sm text-white placeholder-gray-500 ring-1 ring-white/15 focus:ring-2 focus:ring-deepBlue"
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
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <textarea
                      value={cv}
                      onChange={(e) => setCv(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl bg-greyCard/5 p-3 text-xs text-gray-200 ring-1 ring-white/10 focus:ring-2 focus:ring-deepBlue"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Edit the text above if anything looks wrong.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ============ JOB DESCRIPTION INPUT ============ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Job Description
              </label>
              <div className="flex gap-1 rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
                <button
                  type="button"
                  onClick={() => setJobMode("paste")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    jobMode === "paste"
                      ? "bg-deepBlue text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => setJobMode("upload")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    jobMode === "upload"
                      ? "bg-deepBlue text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {jobMode === "paste" ? (
              <textarea
                id="job"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                placeholder="Paste the job description here (Jobberman, LinkedIn, etc.)..."
                className="w-full rounded-xl bg-greyCard/5 p-4 text-sm text-white placeholder-gray-500 ring-1 ring-white/15 focus:ring-2 focus:ring-deepBlue"
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
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl bg-greyCard/5 p-3 text-xs text-gray-200 ring-1 ring-white/10 focus:ring-2 focus:ring-deepBlue"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ============ SUBMIT BUTTON ============ */}
          <button
            type="submit"
            disabled={loading || !cv.trim() || !jobDescription.trim()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-deepBlue font-grotesk text-lg font-bold text-white transition hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Fixing your CV...
              </>
            ) : (
              <>⚡ Fix My CV</>
            )}
          </button>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}
        </form>
      )}

      {/* ---------- Results ---------- */}
      {result && (
        <section
          id="results"
          className="mt-10 space-y-6 rounded-2xl bg-greyCard/5 p-5 ring-1 ring-white/10"
        >
          {/* ATS Score */}
          <div className="flex items-center justify-between">
            <h2 className="font-grotesk text-xl font-bold">Your ATS Score</h2>
            <span
              className={`font-grotesk text-4xl font-extrabold ${scoreColor}`}
            >
              {result.atsScore}%
            </span>
          </div>

          {/* Missing keywords */}
          {result.missingKeywords.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-300">
                Missing keywords to add:
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-300">
                What we improved:
              </h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-300">
                {result.improvements.map((imp, i) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Rewritten CV */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-300">
              Your rewritten CV:
            </h3>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-obsidian p-4 text-xs text-gray-200 ring-1 ring-white/10">
              {result.rewrittenCv}
            </pre>
          </div>

          {/* Template picker */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-300">
              Choose a template:
            </h3>

            {/* Free templates */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(["classic", "modern", "minimal"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplate(t)}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold capitalize transition ${
                    template === t
                      ? "bg-deepBlue text-white ring-2 ring-deepBlue"
                      : "bg-white/5 text-gray-300 ring-1 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Premium templates */}
            <div className="grid grid-cols-2 gap-2">
              {(["executive", "creative"] as const).map((t) => {
                const isUnlocked = unlocked.includes(t);
                const info = PREMIUM_TEMPLATES[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (isUnlocked) {
                        setTemplate(t);
                      } else {
                        setShowUnlockModal(t);
                      }
                    }}
                    className={`relative rounded-xl px-3 py-3 text-sm font-semibold capitalize transition ${
                      template === t
                        ? "bg-yellow-500 text-black ring-2 ring-yellow-500"
                        : isUnlocked
                        ? "bg-white/5 text-gray-200 ring-1 ring-yellow-500/40 hover:bg-white/10"
                        : "bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 text-gray-200 ring-1 ring-yellow-500/40 hover:from-yellow-500/30"
                    }`}
                  >
                    <span className="mr-1">{isUnlocked ? "✓" : "💎"}</span>
                    {info.name}
                    {!isUnlocked && (
                      <span className="block text-[10px] font-normal mt-0.5 text-yellow-300">
                        ₦{info.priceNaira.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={pdfLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald font-bold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {pdfLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Generating PDF...
                </>
              ) : (
                <>📄 Download PDF</>
              )}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={copyText}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 active:scale-[0.98]"
              >
                📋 Copy Text
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 active:scale-[0.98]"
              >
                🔄 Fix Another
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Feature grid ---------- */}
      <section className="mt-14">
        <h2 className="mb-6 text-center font-grotesk text-2xl font-bold">
          Why CVPro?
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-greyCard/5 p-5 ring-1 ring-white/10"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 font-grotesk font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section className="mt-14">
        <h2 className="mb-6 text-center font-grotesk text-2xl font-bold">
          Simple Naira Pricing
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.plan}
              className={`rounded-2xl p-5 text-center ${
                p.featured
                  ? "bg-deepBlue/15 ring-2 ring-deepBlue"
                  : "bg-greyCard/5 ring-1 ring-white/10"
              }`}
            >
              <h3 className="font-grotesk font-bold">{p.plan}</h3>
              <p className="my-2 font-grotesk text-2xl font-extrabold text-deepBlue">
                {p.price}
              </p>
              <ul className="space-y-1 text-xs text-gray-400">
                {p.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          Secure payments — cards, bank transfer, USSD.
        </p>
      </section>

      {/* ---------- Trust ---------- */}
      <p className="mt-10 text-center text-xs text-gray-500">
        🔒 Your CV is never stored. Processed in your browser.
      </p>

      {/* ---------- Unlock Modal ---------- */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-obsidian ring-1 ring-white/10 p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">💎</div>
              <h3 className="font-grotesk text-xl font-bold text-white">
                Unlock {PREMIUM_TEMPLATES[showUnlockModal].name} Template
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                {PREMIUM_TEMPLATES[showUnlockModal].description}
              </p>
            </div>

            <div className="bg-yellow-500/10 ring-1 ring-yellow-500/30 rounded-xl p-4 text-center">
              <div className="text-xs text-yellow-300 mb-1">
                One-time payment
              </div>
              <div className="font-grotesk text-3xl font-extrabold text-yellow-400">
                ₦
                {PREMIUM_TEMPLATES[
                  showUnlockModal
                ].priceNaira.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Lifetime access · No subscription
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Your email (for receipt)
              </label>
              <input
                type="email"
                id="paystack-email"
                placeholder="you@email.com"
                className="w-full rounded-xl bg-white/5 p-3 text-sm text-white placeholder-gray-500 ring-1 ring-white/15 focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(null)}
                className="flex-1 h-12 rounded-xl bg-white/5 font-semibold text-white ring-1 ring-white/10 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(
                    "paystack-email"
                  ) as HTMLInputElement | null;
                  const email = input?.value?.trim() || "";
                  if (!email || !email.includes("@")) {
                    alert("Please enter a valid email address");
                    return;
                  }
                  pay({
                    email,
                    templateId: showUnlockModal,
                    onSuccess: () => {
                      setUnlocked((prev) =>
                        prev.includes(showUnlockModal)
                          ? prev
                          : [...prev, showUnlockModal]
                      );
                      setTemplate(showUnlockModal);
                      setShowUnlockModal(null);
                      alert("🎉 Template unlocked! You can now download.");
                    },
                  });
                }}
                className="flex-1 h-12 rounded-xl bg-yellow-500 font-bold text-black hover:bg-yellow-400 transition active:scale-[0.98]"
              >
                Pay Now
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 pt-2">
              🔒 Secure payment · Card, bank transfer, USSD
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
