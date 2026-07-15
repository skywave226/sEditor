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

export function buildExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: { HTMLAttributes: { class: "ue-code" } },
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: false }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    FontFamily,
    FontSize,
    LineHeight,
    Indent,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
    }),
    Image.configure({ inline: false, allowBase64: true }),
    Placeholder.configure({
      placeholder: "在此输入正文内容……",
      emptyEditorClass: "is-editor-empty",
    }),
    Table.configure({ resizable: true, lastColumnResizable: true }),
    TableRow,
    TableHeader,
    TableCell,
  ];
}
