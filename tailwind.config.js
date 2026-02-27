/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0b78ed",
        secondary: "#8ca4b5",
        dark: "#0d2b4d",
        light: "#eff5f9",
      }
    },
  },
  plugins: [],
}
