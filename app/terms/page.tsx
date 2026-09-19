import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "CVPro Terms of Service — rules for using our AI CV optimizer.",
};

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-stone">Last updated: {lastUpdated}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-300">
        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            1. Acceptance of Terms
          </h2>
          <p className="mt-3">
            By accessing or using CVPro (the "Service"), you agree to be bound
            by these Terms of Service. If you do not agree, please do not use
            the Service.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            2. Description of Service
          </h2>
          <p className="mt-3">
            CVPro is an AI-powered web application that rewrites CVs to improve
            compatibility with Applicant Tracking Systems (ATS) and specific
            job descriptions. The Service is offered both as a free tool and
            with optional paid upgrades (premium templates).
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            3. Eligibility
          </h2>
          <p className="mt-3">
            You must be at least 16 years old to use CVPro. By using the
            Service, you confirm that the information you provide is accurate
            and that you are the rightful owner of any CV or content you
            upload.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            4. Your Content
          </h2>
          <p className="mt-3">
            You retain full ownership of any CV, job description, or other
            content you upload to CVPro. By using the Service, you grant us a
            temporary, limited license to process your content solely for the
            purpose of delivering the Service (rewriting your CV).
          </p>
          <p className="mt-3">
            We do <strong className="text-white">not</strong> store your CV or
            job description on our servers. Processing happens in real time and
            content is discarded once the result is returned.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            5. Acceptable Use
          </h2>
          <p className="mt-3">You agree NOT to:</p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            <li>Upload content that is illegal, hateful, or harmful</li>
            <li>Impersonate another person</li>
            <li>
              Attempt to reverse-engineer, scrape, or overload the Service
            </li>
            <li>Use the Service for fraudulent or deceptive purposes</li>
            <li>Resell the Service without written permission</li>
          </ul>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            6. AI-Generated Output
          </h2>
          <p className="mt-3">
            CVPro uses artificial intelligence to rewrite your CV. While we aim
            for accuracy and quality, we make no guarantee that the output will
            be error-free, will result in job interviews, or will be suitable
            for every employer or ATS system. You are responsible for reviewing
            and editing any AI-generated content before use.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            7. Payments & Premium Features
          </h2>
          <p className="mt-3">
            Some templates and features require payment. All prices are shown
            in Nigerian Naira (₦) and are one-time payments unless otherwise
            stated. Payments are processed securely by our payment partners.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            8. Limitation of Liability
          </h2>
          <p className="mt-3">
            CVPro is provided "as is." To the maximum extent permitted by law,
            we are not liable for any damages arising from your use of the
            Service, including lost job opportunities, lost data, or indirect
            damages.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            9. Changes to These Terms
          </h2>
          <p className="mt-3">
            We may update these Terms from time to time. Changes will be posted
            on this page with an updated date. Continued use of the Service
            after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-grotesk text-xl font-bold text-white">
            10. Contact
          </h2>
          <p className="mt-3">
            Questions? Email us at{" "}
            <a
              href="mailto:joenation98@gmail.com"
              className="text-cyan hover:underline"
            >
              joenation98@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
