import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How CVPro handles your data. Spoiler: we don't store your CV.",
};

export default function PrivacyPage() {
  const lastUpdated = "September 19, 2026";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-stone transition hover:text-cyan"
      >
        ← Back to CVPro
      </Link>

      <h1 className="font-grotesk text-3xl font-bold sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-stone">Last updated: {lastUpdated}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-300">
        <section className="rounded-2xl bg-navy/50 p-5 ring-1 ring-white/10">
          <h2 className="font-grotesk text-lg font-bold text-cyan">
            Summary (the short version)
          </h2>
          <ul className="mt-3 space-y-2">
            <li>
              ✅ We do <strong className="text-white">NOT</strong> store your CV
              or job description
            </li>
            <li>
              ✅ We do <strong className="text-white">NOT</strong> sell your
              data
            </li>
            <li>
              ✅ We do <strong className="text-white">NOT</strong> require an
              account to use CVPro
            </li>
            <li>✅ Your CV is processed in real time and discarded</li>
            <li>⚠️ We do collect anonymous usage analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            1. Information We Do NOT Collect
          </h2>
          <p className="mt-3">
            CVPro does <strong className="text-white">not</strong> collect or
            store:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            <li>Your CV content</li>
            <li>Your job descriptions</li>
            <li>Your name, address, or personal identifiers</li>
            <li>Your phone number (unless you contact us)</li>
            <li>Any document you upload</li>
          </ul>
          <p className="mt-3">
            All CV and job description text is processed in memory to deliver
            the rewrite, then immediately discarded. Nothing is written to
            disk, logged, or stored.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            2. Information We DO Collect
          </h2>
          <p className="mt-3">
            We collect minimal anonymous information to keep CVPro running:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            <li>
              <strong className="text-white">Usage analytics</strong> — pages
              visited, features used, country, device type. No personally
              identifying information.
            </li>
            <li>
              <strong className="text-white">Error logs</strong> — technical
              data when something breaks (never includes your CV text).
            </li>
            <li>
              <strong className="text-white">Payment information</strong> — if
              you purchase a premium template, our payment partner handles your
              payment. We receive only a transaction ID and confirmation of
              payment. We never see your card details.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            3. Third-Party Services
          </h2>
          <p className="mt-3">CVPro uses these trusted third parties:</p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            <li>
              <strong className="text-white">AI processing</strong> — your CV
              and job description are sent to our AI model provider solely for
              rewriting. They do not store the content.
            </li>
            <li>
              <strong className="text-white">Hosting</strong> — our
              infrastructure provider serves the website.
            </li>
            <li>
              <strong className="text-white">Payment processing</strong> —
              handles premium template purchases.
            </li>
            <li>
              <strong className="text-white">Analytics</strong> — anonymous
              usage data only.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            4. Cookies & Local Storage
          </h2>
          <p className="mt-3">
            CVPro uses browser{" "}
            <strong className="text-white">localStorage</strong> to remember
            which premium templates you've unlocked. This stays on your device
            — we can't read it.
          </p>
          <p className="mt-3">
            We do not use tracking cookies or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            5. Children's Privacy
          </h2>
          <p className="mt-3">
            CVPro is not intended for users under 16. We do not knowingly
            collect information from children.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            6. Your Rights
          </h2>
          <p className="mt-3">
            Since we don't store your personal data, there's nothing for us to
            delete. But if you have concerns, contact us at{" "}
            <a
              href="mailto:joenation98@gmail.com"
              className="text-cyan hover:underline"
            >
              joenation98@gmail.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            7. Changes to This Policy
          </h2>
          <p className="mt-3">
            We may update this Privacy Policy occasionally. Changes will be
            posted here with an updated date.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            8. Contact
          </h2>
          <p className="mt-3">
            Questions?{" "}
            <a
              href="mailto:joenation98@gmail.com"
              className="text-cyan hover:underline"
            >
              joenation98@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
