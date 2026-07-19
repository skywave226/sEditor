import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
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
    Link.configure({
      openOnClick: false,
      autolink: true,
      // 协议白名单：拦截 javascript:、data: 等危险协议，避免存储型 XSS
      validate: (url) => /^(https?:|mailto:|tel:|\/|#)/i.test(url),
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
    }),
    // inline: true 使图片作为内联节点存在于段落中，
    // 这样 setTextAlign(left/center/right) 才能通过段落对齐作用于图片。
    Image.configure({ inline: true, allowBase64: true }),
    Placeholder.configure({
      placeholder: placeholder ?? "在此输入正文内容……",
      emptyEditorClass: "is-editor-empty",
    }),
    Table.configure({ resizable: true, lastColumnResizable: true }),
    TableRow,
    TableHeader,
    TableCell,
  ];
}
