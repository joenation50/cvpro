import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Fonts: Inter for UI, Space Grotesk for headlines (max 2 fonts, 3 max per spec)
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

// PWA installability meta
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0047FF",
};

export const metadata: Metadata = {
  title: "CVPro — Your CV. Fixed. In 60 seconds.",
  description:
    "Paste your CV and the job description. AI rewrites it to pass ATS and get you interviews. Built for Nigerian job seekers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CVPro",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} bg-obsidian font-sans text-white antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-1">{children}</main>

        {/* Required footer on every screen */}
        <footer className="border-t border-white/10 py-6 text-center text-xs text-gray-500">
          Made by PrimeWeb Designs
        </footer>
      </body>
    </html>
  );
}
