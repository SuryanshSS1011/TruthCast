import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        body: ["var(--font-body)"],
        code: ["var(--font-code)"],
      },
      colors: {
        void: "#0A0B0D",
        surface: "#111318",
        elevated: "#181C24",
        solana: "#9945FF",
        // Verdict colors
        "verdict-true": "#22C55E",
        "verdict-mostly-true": "#14B8A6",
        "verdict-misleading": "#F59E0B",
        "verdict-mostly-false": "#F97316",
        "verdict-false": "#EF4444",
        "verdict-conflicting": "#A78BFA",
        "verdict-unverifiable": "#6B7280",
      },
      animation: {
        "pulse-ring": "pulse-ring 1.2s cubic-bezier(0.4,0,0.6,1) infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "glow-pulse-false": "glow-pulse-false 3s ease-in-out infinite",
        "slide-up": "slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.3s ease-out",
        "counter-up": "counter-up 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "verdict-enter": "verdict-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "bar-fill": "bar-fill 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "stage-pulse": "stage-pulse 1.2s ease-in-out infinite",
        "pipeline-glow": "pipeline-glow 3s ease-in-out infinite",
        "cursor-blink": "cursor-blink 1s step-end infinite",
        "subclaim-enter": "subclaim-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.06" },
          "50%": { opacity: "0.14" },
        },
        "glow-pulse-false": {
          "0%,100%": {
            boxShadow: "0 0 0 1px #EF4444, 0 0 32px rgba(239,68,68,0.08)",
          },
          "50%": {
            boxShadow: "0 0 0 1px #EF4444, 0 0 32px rgba(239,68,68,0.16)",
          },
        },
        "slide-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "counter-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "verdict-enter": {
          from: { transform: "translateY(24px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "bar-fill": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(var(--fill-percent, 1))" },
        },
        "stage-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(153,69,255,0.4)" },
          "70%": { boxShadow: "0 0 0 6px rgba(153,69,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(153,69,255,0)" },
        },
        "pipeline-glow": {
          "0%,100%": { boxShadow: "0 0 120px 0 rgba(153,69,255,0.04)" },
          "50%": { boxShadow: "0 0 120px 0 rgba(153,69,255,0.08)" },
        },
        "cursor-blink": {
          "0%,50%": { opacity: "1" },
          "51%,100%": { opacity: "0" },
        },
        "subclaim-enter": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      borderRadius: {
        DEFAULT: "8px",
        pill: "20px",
      },
      spacing: {
        // 4px base grid from design doc
        "space-1": "4px",
        "space-2": "8px",
        "space-3": "12px",
        "space-4": "16px",
        "space-6": "24px",
        "space-8": "32px",
        "space-12": "48px",
        "space-16": "64px",
        "space-24": "96px",
      },
      fontSize: {
        // Verdict label sizes
        "verdict-mobile": ["40px", { lineHeight: "1.1", letterSpacing: "0.08em" }],
        "verdict-desktop": ["64px", { lineHeight: "1.1", letterSpacing: "0.08em" }],
        "verdict-false": ["72px", { lineHeight: "1.1", letterSpacing: "0.08em" }],
        // UI typography
        "ui-xs": ["11px", { lineHeight: "1.4", letterSpacing: "0.35em" }],
        "ui-sm": ["12px", { lineHeight: "1.4", letterSpacing: "0.08em" }],
        "ui-md": ["13px", { lineHeight: "1.4", letterSpacing: "0.2em" }],
        "ui-lg": ["15px", { lineHeight: "1.8" }],
      },
      maxWidth: {
        "input": "680px",
      },
      height: {
        "input-desktop": "64px",
        "input-mobile": "56px",
      },
    },
  },
  plugins: [],
};

export default config;
