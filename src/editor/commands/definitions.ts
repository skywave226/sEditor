import type { Editor } from "@tiptap/core";
import type { EditorCommand, ImageOptions } from "../types";
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
    if (level >= 1 && level <= 6) e.chain().focus().toggleHeading({ level: level as 1 }).run();
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
    e.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href, target: target ?? "_blank", rel: "noopener noreferrer nofollow" })
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
  cmd("specialChar", () => false, () => true, (e, p) => {
    e.chain().focus().insertContent(String(p ?? "")).run();
  }),
];

let registered = false;
/** 注册所有命令（幂等） */
export function ensureCommandsRegistered(): void {
  if (registered) return;
  commandRegistry.registerAll(commandDefinitions);
  registered = true;
}

export { commandRegistry };
