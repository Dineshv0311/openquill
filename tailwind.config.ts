import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        quill: {
          green: "#188038",
          darkGreen: "#0d5c24",
          lightGreen: "#e8f5e9",
          border: "#e0e0e0",
          yellow: "#fef3c7",
          yellowBorder: "#f59e0b",
          blue: "#dbeafe",
          blueBorder: "#3b82f6",
          text: "#202124",
          muted: "#5f6368"
        }
      }
    },
  },
  plugins: [],
};
export default config;
