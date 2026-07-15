import { useState } from "react";
import RichEditor from "@/editor/Editor";
import type { EditorConfig } from "@/editor/types";

const DEMO_CONTENT = `
<h2>欢迎使用 UEditor 风格富文本编辑器</h2>
<p>这是一款基于 <strong>TypeScript</strong> + <em>TipTap</em> 构建的所见即所得编辑器，界面与功能仿照百度 UEditor。</p>
<p>支持的功能包括：</p>
<ul>
  <li>文字样式：<strong>加粗</strong>、<em>斜体</em>、<u>下划线</u>、<s>删除线</s>、<span style="color:#c7254e">彩色文字</span></li>
  <li>字体、字号、行距、对齐、缩进</li>
  <li>有序与无序列表、引用、代码块</li>
  <li>插入超链接、图片、表格、分割线、特殊字符</li>
  <li>源码模式与全屏模式</li>
</ul>
<blockquote>提示：选中文本后点击工具栏按钮即可应用格式，右键可呼出上下文菜单。</blockquote>
<pre><code>const editor = createEditor({ placeholder: '开始写作...' });</code></pre>
`;

export default function App() {
  const [html, setHtml] = useState("");

  const config: EditorConfig = {
    initialContent: DEMO_CONTENT,
    placeholder: "在此输入正文内容……",
    height: 360,
    onChange: (value) => setHtml(value),
  };

  return (
    <div className="min-h-screen bg-ue-page py-8">
      <div className="mx-auto max-w-4xl px-4">
        <header className="mb-5">
          <h1 className="text-[22px] font-semibold text-ue-ink">UEditor 风格富文本编辑器</h1>
          <p className="mt-1 text-[13px] text-ue-sub">
            TypeScript + React + TipTap · 经典工具栏 · 所见即所得
          </p>
        </header>

        <RichEditor config={config} />

        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-medium text-ue-ink">输出 HTML</span>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(html)}
              className="rounded border border-ue-border bg-white px-2.5 py-1 text-[12px] text-ue-sub hover:bg-ue-hover"
            >
              复制
            </button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-lg border border-ue-border bg-[#1e1e1e] p-3 text-[12px] leading-relaxed text-[#e6e6e6]">
            {html || "（编辑后将在此显示 HTML）"}
          </pre>
        </section>
      </div>
    </div>
  );
}
