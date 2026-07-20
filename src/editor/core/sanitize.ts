/**
 * 安全工具：XML 转义、HTML 消毒、URL 安全校验。
 *
 * 原则：不引入第三方依赖，使用浏览器内置 API 实现轻量消毒。
 */

const DANGEROUS_HREF_PROTOCOLS = /^(javascript|data|vbscript|file):/i;
const DANGEROUS_SRC_PROTOCOLS = /^(javascript|vbscript|file):/i;

/** 判断 URL 是否属于危险协议（href 场景禁止 data:，src 场景允许 data: 用于 base64 图片） */
export function isDangerousUrl(url: string, context: "href" | "src" = "href"): boolean {
  const protocols = context === "src" ? DANGEROUS_SRC_PROTOCOLS : DANGEROUS_HREF_PROTOCOLS;
  return protocols.test(url.trim());
}

/** 将普通文本中的 XML/HTML 特殊字符转义，用于 SVG/属性拼接 */
export function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface SanitizeOptions {
  /** 是否允许 <img> 标签 */
  allowImages?: boolean;
  /** 是否允许 <a> 标签 */
  allowLinks?: boolean;
  /** 是否允许 <video> / <audio> 标签 */
  allowMedia?: boolean;
  /** 是否允许 <iframe> 标签 */
  allowIframes?: boolean;
  /** 额外允许的属性白名单（标签名 -> 属性名数组） */
  attrWhitelist?: Record<string, string[]>;
}

const DEFAULT_ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "del", "s", "strike", "code", "pre",
  "blockquote", "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "th", "td",
  "div", "span", "section", "article",
  "sub", "sup",
]);

const DEFAULT_ALLOWED_ATTRS = new Set([
  "class", "style", "id", "dir", "align",
  "colspan", "rowspan",
]);

const TAG_ALIASES: Record<string, keyof HTMLElementTagNameMap> = {
  strike: "s",
};

function renameTag(tag: string): string {
  return TAG_ALIASES[tag] ?? tag;
}

function sanitizeNode(node: Node, opts: SanitizeOptions): Node | null {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE) {
    return node.cloneNode(true);
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const safeTag = renameTag(tag);

  // 标签白名单
  const allowedTags = new Set(DEFAULT_ALLOWED_TAGS);
  if (opts.allowImages) allowedTags.add("img");
  if (opts.allowLinks) allowedTags.add("a");
  if (opts.allowMedia) {
    allowedTags.add("video");
    allowedTags.add("audio");
    allowedTags.add("source");
  }
  if (opts.allowIframes) allowedTags.add("iframe");

  if (!allowedTags.has(safeTag)) {
    // 对于未知标签，保留其文本内容
    const frag = document.createDocumentFragment();
    el.childNodes.forEach((child) => {
      const n = sanitizeNode(child, opts);
      if (n) frag.appendChild(n);
    });
    return frag;
  }

  const safe = document.createElement(safeTag);

  // 属性白名单
  const attrWhitelist = opts.attrWhitelist?.[safeTag] ?? [];
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (!DEFAULT_ALLOWED_ATTRS.has(name) && !attrWhitelist.includes(name)) {
      continue;
    }

    // 链接类属性校验协议
    if ((name === "href" || name === "src") && isDangerousUrl(value, name === "src" ? "src" : "href")) {
      continue;
    }

    // style 中禁止 expression、javascript 协议
    if (name === "style" && /(expression|javascript:|vbscript:)/i.test(value)) {
      continue;
    }

    safe.setAttribute(name, value);
  }

  // 递归处理子节点
  el.childNodes.forEach((child) => {
    const n = sanitizeNode(child, opts);
    if (n) safe.appendChild(n);
  });

  return safe;
}

/**
 * 轻量 HTML 消毒。
 * 解析 HTML 后递归遍历节点，移除不在白名单的标签、危险属性、事件处理器和危险 URL。
 */
export function sanitizeHtml(html: string, opts: SanitizeOptions = {}): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;
  if (!root) return "";

  const frag = document.createDocumentFragment();
  root.childNodes.forEach((child) => {
    const n = sanitizeNode(child, opts);
    if (n) frag.appendChild(n);
  });

  const wrapper = document.createElement("div");
  wrapper.appendChild(frag);
  return wrapper.innerHTML;
}

/**
 * 简化版消毒：用于导出/打印/预览场景，允许图片、链接、媒体、iframe。
 */
export function sanitizeForExport(html: string): string {
  return sanitizeHtml(html, {
    allowImages: true,
    allowLinks: true,
    allowMedia: true,
    allowIframes: true,
  });
}
