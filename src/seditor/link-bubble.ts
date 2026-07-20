import type { Editor } from "@tiptap/core";
import { cn, h } from "./dom";
import { getIcon } from "./icons";
import { onClickOutside, onEscape } from "./dom";
import type { I18n } from "../editor/core/i18n";

/**
 * 链接编辑浮层
 *
 * 当光标位于链接中时，在链接下方显示一个浮层：
 * - 显示当前 URL，可点击直接打开新标签页
 * - 「编辑」按钮：打开链接对话框
 * - 「取消链接」按钮：移除 link mark
 */
export class LinkBubble {
  private editor: Editor;
  private i18n: I18n;
  private el: HTMLElement;
  private visible = false;
  private cleanup: (() => void)[] = [];

  constructor(editor: Editor, i18n: I18n) {
    this.editor = editor;
    this.i18n = i18n;
    this.el = this.build();
    this.el.style.display = "none";
    document.body.appendChild(this.el);
    this.bindEvents();
  }

  private build(): HTMLElement {
    const el = h("div", {
      className:
        "fixed z-[150] flex max-w-[360px] items-center gap-1 rounded-md border border-se-border bg-se-canvas px-2 py-1.5 shadow-panel",
    });
    // URL 显示/打开
    const linkSpan = h("a", {
      className: "flex min-w-0 flex-1 items-center gap-1 text-[12px] text-se-primary-text hover:underline",
      target: "_blank",
      rel: "noopener noreferrer",
    });
    const linkIcon = h("span", { className: "shrink-0 text-se-primary" });
    linkIcon.innerHTML = getIcon("link");
    const linkText = h("span", { className: "truncate" });
    linkSpan.appendChild(linkIcon);
    linkSpan.appendChild(linkText);
    el.appendChild(linkSpan);

    // 编辑按钮
    const editBtn = h("button", {
      type: "button",
      title: this.i18n.t("linkBubble.edit"),
      className: cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded text-se-ink hover:bg-se-hover",
      ),
    });
    editBtn.innerHTML = getIcon("edit");
    editBtn.addEventListener("mousedown", (e) => e.preventDefault());
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // 触发 link 对话框：通过 store.openDialog? 此处直接调命令注册不可访问 store
      // 改为通过自定义事件让 SEditor 监听
      this.editor.chain().focus().run();
      window.dispatchEvent(new CustomEvent("seditor:open-link-dialog"));
    });
    el.appendChild(editBtn);

    // 取消链接按钮
    const unlinkBtn = h("button", {
      type: "button",
      title: this.i18n.t("linkBubble.unlink"),
      className: cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded text-se-ink hover:bg-se-hover",
      ),
    });
    unlinkBtn.innerHTML = getIcon("unlink");
    unlinkBtn.addEventListener("mousedown", (e) => e.preventDefault());
    unlinkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.editor.chain().focus().extendMarkRange("link").unsetLink().run();
    });
    el.appendChild(unlinkBtn);

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
    if (this.editor.isActive("link")) this.show();
    else this.hide();
  }

  private show(): void {
    if (!this.visible) {
      this.el.style.display = "flex";
      this.visible = true;
      // 绑定 ESC/外部点击关闭
      this.cleanup.push(onEscape(() => this.hide()));
      this.cleanup.push(onClickOutside(this.el, () => this.hide()));
    }
    // 更新 URL
    const href = (this.editor.getAttributes("link").href as string) ?? "";
    const linkEl = this.el.querySelector("a") as HTMLAnchorElement;
    if (linkEl) {
      linkEl.href = href;
      const textSpan = linkEl.querySelector("span:nth-child(2)");
      if (textSpan) textSpan.textContent = href;
    }
    this.position();
  }

  private hide(): void {
    if (this.visible) {
      this.el.style.display = "none";
      this.visible = false;
    }
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
  }

  private position(): void {
    // 定位到当前选区的下方
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      this.hide();
      return;
    }
    const range = sel.getRangeAt(0).cloneRange();
    // 取选区末尾的 bounding rect
    let rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      // 折叠选区，改用 endContainer
      const tempRange = document.createRange();
      tempRange.selectNodeContents(range.endContainer);
      rect = tempRange.getBoundingClientRect();
    }
    if (rect.width === 0 && rect.height === 0) {
      this.hide();
      return;
    }
    const top = rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 380));
    this.el.style.top = `${top}px`;
    this.el.style.left = `${left}px`;
  }

  destroy(): void {
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
    this.el.remove();
  }
}
