import { describe, it, expect } from "vitest";
import { htmlToMarkdown, markdownToHtml } from "./exporter";

describe("exporter", () => {
  describe("htmlToMarkdown", () => {
    it("应转换标题、段落、加粗与斜体", () => {
      const md = htmlToMarkdown(`<h1>标题</h1><p>这是 <strong>加粗</strong> 和 <em>斜体</em> 文本</p>`);
      expect(md).toContain("# 标题");
      expect(md).toContain("**加粗**");
      expect(md).toContain("*斜体*");
    });

    it("应转换无序列表", () => {
      const md = htmlToMarkdown(`<ul><li>第一项</li><li>第二项</li></ul>`);
      expect(md).toContain("- 第一项");
      expect(md).toContain("- 第二项");
    });

    it("应转换有序列表", () => {
      const md = htmlToMarkdown(`<ol><li>第一步</li><li>第二步</li></ol>`);
      expect(md).toContain("1. 第一步");
      expect(md).toContain("2. 第二步");
    });

    it("应转换链接与图片", () => {
      const md = htmlToMarkdown(`<p><a href="https://example.com">链接</a></p><img src="https://example.com/a.png" alt="示例">`);
      expect(md).toContain("[链接](https://example.com)");
      expect(md).toContain("![示例](https://example.com/a.png)");
    });

    it("应转换代码块与引用", () => {
      const md = htmlToMarkdown(`<blockquote><p>引用内容</p></blockquote><pre>console.log(1)</pre>`);
      expect(md).toContain("> 引用内容");
      expect(md).toContain("```");
      expect(md).toContain("console.log(1)");
    });
  });

  describe("markdownToHtml", () => {
    it("应解析标题与段落", () => {
      const html = markdownToHtml(`# 标题\n\n正文段落`);
      expect(html).toContain("<h1>标题</h1>");
      expect(html).toContain("<p>正文段落</p>");
    });

    it("应解析加粗、斜体与删除线", () => {
      const html = markdownToHtml(`**粗体** *斜体* ~~删除线~~`);
      expect(html).toContain("<strong>粗体</strong>");
      expect(html).toContain("<em>斜体</em>");
      expect(html).toContain("<del>删除线</del>");
    });

    it("应解析无序列表与有序列表", () => {
      const html = markdownToHtml(`- a\n- b\n\n1. x\n2. y`);
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>a</li>");
      expect(html).toContain("<ol>");
      expect(html).toContain("<li>x</li>");
    });

    it("应解析链接、图片与代码", () => {
      const html = markdownToHtml(`[链接](https://example.com)\n\n![alt](https://example.com/a.png)\n\n\`code\``);
      expect(html).toContain('<a href="https://example.com">链接</a>');
      expect(html).toContain('<img src="https://example.com/a.png" alt="alt">');
      expect(html).toContain("<code>code</code>");
    });

    it("应解析代码块", () => {
      const html = markdownToHtml("```js\nconst a = 1;\n```");
      expect(html).toContain("<pre><code class=\"language-js\">");
      expect(html).toContain("const a = 1;");
    });

    it("应解析引用块", () => {
      const html = markdownToHtml("> 引用\n> 多行");
      expect(html).toContain("<blockquote>");
      expect(html).toContain("<p>引用 多行</p>");
    });

    it("应解析水平线", () => {
      const html = markdownToHtml("---");
      expect(html).toContain("<hr>");
    });

    it("导入导出应可逆（常见元素）", () => {
      const original = `<h1>标题</h1><p><strong>粗</strong> <em>斜</em> <a href="https://x.com">链</a></p><ul><li>a</li><li>b</li></ul>`;
      const html = markdownToHtml(htmlToMarkdown(original));
      expect(html).toContain("<h1>标题</h1>");
      expect(html).toContain("<strong>粗</strong>");
      expect(html).toContain("<em>斜</em>");
      expect(html).toContain('<a href="https://x.com">链</a>');
      expect(html).toContain("<li>a</li>");
    });
  });
});
