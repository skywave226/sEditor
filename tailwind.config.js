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
        // sEditor 经典配色 —— 通过 CSS 变量暴露，用户可在 :root 覆盖
        se: {
          border: "var(--se-border, #dcdfe6)",
          divider: "var(--se-divider, #e5e6eb)",
          bar: "var(--se-bar-bg, #fafafa)",
          hover: "var(--se-hover-bg, #eef0f3)",
          active: "var(--se-active-bg, #e6f0ff)",
          primary: "var(--se-primary, #3b8cff)",
          "primary-text": "var(--se-primary-text, #1d6fe0)",
          ink: "var(--se-ink, #303133)",
          sub: "var(--se-sub, #606266)",
          faint: "var(--se-faint, #909399)",
          canvas: "var(--se-canvas, #ffffff)",
          page: "var(--se-page, #f5f6f7)",
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
