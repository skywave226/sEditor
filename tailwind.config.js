/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // UEditor 经典配色
        ue: {
          border: "#dcdfe6",
          divider: "#e5e6eb",
          bar: "#fafafa",
          hover: "#eef0f3",
          active: "#e6f0ff",
          primary: "#3b8cff",
          "primary-text": "#1d6fe0",
          ink: "#303133",
          sub: "#606266",
          faint: "#909399",
          canvas: "#ffffff",
          page: "#f5f6f7",
        },
      },
      fontFamily: {
        sans: [
          "PingFang SC",
          "Microsoft YaHei",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        serif: ["SimSun", "STSong", "serif"],
        hei: ["SimHei", "STHeiti", "Microsoft YaHei", "sans-serif"],
        kai: ["KaiTi", "STKaiti", "serif"],
      },
      boxShadow: {
        panel: "0 6px 24px rgba(0, 0, 0, 0.12)",
        dropdown: "0 4px 12px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
