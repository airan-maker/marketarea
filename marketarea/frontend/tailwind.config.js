/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#137fec",
        // Theme-aware CSS variable colors
        t: {
          bg: "var(--bg-base)",
          card: "var(--bg-card)",
          "card-alt": "var(--bg-card-alt)",
          input: "var(--bg-input)",
          overlay: "var(--bg-overlay)",
          sheet: "var(--bg-sheet)",
          text: "var(--text-primary)",
          sub: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inv: "var(--text-inverse)",
          border: "var(--border-color)",
          "border-s": "var(--border-subtle)",
          gauge: "var(--gauge-track)",
          dot: "var(--chart-dot-fill)",
          bar: "var(--bar-inactive)",
        },
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(19,127,236,0.4)",
        sheet: "0 -5px 30px var(--shadow-color)",
        card: "0 1px 3px var(--shadow-color)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(19,127,236,0.3)" },
          "50%": { boxShadow: "0 0 25px rgba(19,127,236,0.6)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
      },
    },
  },
  plugins: [],
};
