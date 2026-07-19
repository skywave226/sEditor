import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * 单元测试配置
 * - environment: jsdom（编辑器依赖 DOM）
 * - 通过 src/browser-entry.ts 作为入口，覆盖核心 UI 流程
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/seditor/**/*.ts", "src/editor/**/*.ts"],
    },
  },
});
