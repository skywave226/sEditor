/**
 * 导出工具：
 * - Markdown：HTML → Markdown（轻量内置转换，无第三方依赖）
 * - Word：生成 .doc 兼容的 HTML 包，application/msword MIME
 * - PDF：打开打印窗口，调用浏览器「打印为 PDF」
 *
 * 所有导出都通过 Blob + 临时 <a> 触发下载，或新窗口打印。
 */

import { sanitizeForExport } from "../editor/core/sanitize";

/** 下载文本为文件 */
function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 极简 HTML → Markdown 转换器
 * 覆盖：h1-h6 / p / strong / em / del / code / pre / ul / ol / li / blockquote / hr / a / img / table
 * 不追求 100% 还原，目标是用纯文本规则覆盖 90% 常见正文场景。
 */
export function htmlToMarkdown(html: string): string {
  // 用 DOMParser 解析，避免正则栈溢出
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild as HTMLElement;
  if (!root) return "";
  return nodeToMarkdown(root).trim() + "\n";
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\s+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inner = (): string => Array.from(el.childNodes).map(nodeToMarkdown).join("");

  switch (tag) {
    case "h1": return `\n# ${inner()}\n\n`;
    case "h2": return `\n## ${inner()}\n\n`;
    case "h3": return `\n### ${inner()}\n\n`;
    case "h4": return `\n#### ${inner()}\n\n`;
    case "h5": return `\n##### ${inner()}\n\n`;
    case "h6": return `\n###### ${inner()}\n\n`;
    case "p": return `${inner()}\n\n`;
    case "br": return "\n";
    case "strong":
    case "b": return `**${inner()}**`;
    case "em":
    case "i": return `*${inner()}*`;
    case "del":
    case "s":
    case "strike": return `~~${inner()}~~`;
    case "code": return `\`${inner()}\``;
    case "pre": {
      const code = el.textContent ?? "";
      return `\n\`\`\`\n${code}\n\`\`\`\n\n`;
    }
    case "blockquote": {
      const text = inner().trim();
      return text.split("\n").map((l) => `> ${l}`).join("\n") + "\n\n";
    }
    case "hr": return `\n---\n\n`;
    case "a": {
      const href = el.getAttribute("href") ?? "";
      return `[${inner()}](${href})`;
    }
    case "img": {
      const alt = el.getAttribute("alt") ?? "";
      const src = el.getAttribute("src") ?? "";
      return `![${alt}](${src})`;
    }
    case "ul": {
      return Array.from(el.children)
        .map((li) => `- ${nodeToMarkdown(li).trim()}`)
        .join("\n") + "\n\n";
    }
    case "ol": {
      return Array.from(el.children)
        .map((li, i) => `${i + 1}. ${nodeToMarkdown(li).trim()}`)
        .join("\n") + "\n\n";
    }
    case "li": return inner();
    case "table": {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (rows.length === 0) return "";
      const lines: string[] = [];
      const headerCells = Array.from(rows[0].querySelectorAll("th,td")).map((c) => nodeToMarkdown(c).trim());
      lines.push(`| ${headerCells.join(" | ")} |`);
      lines.push(`| ${headerCells.map(() => "---").join(" | ")} |`);
      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll("th,td")).map((c) => nodeToMarkdown(c).trim());
        lines.push(`| ${cells.join(" | ")} |`);
      }
      return `\n${lines.join("\n")}\n\n`;
    }
    case "video": {
      const src = el.getAttribute("src") ?? "";
      return `\n<video src="${src}"></video>\n\n`;
    }
    case "audio": {
      const src = el.getAttribute("src") ?? "";
      return `\n<audio src="${src}"></audio>\n\n`;
    }
    case "div":
    case "section":
    case "article":
    case "span": return inner();
    default: return inner();
  }
}

/**
 * 导出为 Markdown 文件
 */
export function exportMarkdown(html: string, filename = "seditor-export.md"): void {
  const md = htmlToMarkdown(html);
  downloadBlob(filename, md, "text/markdown;charset=utf-8");
}

