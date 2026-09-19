import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

// ---------------------------------------------------------------------------
// Fonts
// Inter = UI text · Space Grotesk = headlines & brand
// ---------------------------------------------------------------------------
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// ---------------------------------------------------------------------------
// Viewport (PWA installability + mobile behavior)
// ---------------------------------------------------------------------------
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // allow zoom for accessibility
  themeColor: "#0A0A0F", // deep black to match the brand
};

// ---------------------------------------------------------------------------
// Metadata (SEO + social sharing)
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: {
    default: "CVPro — Fix Your CV. Land the Job. In 60 Seconds.",
    template: "%s · CVPro",
  },
  description:
    "AI-powered CV optimizer built for Nigerian job seekers. Upload your CV as PDF or Word, paste the job description, and get an ATS-ready version in seconds. Free to try — no signup needed.",
  keywords: [
    "CV",
    "resume",
    "CV fixer",
    "ATS",
    "AI CV",
    "Nigeria",
    "Nigerian job seekers",
    "Jobberman",
    "career",
    "cover letter",
    "job application",
    "CV template",
    "resume builder Nigeria",
  ],
  authors: [{ name: "CVPro by PrimeWeb Designs" }],
  creator: "PrimeWeb Designs",
  publisher: "PrimeWeb Designs",
  metadataBase: new URL("https://getcvpro.netlify.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CVPro — Fix Your CV. Land the Job.",
    description:
      "AI rewrites your CV to pass ATS. Upload PDF or Word. Get a job-ready CV in 60 seconds.",
    url: "https://getcvpro.netlify.app",
    siteName: "CVPro",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "CVPro — Fix Your CV. Land the Job.",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CVPro — Fix Your CV. Land the Job.",
    description:
      "AI rewrites your CV to pass ATS. Free to try. Made for Nigeria.",
    images: ["/og-image.svg"],
    creator: "@getcvpro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CVPro",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: "/icon-192.svg",
    shortcut: "/favicon.svg",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} bg-ink font-sans text-white antialiased min-h-screen flex flex-col selection:bg-blue/30 selection:text-cyan-light`}
      >
        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer — appears on every page */}
        <footer
          className="mt-auto border-t border-white/5 bg-navy/40 backdrop-blur-sm"
          role="contentinfo"
        >
          <div className="mx-auto w-full max-w-2xl px-4 py-8">
            {/* Top row: logo + tagline */}
            <div className="text-center">
              <div className="font-grotesk text-lg font-bold tracking-tight">
                <span className="text-white">CV</span>
                <span className="text-cyan">Pro</span>
              </div>
              <p className="mt-1 text-xs text-stone">
                Fix your CV. Land the job. In 60 seconds.
              </p>
            </div>

            {/* Middle row: nav links */}
            <nav
              aria-label="Footer"
              className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-stone"
            >
              <Link
                href="/about"
                className="transition-colors hover:text-cyan"
              >
                About
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-cyan"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="transition-colors hover:text-cyan"
              >
                Privacy
              </Link>
              <Link
                href="/refund"
                className="transition-colors hover:text-cyan"
              >
                Contact
              </a>
            </nav>

            {/* Bottom row: copyright + branding */}
            <div className="mt-6 flex flex-col items-center gap-1 text-[11px] text-gray-600">
              <p>
                © {new Date().getFullYear()} CVPro. All rights reserved.
              </p>
              <p className="flex items-center gap-1">
                <span>Made by</span>
                <span className="font-semibold text-stone">
                  PrimeWeb Designs
                </span>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
