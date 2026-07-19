import type { Editor } from "@tiptap/core";
import { cn, h } from "./dom";
import { getIcon } from "./icons";

/**
 * 表格浮动工具栏
 *
 * 当光标进入表格单元格时，在表格上方显示一个浮动工具栏，
 * 提供行列增删、合并/拆分单元格、表头切换、对齐、删除表格等操作。
 */
export class TableBubble {
  private editor: Editor;
  private el: HTMLElement;
  private visible = false;

  constructor(editor: Editor) {
    this.editor = editor;
    this.el = this.build();
    this.el.style.display = "none";
    document.body.appendChild(this.el);
    this.bindEvents();
  }

  private build(): HTMLElement {
    const el = h("div", {
      className:
        "fixed z-[150] flex items-center gap-0.5 rounded-md border border-se-border bg-white px-1 py-1 shadow-panel",
    });
    const addBtn = (
      title: string,
      icon: string,
      onClick: () => void,
    ): HTMLButtonElement => {
      const btn = h("button", {
        type: "button",
        title,
        className: cn(
          "flex h-7 w-7 items-center justify-center rounded text-se-ink hover:bg-se-hover",
        ),
        innerHTML: getIcon(icon),
      });
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
      });
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        onClick();
      });
      el.appendChild(btn);
      return btn;
    };
    const sep = (): void => {
      const d = h("div", { className: "mx-0.5 h-5 w-px bg-se-divider" });
      el.appendChild(d);
    };

    addBtn("上方插入行", "rowTop", () =>
      this.editor.chain().focus().addRowBefore().run(),
    );
    addBtn("下方插入行", "rowBottom", () =>
      this.editor.chain().focus().addRowAfter().run(),
    );
    addBtn("左侧插入列", "colLeft", () =>
      this.editor.chain().focus().addColumnBefore().run(),
    );
    addBtn("右侧插入列", "colRight", () =>
      this.editor.chain().focus().addColumnAfter().run(),
    );
    sep();
    addBtn("删除行", "trash", () => this.editor.chain().focus().deleteRow().run());
    addBtn("删除列", "trash", () =>
      this.editor.chain().focus().deleteColumn().run(),
    );
    sep();
    addBtn("合并单元格", "merge", () =>
      this.editor.chain().focus().mergeCells().run(),
    );
    addBtn("拆分单元格", "split", () =>
      this.editor.chain().focus().splitCell().run(),
    );
    sep();
    addBtn("切换表头行", "tableHeader", () =>
      this.editor.chain().focus().toggleHeaderRow().run(),
    );
    sep();
    addBtn("删除表格", "trashTable", () =>
      this.editor.chain().focus().deleteTable().run(),
    );

    return el;
  }

  private bindEvents(): void {
    const handler = (): void => this.update();
    this.editor.on("selectionUpdate", handler);
    this.editor.on("transaction", handler);
    this.editor.on("blur", handler);
    const onScroll = (): void => {
      if (this.visible) this.position();
    };
    document.addEventListener("scroll", onScroll, true);
    this.editor.on("destroy", () => {
      document.removeEventListener("scroll", onScroll, true);
    });
  }

  private update(): void {
    const inTable =
      this.editor.isActive("tableCell") ||
      this.editor.isActive("tableHeader");
    if (inTable) this.show();
    else this.hide();
  }

  private show(): void {
    if (!this.visible) {
      this.el.style.display = "flex";
      this.visible = true;
    }
    this.position();
  }

  private hide(): void {
    if (this.visible) {
      this.el.style.display = "none";
      this.visible = false;
    }
  }

  private position(): void {
    // 取表格节点的 DOM 位置，把工具栏定位到表格右上角
    const tableEl = this.findTableEl();
    if (!tableEl) {
      this.hide();
      return;
    }
    const rect = tableEl.getBoundingClientRect();
    // 优先贴在表格顶部居中；顶部空间不足时贴在底部
    const bubbleH = 36;
    const top = rect.top > bubbleH + 8 ? rect.top - bubbleH - 4 : rect.bottom + 4;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 400));
    this.el.style.top = `${top}px`;
    this.el.style.left = `${left}px`;
  }

  private findTableEl(): HTMLElement | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === "TABLE") return el;
        const t = el.closest?.("table");
        if (t) return t;
      }
      node = node.parentNode;
    }
    return null;
  }

  destroy(): void {
    this.el.remove();
  }
}
