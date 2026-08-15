/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a141c",
          900: "#0f1b24",
          850: "#122029",
          800: "#142530",
          700: "#1c2f3a",
          600: "#2a4451",
        },
        coral: {
          400: "#ef9673",
          500: "#e8794f",
          600: "#d5673f",
          700: "#b8542f",
        },
        amber: {
          300: "#e6c07e",
          400: "#d9a84e",
          500: "#c6923a",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
