/**
 * sEditor - 老石富文本编辑器
 *
 * 这是一个浏览器端富文本编辑器，依赖 DOM API，不能在 Node.js / SSR 环境直接运行。
 * - 浏览器单文件引入：使用 dist/sEditor.js（IIFE，挂载到 window.sEditor）
 * - 打包器（Vite/Webpack/Rollup）场景：见 README.md 中「作为 npm 包引入」一节
 *
 * 在 Node.js 环境下 require/import 本模块会抛出明确错误，避免静默失败。
 */

export const version = '2.0.0';

function createNodeEnvError() {
  return new Error(
    '[sEditor] 此包为浏览器端富文本编辑器，依赖 DOM，不能在 Node.js / SSR 环境直接运行。\n' +
      '请在客户端调用 create()：Next.js 用 dynamic({ ssr: false })，Nuxt 用 <ClientOnly>，' +
      '通用方案放在 useEffect / onMounted / ngAfterViewInit 中。',
  );
}

export function create() {
  throw createNodeEnvError();
}

export function createAll() {
  throw createNodeEnvError();
}

export default { version, create, createAll };
