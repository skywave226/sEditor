import type { Editor } from "@tiptap/core";
import { cn, h, onClickOutside, onEscape } from "./dom";
import { getIcon } from "./icons";
import type { UIStore } from "./store";
import type { I18n, I18nMessages } from "../editor/core/i18n";

/**
 * / 命令面板：在空段落行首输入 / 时弹出命令菜单
 *
 * 实现思路：
 * - 监听编辑器的 transaction 事件
 * - 当插入字符为 / 且位于段落开头（光标前为空）时显示菜单
 * - 按方向键 / 鼠标选择，回车/点击执行命令
 * - ESC / 输入空格 / 删除 / 时关闭
 */
interface SlashCommand {
  id: string;
  labelKey: keyof I18nMessages;
  descriptionKey: keyof I18nMessages;
  icon?: string;
  keywords: string[];
  run: (editor: Editor) => void;
}

const COMMANDS: SlashCommand[] = [
  { id: "h1", labelKey: "slash.h1.label", descriptionKey: "slash.h1.description", icon: undefined, keywords: ["h1", "标题", "heading"], run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: "h2", labelKey: "slash.h2.label", descriptionKey: "slash.h2.description", keywords: ["h2", "标题"], run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: "h3", labelKey: "slash.h3.label", descriptionKey: "slash.h3.description", keywords: ["h3", "标题"], run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: "paragraph", labelKey: "slash.paragraph.label", descriptionKey: "slash.paragraph.description", keywords: ["p", "正文", "paragraph"], run: (e) => e.chain().focus().setParagraph().run() },
  { id: "bulletList", labelKey: "slash.bulletList.label", descriptionKey: "slash.bulletList.description", keywords: ["ul", "列表", "list"], run: (e) => e.chain().focus().toggleBulletList().run() },
  { id: "orderedList", labelKey: "slash.orderedList.label", descriptionKey: "slash.orderedList.description", keywords: ["ol", "列表", "list"], run: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: "blockquote", labelKey: "slash.blockquote.label", descriptionKey: "slash.blockquote.description", keywords: ["quote", "引用"], run: (e) => e.chain().focus().toggleBlockquote().run() },
  { id: "codeBlock", labelKey: "slash.codeBlock.label", descriptionKey: "slash.codeBlock.description", keywords: ["code", "代码"], run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { id: "horizontalRule", labelKey: "slash.horizontalRule.label", descriptionKey: "slash.horizontalRule.description", keywords: ["hr", "分割线"], run: (e) => e.chain().focus().setHorizontalRule().run() },
  { id: "table", labelKey: "slash.table.label", descriptionKey: "slash.table.description", keywords: ["table", "表格"], run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
];

export class SlashMenu {
  private editor: Editor;
  private store: UIStore;
  private i18n: I18n;
  private el: HTMLElement | null = null;
  private cleanups: (() => void)[] = [];
  private filter = "";
  private selected = 0;
  private slashPos: number | null = null;

  constructor(editor: Editor, store: UIStore, i18n: I18n) {
    this.editor = editor;
    this.store = store;
    this.i18n = i18n;

    const handler = (): void => this.onTransaction();
    editor.on("transaction", handler);
    this.cleanups.push(() => editor.off("transaction", handler));
  }

  private onTransaction(): void {
    const { state } = this.editor;
    const { selection } = state;
    if (!selection.empty) {
      this.close();
      return;
    }
    const $from = selection.$from;
    // 仅在段落开头触发：光标前文本为 "/"
    const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
    if (textBefore === "/") {
      this.slashPos = $from.before($from.depth) + 1;
      this.filter = "";
      this.selected = 0;
      this.show();
    } else if (textBefore.startsWith("/") && textBefore.length > 1 && !textBefore.includes(" ")) {
      this.filter = textBefore.slice(1).toLowerCase();
      this.selected = 0;
      this.show();
    } else {
      this.close();
    }
  }

  private get filteredCommands(): SlashCommand[] {
    if (!this.filter) return COMMANDS;
    return COMMANDS.filter((c) =>
      this.i18n.t(c.labelKey).toLowerCase().includes(this.filter) ||
      c.keywords.some((k) => k.toLowerCase().includes(this.filter)),
    );
  }

  private show(): void {
    if (this.el) {
      this.render();
      this.position();
      return;
    }
    this.el = h("div", {
      className: "fixed z-[150] min-w-[260px] max-h-[320px] overflow-auto rounded-md border border-se-border bg-se-canvas shadow-panel",
    });
    document.body.appendChild(this.el);
    this.render();
    this.position();
    this.cleanups.push(onClickOutside(this.el, () => this.close()));
    this.cleanups.push(onEscape(() => this.close()));

    // 键盘导航：在编辑器上拦截 ArrowUp/Down/Enter
    const onKey = (e: KeyboardEvent): void => {
      if (!this.el) return;
      const cmds = this.filteredCommands;
      if (cmds.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.selected = (this.selected + 1) % cmds.length;
        this.render();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.selected = (this.selected - 1 + cmds.length) % cmds.length;
        this.render();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = cmds[this.selected];
        if (cmd) this.execute(cmd);
      }
    };
    this.editor.view.dom.addEventListener("keydown", onKey, true);
    this.cleanups.push(() => this.editor.view.dom.removeEventListener("keydown", onKey, true));
  }

  private render(): void {
    if (!this.el) return;
    this.el.innerHTML = "";
    const cmds = this.filteredCommands;
    if (cmds.length === 0) {
      const empty = h("div", { className: "px-3 py-2 text-[12px] text-se-faint" });
      empty.textContent = this.i18n.t("slash.empty");
      this.el.appendChild(empty);
      return;
    }
    cmds.forEach((c, idx) => {
      const item = h("div", {
        className: cn(
          "flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px]",
          idx === this.selected ? "bg-se-active text-se-primary-text" : "text-se-ink hover:bg-se-hover",
        ),
      });
      if (c.icon) {
        const ic = h("span", { className: "shrink-0" });
        ic.innerHTML = getIcon(c.icon);
        item.appendChild(ic);
      }
      const text = h("div", { className: "flex-1" });
      const label = h("div", { className: "text-[13px] font-medium" });
      label.textContent = this.i18n.t(c.labelKey);
      const desc = h("div", { className: "text-[11px] text-se-faint" });
      desc.textContent = this.i18n.t(c.descriptionKey);
      text.appendChild(label);
      text.appendChild(desc);
      item.appendChild(text);
      item.addEventListener("mouseenter", () => {
        this.selected = idx;
        this.render();
      });
      item.addEventListener("click", () => this.execute(c));
      this.el!.appendChild(item);
    });
  }

  private position(): void {
    if (!this.el) return;
    // 获取选区坐标（jsdom 或极端布局下 coordsAtPos 可能抛错，防御性兜底）
    try {
      const coords = this.editor.view.coordsAtPos(this.editor.state.selection.from);
      this.el.style.left = `${coords.left}px`;
      this.el.style.top = `${coords.bottom + 4}px`;
    } catch {
      // 坐标计算失败时菜单挂在默认位置，不影响命令执行
    }
  }

  private execute(cmd: SlashCommand): void {
    // 先删除 / 前缀（slashPos 已是段落内 / 字符前的位置，从该位置删到光标即可，
    // 切勿再 -1，否则会跨越段落 opening tag，破坏文档结构）
    if (this.slashPos != null) {
      const sel = this.editor.state.selection.from;
      this.editor.chain()
        .deleteRange({ from: this.slashPos, to: sel })
        .run();
    }
    cmd.run(this.editor);
    this.close();
  }

  close(): void {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.slashPos = null;
    this.filter = "";
    this.selected = 0;
  }

  destroy(): void {
    this.close();
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }
}
