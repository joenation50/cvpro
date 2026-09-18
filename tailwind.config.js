/** @type {import('tailwindcss').Config} */
// CVPro Tailwind config — brand colors + fonts. Dark mode default via class strategy.
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: "#0A0A0A",   // background
        deepBlue: "#0047FF",   // primary / CTA
        emerald: "#00C56A",    // success states
        greyCard: "#F0F2F5",   // card surfaces
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],          // UI
        grotesk: ["var(--font-space-grotesk)", "system-ui", "sans-serif"], // headlines
      },
    },
  },
  plugins: [],
};
