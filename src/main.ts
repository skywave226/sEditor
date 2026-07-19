/**
 * 开发模式 demo 入口（vite dev）
 * 实际生产用法见 README.md / USAGE.md，通过 dist/sEditor.js 引入。
 */
import { create } from "./browser-entry";

const root = document.getElementById("root");
if (root) {
  const host = document.createElement("div");
  root.appendChild(host);

  const editor = create({
    target: host,
    initialContent: "<p>欢迎使用 <strong>sEditor</strong> —— 老石富文本编辑器。</p>",
    placeholder: "开始写作……",
    height: 480,
    onChange: (html) => {
      console.log("[demo] onChange:", html.slice(0, 80));
    },
  });

  // 暴露到 window 方便调试
  (window as unknown as { sEditorDemo: typeof editor }).sEditorDemo = editor;
}
