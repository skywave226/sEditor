import type { Editor } from "@tiptap/core";
import { h, onClickOutside, onEscape } from "./dom";
import type { UIStore } from "./store";
import type { I18n } from "../editor/core/i18n";

/** 兼容性兜底：通过临时 textarea 选中文本后执行 copy */
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
    /* ignore */
  }
  ta.remove();
}

export class ContextMenu {
  private editor: Editor;
  private store: UIStore;
  private i18n: I18n;
  private el: HTMLElement | null = null;
  private cleanup: (() => void)[] = [];

  constructor(editor: Editor, store: UIStore, i18n: I18n) {
    this.editor = editor;
    this.store = store;
    this.i18n = i18n;
  }

  private buildItem(label: string, onClick: () => void): HTMLElement {
    const btn = h("button", {
      type: "button",
      className: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-se-ink hover:bg-se-hover",
    });
    const span = h("span", { className: "flex-1 truncate" });
    span.textContent = label;
    btn.appendChild(span);
    btn.addEventListener("click", () => {
      onClick();
      this.close();
    });
    return btn;
  }

  private buildDivider(): HTMLElement {
    return h("div", { className: "my-1 h-px bg-se-divider" });
  }

  /** 复制当前选区文本到剪贴板 */
  private async copySelection(): Promise<void> {
    const { from, to, empty } = this.editor.state.selection;
    if (empty) return;
    const text = this.editor.state.doc.textBetween(from, to, " ");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopyToClipboard(text);
      }
    } catch {
      fallbackCopyToClipboard(text);
    }
  }

  /** 剪切当前选区：先复制再删除 */
  private async cutSelection(): Promise<void> {
    if (this.editor.state.selection.empty) return;
    await this.copySelection();
    this.editor.chain().focus().deleteSelection().run();
  }

  /** 从剪贴板读取并插入到光标处 */
  private async pasteFromClipboard(): Promise<void> {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          // 优先 HTML，其次纯文本
          if (item.types.includes("text/html")) {
            const blob = await item.getType("text/html");
            const html = await blob.text();
            if (html) {
              this.editor.chain().focus().insertContent(html).run();
              return;
            }
          }
        }
        for (const item of items) {
          if (item.types.includes("text/plain")) {
            const blob = await item.getType("text/plain");
            const text = await blob.text();
            if (text) {
              this.editor.chain().focus().insertContent(text).run();
              return;
            }
          }
        }
      } else if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) this.editor.chain().focus().insertContent(text).run();
      }
    } catch {
      // 权限被拒：编辑器聚焦后用户可使用 Ctrl+V
      this.editor.chain().focus().run();
    }
  }

  open(x: number, y: number): void {
    this.close();
    const el = h("div", {
      className: "fixed z-[200] min-w-[160px] rounded-md border border-se-border bg-se-canvas py-1 shadow-panel",
    });
    (el as HTMLElement).style.left = `${x}px`;
    (el as HTMLElement).style.top = `${y}px`;
    el.addEventListener("mousedown", (e) => e.stopPropagation());

    el.appendChild(this.buildItem(this.i18n.t("contextMenu.cut"), () => this.cutSelection()));
    el.appendChild(this.buildItem(this.i18n.t("contextMenu.copy"), () => this.copySelection()));
    el.appendChild(this.buildItem(this.i18n.t("contextMenu.paste"), () => this.pasteFromClipboard()));
    el.appendChild(this.buildDivider());
    el.appendChild(this.buildItem(this.i18n.t("contextMenu.selectAll"), () => this.editor.chain().focus().selectAll().run()));

    const inLink = this.editor.isActive("link");
    const inTable = this.editor.isActive("table");
    const inCell = this.editor.isActive("tableCell") || this.editor.isActive("tableHeader");

    if (inLink) {
      el.appendChild(this.buildDivider());
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.editLink"), () => this.store.openDialog("link")));
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.unlink"), () => this.editor.chain().focus().unsetLink().run()));
    }

    if (inTable && inCell) {
      el.appendChild(this.buildDivider());
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.addRowBefore"), () => this.editor.chain().focus().addRowBefore().run()));
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.addRowAfter"), () => this.editor.chain().focus().addRowAfter().run()));
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.addColumnBefore"), () => this.editor.chain().focus().addColumnBefore().run()));
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.addColumnAfter"), () => this.editor.chain().focus().addColumnAfter().run()));
      el.appendChild(this.buildDivider());
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.deleteRow"), () => this.editor.chain().focus().deleteRow().run()));
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.deleteColumn"), () => this.editor.chain().focus().deleteColumn().run()));
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.mergeCells"), () => this.editor.chain().focus().mergeCells().run()));
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.splitCell"), () => this.editor.chain().focus().splitCell().run()));
      el.appendChild(this.buildItem(this.i18n.t("contextMenu.deleteTable"), () => this.editor.chain().focus().deleteTable().run()));
    }

    this.el = el;
    document.body.appendChild(el);
    this.cleanup.push(onClickOutside(el, () => this.close()));
    this.cleanup.push(onEscape(() => this.close()));
    const onScroll = () => this.close();
    document.addEventListener("scroll", onScroll, true);
    this.cleanup.push(() => document.removeEventListener("scroll", onScroll, true));
  }

  close(): void {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
  }

  destroy(): void {
    this.close();
  }
}
