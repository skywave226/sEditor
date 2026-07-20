import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import type { Extensions } from "@tiptap/core";
import { FontFamily } from "./fontFamily";
import { FontSize } from "./fontSize";
import { LineHeight } from "./lineHeight";
import { Indent } from "./indent";
import { ResizableImage } from "./resizable-image";
import { MarkdownShortcuts } from "./markdown-shortcuts";
import { Video, Audio } from "./media";
import { Subscript } from "./subscript";
import { Superscript } from "./superscript";

/**
 * 扩展 Link：增加 download 属性，用于文件下载链接。
 * 默认 Link 扩展只保留 href/target/rel/title，会丢弃 download。
 */
const DownloadableLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      download: {
        default: null,
        parseHTML: (el) => {
          const v = (el as HTMLAnchorElement).getAttribute("download");
          return v === null ? null : v || "";
        },
        renderHTML: (attrs) => {
          // null 表示无 download 属性；空字符串与任意非空字符串都渲染为 download 属性
          if (attrs.download === null || attrs.download === undefined) return {};
          return { download: attrs.download };
        },
      },
    };
  },
});

export function buildExtensions(placeholder?: string): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: { HTMLAttributes: { class: "se-code" } },
    }),
    TextStyle,
    Color,
    // multicolor: true 才能让 setHighlight({ color }) 真正存储颜色，
    // 否则工具栏的「背景色」下拉只会切换默认黄色高亮。
    Highlight.configure({ multicolor: true }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    FontFamily,
    FontSize,
    LineHeight,
    Indent,
    DownloadableLink.configure({
      openOnClick: false,
      autolink: true,
      // 协议白名单：拦截 javascript:、data: 等危险协议，避免存储型 XSS
      validate: (url) => /^(https?:|mailto:|tel:|\/|#)/i.test(url),
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
    }),
    // inline: true 使图片作为内联节点存在于段落中，
    // 这样 setTextAlign(left/center/right) 才能通过段落对齐作用于图片。
    // ResizableImage 自定义 NodeView 在图片右下角加拖拽手柄，可调整宽度。
    ResizableImage.configure({ inline: true, allowBase64: true }),
    Placeholder.configure({
      placeholder: placeholder ?? "在此输入正文内容……",
      emptyEditorClass: "is-editor-empty",
    }),
    Table.configure({ resizable: true, lastColumnResizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    // 内联 Markdown 快捷输入：**bold**/*italic*/~~strike~~/`code`
    // 块级 Markdown（# / - / > / --- / ```）由 StarterKit 提供
    MarkdownShortcuts,
    // 下标 / 上标
    Subscript,
    Superscript,
    // 视频 / 音频节点（<video controls> / <audio controls>），atom 不可编辑
    Video,
    Audio,
  ];
}
