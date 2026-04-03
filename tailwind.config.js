/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          900: "#1e3a8a"
        }
      },
      boxShadow: {
        card: "0 18px 40px rgba(15, 23, 42, 0.14)"
      }
    }
  },
  plugins: []
};
