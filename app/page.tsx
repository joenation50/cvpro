"use client";

import { useState } from "react";

/**
 * CVPro landing page + form (Phase 1 MVP — one page, mobile-first).
 * - Hero, two text areas, big blue CTA, results panel with ATS score,
 *   rewritten CV, PDF download, feature grid, pricing teaser, trust line.
 */

type FixResult = {
  atsScore: number;
  rewrittenCv: string;
  missingKeywords: string[];
  improvements: string[];
};

// ---- Feature grid data ----
const FEATURES = [
  { icon: "✅", title: "ATS Optimization", desc: "Beat the bots that filter out 75% of CVs." },
  { icon: "🇳🇬", title: "Nigeria-specific", desc: "NYSC section, WAEC/ICAN/HND formatting, Naira salary phrasing." },
  { icon: "🌍", title: "Japa Mode", desc: "UK, Canada & US format CVs — coming soon." },
  { icon: "⚡", title: "60 Seconds", desc: "Paste, fix, download. No account needed." },
];

const PRICING = [
  { plan: "Free", price: "₦0", perks: ["1 CV/month", "Watermarked PDF"] },
  { plan: "Starter", price: "₦1,500", perks: ["1 clean CV", "No watermark", "PDF download"], featured: true },
  { plan: "Pro", price: "₦4,500/mo", perks: ["Unlimited fixes", "Cover letters", "Priority queue"] },
];

export default function Home() {
  const [cv, setCv] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FixResult | null>(null);

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
      if (!res.ok) throw new Error(data.error || "Something spoil. Try again.");
      setResult(data as FixResult);
      // Scroll to results on mobile
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something spoil. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---- PDF download (opens a printable window — simple Phase 1 approach) ----
  function downloadPdf() {
    if (!result) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(
      `<html><head><title>CVPro — Fixed CV</title></head><body style="font-family:Inter,Arial,sans-serif;white-space:pre-wrap;line-height:1.5;padding:32px">${result.rewrittenCv.replace(/[<>]/g, "")}<script>window.print()<\/script></body></html>`
    );
    win.document.close();
  }

  const scoreColor = result && result.atsScore >= 75 ? "text-emerald" : result && result.atsScore >= 50 ? "text-yellow-400" : "text-red-400";

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
          Paste your CV and the job description. AI rewrites it to pass ATS.
        </p>
      </header>

      {/* ---------- Form ---------- */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cv" className="mb-1 block text-sm font-medium text-gray-300">
            Paste Your CV
          </label>
          <textarea
            id="cv"
            value={cv}
            onChange={(e) => setCv(e.target.value)}
            rows={8}
            required
            placeholder="Paste your full CV text here..."
            className="w-full rounded-xl bg-greyCard/5 p-4 text-sm text-white placeholder-gray-500 ring-1 ring-white/15 focus:ring-2 focus:ring-deepBlue"
          />
        </div>
        <div>
          <label htmlFor="job" className="mb-1 block text-sm font-medium text-gray-300">
            Paste Job Description
          </label>
          <textarea
            id="job"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            required
            placeholder="Paste the job description here (Jobberman, LinkedIn, etc.)..."
            className="w-full rounded-xl bg-greyCard/5 p-4 text-sm text-white placeholder-gray-500 ring-1 ring-white/15 focus:ring-2 focus:ring-deepBlue"
          />
        </div>

        {/* Primary action — min 48px tap target */}
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
          <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}
      </form>

      {/* ---------- Results (hidden until submit) ---------- */}
      {result && (
        <section id="results" className="mt-10 space-y-6 rounded-2xl bg-greyCard/5 p-5 ring-1 ring-white/10">
          {/* ATS Score */}
          <div className="flex items-center justify-between">
            <h2 className="font-grotesk text-xl font-bold">Your ATS Score</h2>
            <span className={`font-grotesk text-4xl font-extrabold ${scoreColor}`}>{result.atsScore}%</span>
          </div>

          {/* Missing keywords */}
          {result.missingKeywords.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-300">Missing keywords to add:</h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-300">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-300">What we improved:</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-300">
                {result.improvements.map((imp, i) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Rewritten CV */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-300">Your rewritten CV:</h3>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-obsidian p-4 text-xs text-gray-200 ring-1 ring-white/10">
              {result.rewrittenCv}
            </pre>
          </div>

          {/* Download button — 48px tap target */}
          <button
            onClick={downloadPdf}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            ⬇️ Download PDF
          </button>
        </section>
      )}

      {/* ---------- Feature grid ---------- */}
      <section className="mt-14">
        <h2 className="mb-6 text-center font-grotesk text-2xl font-bold">Why CVPro?</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-greyCard/5 p-5 ring-1 ring-white/10">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 font-grotesk font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Pricing teaser ---------- */}
      <section className="mt-14">
        <h2 className="mb-6 text-center font-grotesk text-2xl font-bold">Simple Naira Pricing</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.plan}
              className={`rounded-2xl p-5 text-center ${
                p.featured ? "bg-deepBlue/15 ring-2 ring-deepBlue" : "bg-greyCard/5 ring-1 ring-white/10"
              }`}
            >
              <h3 className="font-grotesk font-bold">{p.plan}</h3>
              <p className="my-2 font-grotesk text-2xl font-extrabold text-deepBlue">{p.price}</p>
              <ul className="space-y-1 text-xs text-gray-400">
                {p.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">Payments via Paystack — cards, bank transfer &amp; USSD. Coming in Phase 2.</p>
      </section>

      {/* ---------- Trust ---------- */}
      <p className="mt-10 text-center text-xs text-gray-500">
        🔒 Your CV is never stored. Auto-deleted after 24 hours.
      </p>
    </div>
  );
}
