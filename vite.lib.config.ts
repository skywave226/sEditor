import { resolve } from "node:path";
import { readFileSync, existsSync, unlinkSync, writeFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * sEditor 浏览器库构建配置（原生 JS 版，无 React）
 * 产物：
 *   - dist/sEditor.js      （IIFE，全局变量 sEditor，内联 CSS + TipTap，用于 <script> 直接引入）
 *   - dist/sEditor.esm.js  （ESM，供 Vite/Webpack/Rollup 等打包器 import）
 *   - dist/sEditor.css     （抽离的 CSS，供 ESM 使用方显式 import）
 */
function inlineCssPlugin(): Plugin {
  return {
    name: "seditor-inline-css",
    enforce: "post",
    writeBundle(opts, bundle) {
      const outDir = opts.dir ?? resolve(__dirname, "dist");
      const cssAssetName = Object.keys(bundle).find((name) => name.endsWith(".css"));
      if (!cssAssetName) return;
      const cssPath = resolve(outDir, cssAssetName);
      if (!existsSync(cssPath)) return;
      const cssCode = readFileSync(cssPath, "utf-8");

      // 1) 把 CSS 内联进 IIFE 产物（用于 <script> 直接引入场景）
      const iifeJsPath = resolve(outDir, "sEditor.js");
      if (existsSync(iifeJsPath)) {
        const injection = `(function(){var d=document,h=d.head;var s=d.createElement('style');s.setAttribute('data-seditor-styles','');s.textContent=${JSON.stringify(cssCode)};h.appendChild(s);})();\n`;
        const jsCode = readFileSync(iifeJsPath, "utf-8");
        writeFileSync(iifeJsPath, injection + jsCode);
      }

      // 2) 保留独立 CSS 文件供 ESM 使用方 import '@skywave226/seditor/dist/sEditor.css'
      const stableCssPath = resolve(outDir, "sEditor.css");
      if (cssPath !== stableCssPath) {
        writeFileSync(stableCssPath, cssCode);
        try { unlinkSync(cssPath); } catch { /* ignore */ }
        delete bundle[cssAssetName];
      }
    },
  };
}

export default defineConfig({
  plugins: [tsconfigPaths(), inlineCssPlugin()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, "src/browser-entry.ts"),
      name: "sEditor",
      fileName: (format) => (format === "es" ? "sEditor.esm.js" : "sEditor.js"),
      formats: ["iife", "es"],
    },
    rollupOptions: {
      external: [],
      output: {
        exports: "named",
      },
    },
  },
});
