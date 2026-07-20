import type { Editor } from "@tiptap/core";
import type { EditorCommand, ImageOptions, FileInsertOptions, MediaOptions } from "../types";
import { commandRegistry } from "./registry";

const safe =
  (fn: (editor: Editor) => boolean) =>
  (editor: Editor): boolean => {
    try {
      return fn(editor);
    } catch {
      return false;
    }
  };

const run =
  (fn: (editor: Editor, payload?: unknown) => void) =>
  (editor: Editor, payload?: unknown): void => {
    fn(editor, payload);
    editor.chain().focus().run();
  };

const cmd = (
  name: string,
  isActive: (e: Editor) => boolean,
  can: (e: Editor) => boolean,
  exec: (e: Editor, p?: unknown) => void,
): EditorCommand => ({
  name,
  isActive: safe(isActive),
  can: safe(can),
  run: run(exec),
});

/** 全部命令定义 */
export const commandDefinitions: EditorCommand[] = [
  // —— 历史 ——
  cmd("undo", () => false, (e) => e.can().undo(), (e) => e.chain().focus().undo().run()),
  cmd("redo", () => false, (e) => e.can().redo(), (e) => e.chain().focus().redo().run()),

  // —— 剪贴板（基于 navigator.clipboard API）——
  cmd("copy", () => false, (e) => !e.state.selection.empty, (e) => {
    const { from, to } = e.state.selection;
    const text = e.state.doc.textBetween(from, to, "\n");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopyToClipboard(text);
      });
    } else {
      fallbackCopyToClipboard(text);
    }
  }),
  cmd("cut", () => false, (e) => !e.state.selection.empty, (e) => {
    const { from, to } = e.state.selection;
    const text = e.state.doc.textBetween(from, to, "\n");
    const doCut = () => e.chain().focus().deleteSelection().run();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(doCut).catch(() => {
        fallbackCopyToClipboard(text);
        doCut();
      });
    } else {
      fallbackCopyToClipboard(text);
      doCut();
    }
  }),
  cmd("paste", () => false, () => true, (e) => {
    const doInsert = (text: string) => {
      if (text) e.chain().focus().insertContent(text).run();
    };
    if (navigator.clipboard?.readText) {
      navigator.clipboard.readText().then(doInsert).catch(() => {
        // 读取失败（如权限被拒）：提示用户使用 Ctrl+V
        // 此处不抛错，避免影响 UI
      });
    }
  }),
  // 粘贴为纯文本：仅插入剪贴板的 text/plain，丢弃所有格式（HTML/样式）
  cmd("pastePlainText", () => false, () => true, (e) => {
    const doInsert = (text: string) => {
      if (text) e.chain().focus().insertContent(text).run();
    };
    if (navigator.clipboard?.readText) {
      navigator.clipboard.readText().then(doInsert).catch(() => {
        // 权限被拒时静默失败
      });
    }
  }),

  // —— 文字样式 ——
  cmd("bold", (e) => e.isActive("bold"), (e) => e.can().toggleBold(), (e) => e.chain().focus().toggleBold().run()),
  cmd("italic", (e) => e.isActive("italic"), (e) => e.can().toggleItalic(), (e) => e.chain().focus().toggleItalic().run()),
  cmd("underline", (e) => e.isActive("underline"), (e) => e.can().toggleUnderline(), (e) => e.chain().focus().toggleUnderline().run()),
  cmd("strike", (e) => e.isActive("strike"), (e) => e.can().toggleStrike(), (e) => e.chain().focus().toggleStrike().run()),
  cmd("removeFormat", () => false, (e) => e.can().unsetAllMarks(), (e) => e.chain().focus().unsetAllMarks().clearNodes().run()),

  // —— 颜色 ——
  cmd("color", () => false, () => true, (e, p) => e.chain().focus().setColor(String(p ?? "")).run()),
  cmd("highlight", () => false, () => true, (e, p) => {
    const chain = e.chain().focus();
    if (p) chain.setHighlight({ color: String(p) }).run();
    else chain.toggleHighlight().run();
  }),

  // —— 字体 / 字号 ——
  cmd("fontFamily", () => false, () => true, (e, p) => {
    const v = String(p ?? "");
    if (v) e.chain().focus().setFontFamily(v).run();
    else e.chain().focus().unsetFontFamily().run();
  }),
  cmd("fontSize", () => false, () => true, (e, p) => {
    const v = String(p ?? "");
    if (v) e.chain().focus().setFontSize(v).run();
    else e.chain().focus().unsetFontSize().run();
  }),

  // —— 段落对齐 ——
  cmd("alignLeft", (e) => e.isActive({ textAlign: "left" }), (e) => e.can().setTextAlign("left"), (e) => e.chain().focus().setTextAlign("left").run()),
  cmd("alignCenter", (e) => e.isActive({ textAlign: "center" }), (e) => e.can().setTextAlign("center"), (e) => e.chain().focus().setTextAlign("center").run()),
  cmd("alignRight", (e) => e.isActive({ textAlign: "right" }), (e) => e.can().setTextAlign("right"), (e) => e.chain().focus().setTextAlign("right").run()),
  cmd("alignJustify", (e) => e.isActive({ textAlign: "justify" }), (e) => e.can().setTextAlign("justify"), (e) => e.chain().focus().setTextAlign("justify").run()),

  // —— 列表 ——
  cmd("bulletList", (e) => e.isActive("bulletList"), (e) => e.can().toggleBulletList(), (e) => e.chain().focus().toggleBulletList().run()),
  cmd("orderedList", (e) => e.isActive("orderedList"), (e) => e.can().toggleOrderedList(), (e) => e.chain().focus().toggleOrderedList().run()),

  // —— 缩进 ——
  cmd("indent", () => false, (e) => e.can().indent(), (e) => e.chain().focus().indent().run()),
  cmd("outdent", () => false, (e) => e.can().outdent(), (e) => e.chain().focus().outdent().run()),

  // —— 行距 ——
  cmd("lineHeight", () => false, () => true, (e, p) => {
    const v = String(p ?? "");
    if (v) e.chain().focus().setLineHeight(v).run();
    else e.chain().focus().unsetLineHeight().run();
  }),

  // —— 段落格式 ——
  cmd("paragraph", (e) => e.isActive("paragraph"), (e) => e.can().setParagraph(), (e) => e.chain().focus().setParagraph().run()),
  cmd("heading", () => false, (e) => e.can().toggleHeading({ level: 1 }), (e, p) => {
    const level = Number(p);
    if (level >= 1 && level <= 6) e.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  }),
  cmd("blockquote", (e) => e.isActive("blockquote"), (e) => e.can().toggleBlockquote(), (e) => e.chain().focus().toggleBlockquote().run()),
  cmd("codeBlock", (e) => e.isActive("codeBlock"), (e) => e.can().toggleCodeBlock(), (e) => e.chain().focus().toggleCodeBlock().run()),

  // —— 插入 ——
  cmd("horizontalRule", () => false, (e) => e.can().setHorizontalRule(), (e) => e.chain().focus().setHorizontalRule().run()),
  cmd("link", (e) => e.isActive("link"), () => true, (e, p) => {
    const { href, target } = (p ?? {}) as { href: string; target?: string };
    if (!href) {
      e.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    // rel 由 Link 扩展的 HTMLAttributes 统一配置，此处不再重复传
    e.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href, target: target ?? "_blank" })
      .run();
  }),
  cmd("image", () => false, () => true, (e, p) => {
    const { src, width, alt } = (p ?? {}) as ImageOptions & { src: string };
    if (!src) return;
    const attrs: Record<string, unknown> = { src };
    if (width) attrs.width = width;
    if (alt) attrs.alt = alt;
    e.chain().focus().setImage(attrs as { src: string; alt?: string }).run();
  }),
  cmd("table", () => false, () => true, (e, p) => {
    const { rows, cols, withHeader } = (p ?? {}) as { rows: number; cols: number; withHeader?: boolean };
    e.chain().focus().insertTable({ rows, cols, withHeaderRow: withHeader !== false }).run();
  }),
  cmd("file", () => false, () => true, (e, p) => {
    const { src, name, download } = (p ?? {}) as FileInsertOptions & { src: string };
    if (!src) return;
    const text = name || src.split("/").pop() || "文件";
    // 通过 insertContent 插入文本节点并应用 link mark（含 download 属性）
    // DownloadableLink 扩展已支持 download 属性的存储与渲染
    e.chain()
      .focus()
      .insertContent({
        type: "text",
        text,
        marks: [
          {
            type: "link",
            attrs: {
              href: src,
              target: "_blank",
              download: download === false ? null : "",
            },
          },
        ],
      })
      .insertContent({ type: "text", text: " " })
      .run();
  }),
  cmd("specialChar", () => false, () => true, (e, p) => {
    e.chain().focus().insertContent(String(p ?? "")).run();
  }),
  // 插入视频：<video controls>
  cmd("video", () => false, () => true, (e, p) => {
    const { src, width, controls } = (p ?? {}) as MediaOptions & { src: string };
    if (!src) return;
    const attrs: Record<string, unknown> = { src, controls: controls !== false };
    if (width != null) attrs.width = width;
    e.chain().focus().insertContent({ type: "video", attrs }).run();
  }),
  // 插入音频：<audio controls>
  cmd("audio", () => false, () => true, (e, p) => {
    const { src, controls } = (p ?? {}) as MediaOptions & { src: string };
    if (!src) return;
    e.chain().focus().insertContent({ type: "audio", attrs: { src, controls: controls !== false } }).run();
  }),

  // —— 下标 / 上标 ——
  cmd("subscript", (e) => e.isActive("subscript"), (e) => e.can().toggleSubscript(), (e) => e.chain().focus().toggleSubscript().run()),
  cmd("superscript", (e) => e.isActive("superscript"), (e) => e.can().toggleSuperscript(), (e) => e.chain().focus().toggleSuperscript().run()),

  // —— 链接 / 图片辅助 ——
  cmd("unlink", () => false, (e) => e.isActive("link"), (e) => e.chain().focus().extendMarkRange("link").unsetLink().run()),
  cmd("imageAlignNone", (e) => e.isActive("image", { align: "none" }), (e) => e.isActive("image"), (e) => e.chain().focus().setImageAlign("none").run()),
  cmd("imageAlignLeft", (e) => e.isActive("image", { align: "left" }), (e) => e.isActive("image"), (e) => e.chain().focus().setImageAlign("left").run()),
  cmd("imageAlignCenter", (e) => e.isActive("image", { align: "center" }), (e) => e.isActive("image"), (e) => e.chain().focus().setImageAlign("center").run()),
  cmd("imageAlignRight", (e) => e.isActive("image", { align: "right" }), (e) => e.isActive("image"), (e) => e.chain().focus().setImageAlign("right").run()),

  // —— 选区 / 文档 ——
  cmd("selectAll", () => false, (e) => e.can().selectAll(), (e) => e.chain().focus().selectAll().run()),
  cmd("clearDocument", () => false, () => true, (e) => e.chain().focus().clearContent().run()),

  // —— 代码块语言 ——
  cmd("codeBlockLang", (e) => e.isActive("codeBlock"), (e) => e.isActive("codeBlock"), (e, p) => {
    const lang = String(p ?? "");
    e.chain().focus().updateAttributes("codeBlock", { language: lang || null }).run();
  }),

  // —— 时间 / 日期 ——
  cmd("insertTime", () => false, () => true, (e) => {
    const now = new Date();
    const text = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    e.chain().focus().insertContent(text).run();
  }),
  cmd("insertDate", () => false, () => true, (e) => {
    const now = new Date();
    const text = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    e.chain().focus().insertContent(text).run();
  }),

  // —— 打印 / 预览 ——
  cmd("print", () => false, () => true, (e) => {
    const html = e.getHTML();
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>打印</title><style>body{font-family:system-ui,sans-serif;padding:24px;max-width:800px;margin:0 auto;}</style></head><body>${html}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }),
  cmd("preview", () => false, () => true, (e) => {
    const html = e.getHTML();
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>预览</title><style>body{font-family:system-ui,sans-serif;padding:24px;max-width:800px;margin:0 auto;background:#f5f6f7;} .se-preview-content{background:#fff;padding:32px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.1);}</style></head><body><div class="se-preview-content">${html}</div></body></html>`);
    win.document.close();
  }),

  // —— 表格高级操作 ——
  cmd("deleteTable", () => false, (e) => e.can().deleteTable(), (e) => e.chain().focus().deleteTable().run()),
  cmd("addColumnBefore", () => false, (e) => e.can().addColumnBefore(), (e) => e.chain().focus().addColumnBefore().run()),
  cmd("addColumnAfter", () => false, (e) => e.can().addColumnAfter(), (e) => e.chain().focus().addColumnAfter().run()),
  cmd("deleteColumn", () => false, (e) => e.can().deleteColumn(), (e) => e.chain().focus().deleteColumn().run()),
  cmd("addRowBefore", () => false, (e) => e.can().addRowBefore(), (e) => e.chain().focus().addRowBefore().run()),
  cmd("addRowAfter", () => false, (e) => e.can().addRowAfter(), (e) => e.chain().focus().addRowAfter().run()),
  cmd("deleteRow", () => false, (e) => e.can().deleteRow(), (e) => e.chain().focus().deleteRow().run()),
  cmd("mergeCells", () => false, (e) => e.can().mergeCells(), (e) => e.chain().focus().mergeCells().run()),
  cmd("splitCell", () => false, (e) => e.can().splitCell(), (e) => e.chain().focus().splitCell().run()),
  cmd("toggleHeaderRow", () => false, (e) => e.can().toggleHeaderRow(), (e) => e.chain().focus().toggleHeaderRow().run()),
  cmd("toggleHeaderColumn", () => false, (e) => e.can().toggleHeaderColumn(), (e) => e.chain().focus().toggleHeaderColumn().run()),
];

/** 兼容性兜底：创建临时 textarea 选中文本后执行 document.execCommand('copy') */
function fallbackCopyToClipboard(text: string): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    // ignore
  }
  ta.remove();
}

let registered = false;

/** 注册所有命令（幂等） */
export function ensureCommandsRegistered(): void {
  if (registered) return;
  commandRegistry.registerAll(commandDefinitions);
  registered = true;
}

export { commandRegistry };
