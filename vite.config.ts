import { defineConfig } from 'vite'
import tsconfigPaths from "vite-tsconfig-paths";

// 开发模式配置：用于跑 demo 页（src/main.ts + index.html）
// 库构建见 vite.lib.config.ts
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [tsconfigPaths()],
})
