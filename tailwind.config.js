module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {

      colors: {
        background: "#0b0b0c",

        primary: {
          DEFAULT: "#6366f1", // indigo
          hover: "#5855eb",
        },

        border: "rgba(255,255,255,0.06)",
        muted: "rgba(255,255,255,0.04)",
      },

      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.3)",
      },

      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },

      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },

    },
  },
  plugins: [],
};