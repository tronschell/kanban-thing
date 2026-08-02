import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      "2xs": ["0.6875rem", { lineHeight: "0.9375rem", letterSpacing: "0.01em" }],
      xs: ["0.75rem", { lineHeight: "1rem" }],
      sm: ["0.8125rem", { lineHeight: "1.1875rem" }],
      base: ["0.875rem", { lineHeight: "1.3125rem" }],
      md: ["0.9375rem", { lineHeight: "1.4375rem" }],
      lg: ["1.0625rem", { lineHeight: "1.5rem", letterSpacing: "-0.006em" }],
      xl: ["1.25rem", { lineHeight: "1.625rem", letterSpacing: "-0.012em" }],
      "2xl": ["1.5rem", { lineHeight: "1.875rem", letterSpacing: "-0.018em" }],
      "3xl": ["2rem", { lineHeight: "2.25rem", letterSpacing: "-0.024em" }],
      "4xl": ["2.75rem", { lineHeight: "2.9375rem", letterSpacing: "-0.03em" }],
      "5xl": ["3.5rem", { lineHeight: "3.625rem", letterSpacing: "-0.034em" }],
    },
    borderRadius: {
      none: "0",
      tag: "var(--radius-tag)",
      control: "var(--radius-control)",
      card: "var(--radius-card)",
      panel: "var(--radius-panel)",
      full: "9999px",
      DEFAULT: "var(--radius-control)",
    },
    boxShadow: {
      popover: "var(--shadow-popover)",
      modal: "var(--shadow-modal)",
      drag: "var(--shadow-drag)",
      none: "none",
    },
    extend: {
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
        display: "var(--font-display)",
      },
      fontWeight: {
        normal: "var(--weight-body)",
        medium: "var(--weight-medium)",
        semibold: "var(--weight-heading)",
      },
      borderWidth: {
        DEFAULT: "var(--border-width)",
      },
      colors: {
        canvas: "var(--canvas)",
        overlay: "var(--overlay)",
        support: {
          DEFAULT: "var(--support)",
          fg: "var(--support-fg)",
          soft: "var(--support-soft)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
        },
        fg: "var(--fg)",
        muted: "var(--fg-muted)",
        subtle: "var(--fg-subtle)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          fg: "var(--accent-fg)",
          soft: "var(--accent-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          hover: "var(--danger-hover)",
          fg: "var(--danger-fg)",
          soft: "var(--danger-soft)",
        },
      },
      borderColor: {
        DEFAULT: "var(--border)",
        subtle: "var(--border-subtle)",
        strong: "var(--border-strong)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
      },
      width: {
        column: "17.5rem",
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "var(--fg-muted)",
            "--tw-prose-headings": "var(--fg)",
            "--tw-prose-lead": "var(--fg-muted)",
            "--tw-prose-links": "var(--accent)",
            "--tw-prose-bold": "var(--fg)",
            "--tw-prose-counters": "var(--fg-subtle)",
            "--tw-prose-bullets": "var(--border-strong)",
            "--tw-prose-hr": "var(--border)",
            "--tw-prose-quotes": "var(--fg)",
            "--tw-prose-quote-borders": "var(--border)",
            "--tw-prose-captions": "var(--fg-subtle)",
            "--tw-prose-code": "var(--fg)",
            "--tw-prose-pre-code": "var(--fg)",
            "--tw-prose-pre-bg": "var(--surface)",
            "--tw-prose-th-borders": "var(--border)",
            "--tw-prose-td-borders": "var(--border-subtle)",
            maxWidth: "68ch",
          },
        },
      },
    },
  },
  plugins: [typography, animate],
};

export default config;
