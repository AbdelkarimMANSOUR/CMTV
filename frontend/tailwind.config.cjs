/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        patients: "#2563eb",
        appointments: "#059669",
        social: "#7c3aed",
        tv: "#d97706",
        danger: "#e11d48"
      },
      boxShadow: {
        card: "0 2px 10px rgba(15, 23, 42, 0.08)",
        cardHover: "0 8px 24px rgba(15, 23, 42, 0.16)"
      }
    }
  },
  plugins: []
};
