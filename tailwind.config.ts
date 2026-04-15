import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        field: "#f4f1ea",
        line: "#ddd6c8",
        moss: "#43624b",
        rust: "#b5563c",
        sky: "#4c7d95",
        amber: "#d99c3b"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 27, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
