/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6", // Bright, Modern Blue
        secondary: "#94a3b8", // Light Slate
        dark: "#334155", // Soft Slate-600 for text
        light: "#ffffff", // Pure White
      }
    },
  },
  plugins: [],
}
