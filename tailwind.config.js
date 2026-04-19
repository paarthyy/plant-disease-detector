/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./templates/**/*.html"],
  theme: {
    extend: {
      colors: {
        soil: "#443220",
        moss: "#23452f",
        pine: "#183224",
        sage: "#7e9b73",
        leaf: "#99bb72",
        cream: "#f7f1e6",
        sand: "#eadfc9",
        wheat: "#d1b173",
        rust: "#b45538",
      },
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 18px 42px rgba(35, 69, 47, 0.10)",
        panel: "0 28px 70px rgba(55, 57, 36, 0.12)",
        glow: "0 24px 60px rgba(35, 69, 47, 0.18)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(18px, -14px, 0) scale(1.04)" },
          "66%": { transform: "translate3d(-14px, 16px, 0) scale(0.98)" },
        },
        driftSlow: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) rotate(0deg)" },
          "50%": { transform: "translate3d(-18px, 12px, 0) rotate(6deg)" },
        },
        leafFloat: {
          "0%": { transform: "translate3d(0, 0, 0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "0.55" },
          "50%": { opacity: "0.85" },
          "100%": { transform: "translate3d(36px, -140px, 0) rotate(24deg)", opacity: "0" },
        },
        leafFloatAlt: {
          "0%": { transform: "translate3d(0, 0, 0) rotate(-8deg)", opacity: "0" },
          "15%": { opacity: "0.45" },
          "60%": { opacity: "0.8" },
          "100%": { transform: "translate3d(-28px, -160px, 0) rotate(18deg)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        revealCard: {
          "0%": { opacity: "0", transform: "translateY(28px) scale(0.97)" },
          "55%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseLeaf: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        }
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        drift: "drift 14s ease-in-out infinite",
        "drift-slow": "driftSlow 18s ease-in-out infinite",
        leaf: "leafFloat 12s linear infinite",
        "leaf-alt": "leafFloatAlt 15s linear infinite",
        shimmer: "shimmer 10s linear infinite alternate",
        "fade-up": "fadeUp 700ms ease both",
        "reveal-card": "revealCard 800ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-leaf": "pulseLeaf 2s ease-in-out infinite",
        "spin-slow": "spinSlow 1.2s linear infinite",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, rgba(35,69,47,0.98), rgba(84,126,83,0.94) 55%, rgba(190,209,138,0.88))",
        "page-glow": "radial-gradient(circle at top left, rgba(153,187,114,0.35), transparent 28%), radial-gradient(circle at top right, rgba(209,177,115,0.18), transparent 22%), linear-gradient(180deg, #f7f2e8 0%, #efe4d3 100%)"
      }
    },
  },
  plugins: [],
};
