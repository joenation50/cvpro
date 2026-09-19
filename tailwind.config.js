/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CVPro "Deep Ocean" palette
        ink: "#0A0A0F",           // true black base
        navy: "#0F1629",          // primary surface
        "navy-light": "#1A2340",  // elevated surfaces
        "navy-hover": "#232D4D",  // hover states

        blue: {
          DEFAULT: "#2563EB",     // primary action
          hover: "#1D4ED8",
          light: "#3B82F6",
        },
        cyan: {
          DEFAULT: "#38BDF8",     // accent / highlight
          light: "#7DD3FC",
          dark: "#0EA5E9",
        },

        emerald: "#10B981",
        amber: "#F59E0B",
        coral: "#EF4444",
        stone: "#94A3B8",

        // Legacy aliases — so old components don't break
        deepBlue: "#2563EB",
        obsidian: "#0A0A0F",
        greyCard: "#0F1629",
      },
      fontFamily: {
        grotesk: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        blue: "0 8px 32px rgba(37, 99, 235, 0.3)",
        cyan: "0 8px 32px rgba(56, 189, 248, 0.25)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "navy-gradient": "linear-gradient(180deg, #0A0A0F 0%, #0F1629 100%)",
        "blue-gradient": "linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)",
      },
    },
  },
  plugins: [],
};