/**
 * 极简 Markdown → HTML 转换器（与 htmlToMarkdown 对应）
 * 覆盖：h1-h6 / p / strong / em / del / code / pre / ul / ol / li /
 *       blockquote / hr / a / img / table
 * 不追求 100% 还原，目标是用纯文本规则覆盖 90% 常见正文场景。
 */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  const parseInline = (text: string): string => {
    // 图片 ![alt](src)
    let html = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    // 链接 [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // 行内代码 `code`
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    // 粗体 **text** / __text__
    html = html.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, "<strong>$1$2</strong>");
    // 斜体 *text* / _text_
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g, "<em>$1$2</em>");
    // 删除线 ~~text~~
    html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    return html;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行
    if (trimmed === "") {
      i++;
      continue;
    }

    // 代码块
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      const code = escapeHtml(codeLines.join("\n"));
      out.push(`<pre><code${lang ? ` class="language-${lang}"` : ""}>${code}</code></pre>`);
      continue;
    }

    // 标题
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      out.push(`<h${level}>${parseInline(escapeHtml(headingMatch[2]))}</h${level}>`);
      i++;
      continue;
    }

    // 水平线
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // 引用
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().slice(1).trimStart());
        i++;
      }
      const inner = parseBlock(quoteLines.join("\n"));
      out.push(`<blockquote>${inner}</blockquote>`);
      continue;
    }

    // 无序列表
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^[-*+]\s+/, "");
        items.push(`<li>${parseInline(escapeHtml(content))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // 有序列表
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const content = lines[i].trim().replace(/^\d+\.\s+/, "");
        items.push(`<li>${parseInline(escapeHtml(content))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // 表格
    if (trimmed.includes("|") && i + 1 < lines.length && /^\|?[\s\-:|]+\|?$/.test(lines[i + 1].trim())) {
      const headerLine = trimmed;
      i += 2; // 跳过表头分隔行
      const headerCells = headerLine.split("|").map((s) => s.trim()).filter((s) => s !== "");
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes("|")) {
        bodyRows.push(lines[i].split("|").map((s) => s.trim()).filter((s) => s !== ""));
        i++;
      }
      const ths = headerCells.map((c) => `<th>${parseInline(escapeHtml(c))}</th>`).join("");
      const tds = bodyRows.map((row) => `<tr>${row.map((c) => `<td>${parseInline(escapeHtml(c))}</td>`).join("")}</tr>`).join("");
      out.push(`<table><thead><tr>${ths}</tr></thead><tbody>${tds}</tbody></table>`);
      continue;
    }

    // 段落
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      paraLines.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${parseInline(escapeHtml(paraLines.join(" ")))}</p>`);
  }

  return out.join("");
}

function parseBlock(md: string): string {
  return markdownToHtml(md);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 导出为 Word（.doc）文件
 * Word 可打开带 Microsoft Office 命名空间的 HTML，存为 .doc 即可。
 */
export function exportWord(html: string, filename = "seditor-export.doc"): void {
  const safe = sanitizeForExport(html);
  const wrapped = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>sEditor Export</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: "SimSun", serif; font-size: 12pt; line-height: 1.75; }
    h1,h2,h3,h4,h5,h6 { font-family: "SimHei", sans-serif; }
    pre { font-family: Consolas, monospace; background: #f5f5f5; padding: 8px; }
    code { font-family: Consolas, monospace; }
    table { border-collapse: collapse; }
    td, th { border: 1px solid #888; padding: 4px 8px; }
  </style>
</head>
<body>${safe}</body>
</html>`;
  downloadBlob(filename, wrapped, "application/msword");
}

/**
 * 导出为 PDF（通过浏览器打印对话框，用户选择「另存为 PDF」）
 */
export function exportPDF(html: string, filename = "seditor-export"): void {
  const safe = sanitizeForExport(html);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("[sEditor] 弹出打印窗口被浏览器拦截，请允许弹窗后重试。");
    return;
  }
  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <style>
    body { font-family: "SimSun", serif; font-size: 14px; line-height: 1.75; color: #303133; padding: 32px; }
    h1,h2,h3,h4,h5,h6 { font-family: "SimHei", sans-serif; }
    pre { font-family: Consolas, monospace; background: #f5f5f5; padding: 8px; border-radius: 4px; }
    code { font-family: Consolas, monospace; background: #f0f2f5; padding: 1px 4px; border-radius: 2px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #888; padding: 6px 10px; }
    img { max-width: 100%; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${safe}</body>
</html>`);
  win.document.close();
  // 等待内容渲染后调用打印
  win.focus();
  setTimeout(() => {
    try { win.print(); } catch { /* ignore */ }
  }, 300);
}
