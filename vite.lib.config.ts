import { resolve } from "node:path";
import { readFileSync, existsSync, unlinkSync, writeFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * sEditor 浏览器库构建配置（原生 JS 版，无 React）
 * 产物：dist/sEditor.js（IIFE，全局变量 sEditor，内联 CSS + TipTap）
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
      const injection = `(function(){var d=document,h=d.head;var s=d.createElement('style');s.setAttribute('data-seditor-styles','');s.textContent=${JSON.stringify(cssCode)};h.appendChild(s);})();\n`;
      try { unlinkSync(cssPath); } catch { /* ignore */ }
      const jsAssetName = Object.keys(bundle).find(
        (name) => name.endsWith(".js") && name.startsWith("sEditor"),
      );
      if (!jsAssetName) return;
      const jsPath = resolve(outDir, jsAssetName);
      if (!existsSync(jsPath)) return;
      const jsCode = readFileSync(jsPath, "utf-8");
      writeFileSync(jsPath, injection + jsCode);
      delete bundle[cssAssetName];
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
      fileName: () => "sEditor.js",
      formats: ["iife"],
    },
    rollupOptions: {
      external: [],
      output: {
        exports: "named",
      },
    },
  },
});
