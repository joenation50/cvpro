import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0A0F",
};

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
  metadataBase: new URL("https://cvpro-2uy.pages.dev"),
  openGraph: {
    title: "CVPro — Fix Your CV. Land the Job.",
    description:
      "AI rewrites your CV to pass ATS. Upload PDF or Word. Get a job-ready CV in 60 seconds.",
    url: "https://cvpro-2uy.pages.dev",
    siteName: "CVPro",
    images: [
      {
        url: "/og-image.png",
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
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CVPro",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} bg-ink font-sans text-white antialiased min-h-screen flex flex-col selection:bg-blue/30 selection:text-cyan-light`}
      >
        <main className="flex-1">{children}</main>

        <footer
          className="mt-auto border-t border-white/5 bg-navy/40 backdrop-blur-sm"
          role="contentinfo"
        >
          <div className="mx-auto w-full max-w-2xl px-4 py-8">
            <div className="text-center">
              <div className="font-grotesk text-lg font-bold tracking-tight">
                <span className="text-white">CV</span>
                <span className="text-cyan">Pro</span>
              </div>
              <p className="mt-1 text-xs text-stone">
                Fix your CV. Land the job. In 60 seconds.
              </p>
            </div>

            <nav
              aria-label="Footer"
              className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-stone"
            >
              <Link href="/about" className="transition-colors hover:text-cyan">
                About
              </Link>
              <Link href="/terms" className="transition-colors hover:text-cyan">
                Terms
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-cyan">
                Privacy
              </Link>
              <a
                href="mailto:joenation98@gmail.com"
                className="transition-colors hover:text-cyan"
              >
                Contact
              </a>
            </nav>

            <div className="mt-6 flex flex-col items-center gap-1 text-[11px] text-gray-600">
              <p>© {new Date().getFullYear()} CVPro. All rights reserved.</p>
              <p className="flex items-center gap-1">
                <span>Made by</span>
                <span className="font-semibold text-stone">PrimeWeb Designs</span>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
