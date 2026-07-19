import type { Editor } from "@tiptap/core";
import { cn, h, fromHTML, onClickOutside, onEscape } from "./dom";
import { getIcon } from "./icons";
import { commandRegistry } from "../editor/commands/registry";
import {
  getFonts,
  getFontSizes,
  getColors,
  getHighlightColors,
  getLineHeights,
} from "../editor/runtime-config";
import type { UIStore } from "./store";

const DIALOG_COMMANDS = new Set(["link", "image", "file", "table", "specialChar", "video", "audio", "emoji", "findReplace"]);

/** 归一化字体值用于比较：去引号、去空白、小写 */
function normalizeFontValue(v: string | undefined | null): string {
  return (v ?? "").replace(/['"]/g, "").replace(/\s+/g, "").toLowerCase();
}

/** 工具栏项配置 */
interface ToolbarItemConfig {
  type: "button" | "dropdown" | "divider";
  id: string;
  label?: string;
  command?: string;
  icon?: string;
  dropdown?: string;
  width?: number;
  variant?: "default" | "toggle";
}

const toolbarGroups: ToolbarItemConfig[][] = [
  [
    { type: "button", id: "undo", label: "撤销 (Ctrl+Z)", command: "undo", icon: "undo" },
    { type: "button", id: "redo", label: "重做 (Ctrl+Y)", command: "redo", icon: "redo" },
  ],
  [
    { type: "button", id: "copy", label: "复制 (Ctrl+C)", command: "copy", icon: "copy" },
    { type: "button", id: "cut", label: "剪切 (Ctrl+X)", command: "cut", icon: "scissors" },
    { type: "button", id: "paste", label: "粘贴 (Ctrl+V)", command: "paste", icon: "clipboardPaste" },
    { type: "button", id: "pastePlainText", label: "粘贴为纯文本 (Ctrl+Shift+V)", command: "pastePlainText", icon: "pasteText" },
  ],
  [{ type: "dropdown", id: "heading", dropdown: "heading", label: "段落格式", width: 120 }],
  [
    { type: "dropdown", id: "fontFamily", dropdown: "fontFamily", label: "字体", width: 120 },
    { type: "dropdown", id: "fontSize", dropdown: "fontSize", label: "字号", width: 72 },
  ],
  [
    { type: "button", id: "bold", label: "加粗 (Ctrl+B)", command: "bold", icon: "bold" },
    { type: "button", id: "italic", label: "斜体 (Ctrl+I)", command: "italic", icon: "italic" },
    { type: "button", id: "underline", label: "下划线 (Ctrl+U)", command: "underline", icon: "underline" },
    { type: "button", id: "strike", label: "删除线 (Ctrl+Shift+X)", command: "strike", icon: "strike" },
  ],
  [
    { type: "dropdown", id: "color", dropdown: "color", label: "文字颜色", width: 36 },
    { type: "dropdown", id: "highlight", dropdown: "highlight", label: "背景色", width: 36 },
  ],
  [
    { type: "button", id: "alignLeft", label: "左对齐 (Ctrl+Shift+L)", command: "alignLeft", icon: "alignLeft" },
    { type: "button", id: "alignCenter", label: "居中 (Ctrl+Shift+E)", command: "alignCenter", icon: "alignCenter" },
    { type: "button", id: "alignRight", label: "右对齐 (Ctrl+Shift+R)", command: "alignRight", icon: "alignRight" },
    { type: "button", id: "alignJustify", label: "两端对齐 (Ctrl+Shift+J)", command: "alignJustify", icon: "alignJustify" },
  ],
  [
    { type: "button", id: "bulletList", label: "无序列表 (Ctrl+Shift+8)", command: "bulletList", icon: "list" },
    { type: "button", id: "orderedList", label: "有序列表 (Ctrl+Shift+7)", command: "orderedList", icon: "listOrdered" },
  ],
  [
    { type: "button", id: "indent", label: "增加缩进 (Tab)", command: "indent", icon: "indentIncrease" },
    { type: "button", id: "outdent", label: "减少缩进 (Shift+Tab)", command: "outdent", icon: "indentDecrease" },
  ],
  [{ type: "dropdown", id: "lineHeight", dropdown: "lineHeight", label: "行距", width: 72 }],
  [
    { type: "button", id: "blockquote", label: "引用 (Ctrl+Shift+B)", command: "blockquote", icon: "quote" },
    { type: "button", id: "codeBlock", label: "代码块 (Ctrl+Alt+C)", command: "codeBlock", icon: "code2" },
  ],
  [
    { type: "button", id: "link", label: "超链接 (Ctrl+K)", command: "link", icon: "link" },
    { type: "button", id: "image", label: "图片", command: "image", icon: "image" },
    { type: "button", id: "video", label: "视频", command: "video", icon: "video" },
    { type: "button", id: "audio", label: "音频", command: "audio", icon: "audio" },
    { type: "button", id: "file", label: "文件", command: "file", icon: "file" },
    { type: "button", id: "table", label: "表格", command: "table", icon: "table" },
    { type: "button", id: "horizontalRule", label: "分割线 (---)", command: "horizontalRule", icon: "minus" },
    { type: "button", id: "specialChar", label: "特殊字符", command: "specialChar", icon: "caseSensitive" },
    { type: "button", id: "emoji", label: "Emoji 表情", command: "emoji", icon: "emoji" },
  ],
  [
    { type: "button", id: "findReplace", label: "查找替换 (Ctrl+F)", command: "findReplace", icon: "search" },
  ],
  [{ type: "button", id: "removeFormat", label: "清除格式 (Ctrl+\\)", command: "removeFormat", icon: "eraser" }],
  [
    { type: "button", id: "sourceToggle", label: "源码", command: "__source__", icon: "code", variant: "toggle" },
    { type: "button", id: "fullscreenToggle", label: "全屏 (F11)", command: "__fullscreen__", icon: "maximize", variant: "toggle" },
  ],
];

export class Toolbar {
  private el: HTMLElement;
  private editor: Editor;
  private store: UIStore;
  private buttonEls = new Map<string, HTMLButtonElement>();
  private cleanups: (() => void)[] = [];
  private hidden: boolean;
  private whitelist: Set<string> | null;

  constructor(editor: Editor, store: UIStore, items?: string[] | false) {
    this.editor = editor;
    this.store = store;
    this.hidden = items === false;
    // null 表示不限制（显示全部）；空数组也视为不限制以避免误清空
    this.whitelist = Array.isArray(items) && items.length > 0 ? new Set(items) : null;
    this.el = this.build();
    this.syncState();
    this.bindEditorEvents();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  /** 当 toolbar 选项为 false 时返回 true，主类据此跳过挂载 */
  isHidden(): boolean {
    return this.hidden;
  }

  private isAllowed(id: string): boolean {
    if (!this.whitelist) return true;
    return this.whitelist.has(id);
  }

  private build(): HTMLElement {
    const root = h("div", {
      className: "flex flex-wrap items-center gap-0.5 border-b border-se-border bg-se-bar px-2 py-1.5",
    });

    if (this.hidden) return root;

    let firstGroupRendered = false;
    toolbarGroups.forEach((group) => {
      const visibleItems = group.filter((it) => it.id && this.isAllowed(it.id));
      if (visibleItems.length === 0) return;

      const groupEl = h("div", { className: "flex items-center gap-0.5" });
      if (firstGroupRendered) {
        groupEl.appendChild(h("div", { className: "mx-1 h-6 w-px bg-se-divider" }));
      }
      firstGroupRendered = true;

      visibleItems.forEach((item) => {
        if (item.type === "dropdown") {
          const dd = this.buildDropdown(item);
          groupEl.appendChild(dd);
          return;
        }
        const btn = this.buildButton(item);
        groupEl.appendChild(btn);
        if (item.id) this.buttonEls.set(item.id, btn);
      });
      root.appendChild(groupEl);
    });
    return root;
  }

  private buildButton(item: ToolbarItemConfig): HTMLButtonElement {
    const btn = h("button", {
      type: "button",
      title: item.label,
      className: cn(
        "flex h-8 w-8 items-center justify-center rounded transition-colors text-se-ink hover:bg-se-hover",
      ),
      innerHTML: item.icon ? getIcon(item.icon) : "",
      onClick: () => this.handleCommand(item.command!),
    });
    btn.setAttribute("aria-label", item.label ?? "");
    return btn;
  }

  private buildDropdown(item: ToolbarItemConfig): HTMLElement {
    const wrap = h("div", { className: "relative" });
    const trigger = h("button", {
      type: "button",
      className: "flex h-8 items-center gap-1 rounded px-2 text-[13px] text-se-ink transition-colors hover:bg-se-hover",
    });
    if (item.width) (trigger as HTMLButtonElement).style.width = `${item.width}px`;
    const labelSpan = h("span", { className: "truncate" });
    const chev = fromHTML(`<span class="shrink-0 text-se-faint">${getIcon("chevronDown")}</span>`);
    trigger.appendChild(labelSpan);
    trigger.appendChild(chev);

    let panel: HTMLElement | null = null;
    let cleanup: (() => void)[] = [];
    const close = () => {
      if (panel) {
        panel.remove();
        panel = null;
      }
      cleanup.forEach((fn) => fn());
      cleanup = [];
      trigger.classList.remove("bg-se-hover");
    };

    trigger.addEventListener("click", () => {
      if (panel) {
        close();
        return;
      }
      panel = this.buildDropdownPanel(item, close);
      if (panel) {
        wrap.appendChild(panel);
        trigger.classList.add("bg-se-hover");
        cleanup.push(onClickOutside(panel, close));
        cleanup.push(onEscape(close));
      }
    });

    // 初始 label
    this.updateDropdownLabel(item, labelSpan);

    wrap.appendChild(trigger);
    return wrap;
  }

  private buildDropdownPanel(
    item: ToolbarItemConfig,
    close: () => void,
  ): HTMLElement | null {
    const kind = item.dropdown;
    const panel = h("div", {
      className: "absolute left-0 top-9 z-50 rounded-md border border-se-border bg-white shadow-dropdown",
    });

    if (kind === "heading") {
      this.buildHeadingPanel(panel, close);
    } else if (kind === "fontFamily") {
      this.buildListPanel(panel, close, getFonts(), (val) => {
        if (val) this.editor.chain().focus().setFontFamily(val).run();
        else this.editor.chain().focus().unsetFontFamily().run();
      }, (val) => {
        const cur = this.editor.getAttributes("textStyle").fontFamily as string | undefined;
        return !!cur && normalizeFontValue(val) === normalizeFontValue(cur);
      }, true);
    } else if (kind === "fontSize") {
      this.buildListPanel(panel, close, getFontSizes(), (val) => {
        if (val) this.editor.chain().focus().setFontSize(val).run();
        else this.editor.chain().focus().unsetFontSize().run();
      }, (val) => {
        const cur = this.editor.getAttributes("textStyle").fontSize as string | undefined;
        return !!cur && val === cur;
      }, false);
    } else if (kind === "lineHeight") {
      this.buildListPanel(panel, close, getLineHeights(), (val) => {
        this.editor.chain().focus().setLineHeight(val).run();
      }, (val) => {
        const cur = this.editor.getAttributes("paragraph").lineHeight as string | undefined;
        return val === cur;
      }, false);
    } else if (kind === "color") {
      this.buildColorPanel(panel, close, getColors(), "文字颜色", (c) => {
        this.editor.chain().focus().setColor(c).run();
      }, () => {
        this.editor.chain().focus().unsetColor().run();
      });
    } else if (kind === "highlight") {
      this.buildColorPanel(panel, close, getHighlightColors(), "背景颜色", (c) => {
        this.editor.chain().focus().setHighlight({ color: c }).run();
      }, () => {
        this.editor.chain().focus().unsetHighlight().run();
      });
    } else {
      return null;
    }
    return panel;
  }

  private buildHeadingPanel(panel: HTMLElement, close: () => void): void {
    const options: { label: string; level?: number }[] = [
      { label: "正文" },
      { label: "标题 1", level: 1 },
      { label: "标题 2", level: 2 },
      { label: "标题 3", level: 3 },
      { label: "标题 4", level: 4 },
      { label: "标题 5", level: 5 },
      { label: "标题 6", level: 6 },
    ];
    const inner = h("div", { className: "py-1" });
    options.forEach((o) => {
      const active = o.level
        ? this.editor.isActive("heading", { level: o.level })
        : this.editor.isActive("paragraph");
      const item = this.buildMenuItem(o.label, active, () => {
        if (o.level) this.editor.chain().focus().toggleHeading({ level: o.level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
        else this.editor.chain().focus().setParagraph().run();
        close();
      });
      inner.appendChild(item);
    });
    panel.appendChild(inner);
    panel.style.minWidth = "140px";
  }

  private buildListPanel(
    panel: HTMLElement,
    close: () => void,
    options: { label: string; value: string }[],
    onSelect: (val: string) => void,
    isActive: (val: string) => boolean,
    showLeading: boolean,
  ): void {
    const inner = h("div", { className: "py-1" });
    options.forEach((o) => {
      const item = this.buildMenuItem(o.label, isActive(o.value), () => {
        onSelect(o.value);
        close();
      }, showLeading && o.value ? o.value : undefined);
      inner.appendChild(item);
    });
    panel.appendChild(inner);
    panel.style.minWidth = "150px";
  }

  private buildMenuItem(
    label: string,
    active: boolean,
    onClick: () => void,
    fontFamily?: string,
  ): HTMLElement {
    const btn = h("button", {
      type: "button",
      className: cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-se-ink hover:bg-se-hover",
        active && "text-se-primary-text",
      ),
    });
    if (fontFamily) {
      const lead = h("span", { className: "text-[13px]" });
      (lead as HTMLElement).style.fontFamily = fontFamily;
      lead.textContent = "Aa";
      btn.appendChild(lead);
    }
    const span = h("span", { className: "flex-1 truncate" });
    span.textContent = label;
    btn.appendChild(span);
    if (active) {
      const check = fromHTML(`<span class="text-se-primary">${getIcon("check")}</span>`);
      btn.appendChild(check);
    }
    btn.addEventListener("click", onClick);
    return btn;
  }

  private buildColorPanel(
    panel: HTMLElement,
    close: () => void,
    colors: string[],
    title: string,
    onPick: (c: string) => void,
    onClear: () => void,
  ): void {
    const wrap = h("div", { className: "p-2" });
    const titleEl = h("div", { className: "mb-1.5 text-[11px] text-se-faint" });
    titleEl.textContent = title;
    wrap.appendChild(titleEl);
    const grid = h("div", { className: "grid grid-cols-6 gap-1" });
    colors.forEach((c) => {
      const sw = h("button", {
        type: "button",
        title: c === "transparent" ? "无" : c,
        className: "h-5 w-5 rounded border border-se-border transition-transform hover:scale-110",
      });
      (sw as HTMLElement).style.background =
        c === "transparent"
          ? "linear-gradient(45deg,#fff 45%,#e9539b 45%,#e9539b 55%,#fff 55%)"
          : c;
      sw.addEventListener("click", () => {
        if (c === "transparent") onClear();
        else onPick(c);
        close();
      });
      grid.appendChild(sw);
    });
    wrap.appendChild(grid);
    const clearBtn = h("button", {
      type: "button",
      className: "mt-2 w-full rounded px-2 py-1 text-left text-[12px] text-se-sub hover:bg-se-hover",
    });
    clearBtn.textContent = title.includes("文字") ? "清除颜色" : "清除背景";
    clearBtn.addEventListener("click", () => {
      onClear();
      close();
    });
    wrap.appendChild(clearBtn);
    panel.appendChild(wrap);
    panel.style.minWidth = "168px";
  }

  private updateDropdownLabel(item: ToolbarItemConfig, labelEl: HTMLElement): void {
    const kind = item.dropdown;
    let label = item.label ?? "";
    if (kind === "heading") {
      const opts = [
        { label: "正文", is: () => this.editor.isActive("paragraph") },
        { label: "标题 1", is: () => this.editor.isActive("heading", { level: 1 }) },
        { label: "标题 2", is: () => this.editor.isActive("heading", { level: 2 }) },
        { label: "标题 3", is: () => this.editor.isActive("heading", { level: 3 }) },
        { label: "标题 4", is: () => this.editor.isActive("heading", { level: 4 }) },
        { label: "标题 5", is: () => this.editor.isActive("heading", { level: 5 }) },
        { label: "标题 6", is: () => this.editor.isActive("heading", { level: 6 }) },
      ];
      const cur = opts.find((o) => o.is());
      label = cur?.label ?? "段落格式";
    } else if (kind === "fontFamily") {
      const cur = this.editor.getAttributes("textStyle").fontFamily as string | undefined;
      const m = cur ? getFonts().find((f) => normalizeFontValue(f.value) === normalizeFontValue(cur)) : undefined;
      label = m && m.value ? m.label : "字体";
    } else if (kind === "fontSize") {
      const cur = this.editor.getAttributes("textStyle").fontSize as string | undefined;
      const m = getFontSizes().find((s) => s.value === cur);
      label = m ? m.label : "字号";
    } else if (kind === "lineHeight") {
      const cur = this.editor.getAttributes("paragraph").lineHeight as string | undefined;
      const m = getLineHeights().find((o) => o.value === cur);
      label = m ? m.label : "行距";
    } else if (kind === "color" || kind === "highlight") {
      label = "";
    }
    labelEl.textContent = label;
  }

  private handleCommand(command: string): void {
    if (command === "__source__") return this.store.toggleSource();
    if (command === "__fullscreen__") return this.store.toggleFullscreen();
    if (DIALOG_COMMANDS.has(command)) return this.store.openDialog(command);
    commandRegistry.run(this.editor, command);
  }

  /** 同步按钮激活/禁用状态 */
  syncState(): void {
    this.buttonEls.forEach((btn, id) => {
      const item = toolbarGroups.flat().find((it) => it.id === id);
      if (!item || !item.command) return;
      const cmd = item.command;
      const state = this.store.getState();
      const active =
        cmd === "__source__"
          ? state.isSourceMode
          : cmd === "__fullscreen__"
            ? state.isFullscreen
            : commandRegistry.isActive(this.editor, cmd);
      const disabled =
        !commandRegistry.can(this.editor, cmd) &&
        cmd !== "__source__" &&
        cmd !== "__fullscreen__" &&
        !DIALOG_COMMANDS.has(cmd);
      btn.classList.toggle("bg-se-active", active);
      btn.classList.toggle("text-se-primary-text", active);
      btn.classList.toggle("opacity-40", disabled);
      btn.classList.toggle("cursor-not-allowed", disabled);
      btn.disabled = disabled;
    });
  }

  private bindEditorEvents(): void {
    const handler = () => this.syncState();
    this.editor.on("selectionUpdate", handler);
    this.editor.on("transaction", handler);
    this.editor.on("update", handler);
    this.editor.on("focus", handler);
    this.editor.on("blur", handler);
    const unsub = this.store.subscribe(() => this.syncState());
    this.cleanups.push(() => {
      this.editor.off("selectionUpdate", handler);
      this.editor.off("transaction", handler);
      this.editor.off("update", handler);
      this.editor.off("focus", handler);
      this.editor.off("blur", handler);
      unsub();
    });
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.el.remove();
  }
}
