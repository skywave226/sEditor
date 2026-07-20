export interface TemplateItem {
  name: string;
  html: string;
}

export const defaultTemplates: TemplateItem[] = [
  {
    name: "两栏文本",
    html: `<table style="width:100%;border-collapse:collapse"><tr><td style="width:50%;padding:12px;vertical-align:top"><p>左侧内容</p></td><td style="width:50%;padding:12px;vertical-align:top"><p>右侧内容</p></td></tr></table>`,
  },
  {
    name: "提示框",
    html: `<div style="padding:12px 16px;background:#dbeafe;border-left:4px solid #3b82f6;border-radius:4px"><p>提示信息</p></div>`,
  },
  {
    name: "警告框",
    html: `<div style="padding:12px 16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px"><p>警告信息</p></div>`,
  },
  {
    name: "引用块",
    html: `<blockquote><p>引用内容</p></blockquote>`,
  },
  {
    name: "代码卡片",
    html: `<pre><code class="language-javascript">// 在此处输入代码</code></pre>`,
  },
];
