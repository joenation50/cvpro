import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About CVPro",
  description:
    "CVPro is an AI-powered CV optimizer built for Nigerian job seekers. Made by PrimeWeb Designs.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-stone transition hover:text-cyan"
      >
        ← Back to CVPro
      </Link>

      <h1 className="font-grotesk text-3xl font-bold sm:text-4xl">
        About <span className="text-cyan">CVPro</span>
      </h1>
      <p className="mt-3 text-stone">
        Built for Nigerian job seekers. Made by PrimeWeb Designs.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-300">
        {/* WHY WE BUILT THIS */}
        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            Why we built this
          </h2>
          <p className="mt-3">
            Every year, millions of Nigerians apply for jobs. Most applications
            get rejected — not because the candidates aren't qualified, but
            because their CVs never make it past the software that screens
            them.
          </p>
          <p className="mt-3">
            That software is called an <strong>ATS</strong> — Applicant
            Tracking System. It scans your CV for keywords, formatting, and
            structure. If it can't read your CV, a human never sees it.
          </p>
          <p className="mt-3">
            CVPro fixes that. Upload your CV, paste the job description, and
            our AI rewrites it to match — using the same language as the job
            posting, in a format ATS systems can read.
          </p>
        </section>

        {/* WHAT MAKES US DIFFERENT */}
        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            What makes CVPro different
          </h2>
          <ul className="mt-3 space-y-2">
            <li>
              <strong className="text-white">Built for Nigeria.</strong> We
              understand NYSC, HND, WAEC, ICAN, and how Nigerian recruiters
              actually read CVs.
            </li>
            <li>
              <strong className="text-white">No signup required.</strong> Use
              it in 60 seconds. No account, no email, no friction.
            </li>
            <li>
              <strong className="text-white">Your data is yours.</strong> We
              don't store your CV. It's processed in real time and gone.
            </li>
            <li>
              <strong className="text-white">ATS-first.</strong> Every rewrite
              is optimized for the systems that screen Nigerian job
              applications.
            </li>
            <li>
              <strong className="text-white">Upload or paste.</strong> PDF,
              Word, or plain text — whatever format your CV is in, we handle
              it.
            </li>
          </ul>
        </section>

        {/* WHO'S BEHIND IT */}
        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            Who's behind CVPro
          </h2>
          <p className="mt-3">
            CVPro is built by{" "}
            <strong className="text-cyan">PrimeWeb Designs</strong>, a small
            software studio building practical digital tools for African
            users. We're obsessed with simple, useful products that solve
            real problems.
          </p>
        </section>

        {/* CONTACT */}
        <section className="rounded-2xl bg-navy/40 p-5 ring-1 ring-white/10">
          <h2 className="font-grotesk text-xl font-bold text-white">
            Get in touch
          </h2>
          <p className="mt-3 text-sm text-stone">
            Questions, feedback, or partnership ideas? We'd love to hear from
            you.
          </p>

          <div className="mt-5 space-y-3">
            {/* Email */}
            <a
              href="mailto:joenation98@gmail.com"
              className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-cyan/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/20 text-lg">
                ✉️
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-stone">
                  Email
                </div>
                <div className="truncate text-sm font-medium text-white">
                  joenation98@gmail.com
                </div>
              </div>
              <span className="text-xs text-cyan">→</span>
            </a>

            {/* Phone */}
            <a
              href="tel:+2348075771583"
              className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-cyan/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald/20 text-lg">
                📞
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-stone">
                  Phone / WhatsApp
                </div>
                <div className="text-sm font-medium text-white">
                  +234 807 577 1583
                </div>
              </div>
              <span className="text-xs text-cyan">→</span>
            </a>

            {/* Company */}
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan/20 text-lg">
                🏢
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-stone">
                  Studio
                </div>
                <div className="text-sm font-medium text-white">
                  PrimeWeb Designs
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OUR PROMISE */}
        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            Our promise
          </h2>
          <p className="mt-3">
            No hidden fees. No data selling. No spam. CVPro exists to help you
            get interviews — not to complicate your job search.
          </p>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-gradient-to-br from-blue/20 to-cyan/10 p-6 ring-1 ring-blue/30 text-center">
        <h3 className="font-grotesk text-lg font-bold text-white">
          Ready to try it?
        </h3>
        <p className="mt-1 text-sm text-stone">
          Fix your CV in under 60 seconds. No signup needed.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-hover"
        >
          ⚡ Fix My CV Now
        </Link>
      </div>
    </div>
  );
}
