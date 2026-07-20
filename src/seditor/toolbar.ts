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
import { defaultTemplates } from "../editor/core/templates";
import type { UIStore } from "./store";
import type { I18n, I18nMessages } from "../editor/core/i18n";

const DIALOG_COMMANDS = new Set([
  "link", "image", "file", "table", "specialChar", "video", "audio", "emoji",
  "findReplace", "iframe", "anchor", "music", "chart", "graffiti", "remoteImage",
]);

const PARAGRAPH_SPACING_OPTIONS = [
  { label: "默认", value: "" },
  { label: "0px", value: "0px" },
  { label: "6px", value: "6px" },
  { label: "12px", value: "12px" },
  { label: "18px", value: "18px" },
  { label: "24px", value: "24px" },
  { label: "36px", value: "36px" },
];

const TEXT_DIRECTION_OPTIONS = [
  { label: "默认", value: "" },
  { label: "从左到右", value: "ltr" },
  { label: "从右到左", value: "rtl" },
];

const TEXT_CASE_OPTIONS = [
  { label: "大写", value: "upper", command: "textCaseUpper" },
  { label: "小写", value: "lower", command: "textCaseLower" },
  { label: "首字母大写", value: "capitalize", command: "textCaseCapitalize" },
];

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
    { type: "button", id: "subscript", label: "下标 (Ctrl+,)", command: "subscript", icon: "subscript" },
    { type: "button", id: "superscript", label: "上标 (Ctrl+.)", command: "superscript", icon: "superscript" },
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
    { type: "dropdown", id: "codeLanguage", dropdown: "codeLanguage", label: "语言", width: 90 },
  ],
  [
    { type: "button", id: "link", label: "超链接 (Ctrl+K)", command: "link", icon: "link" },
    { type: "button", id: "unlink", label: "取消链接", command: "unlink", icon: "unlink" },
    { type: "button", id: "image", label: "图片", command: "image", icon: "image" },
    { type: "button", id: "imageAlignNone", label: "图片默认", command: "imageAlignNone", icon: "alignJustify" },
    { type: "button", id: "imageAlignLeft", label: "图片左浮动", command: "imageAlignLeft", icon: "alignLeft" },
    { type: "button", id: "imageAlignCenter", label: "图片居中", command: "imageAlignCenter", icon: "alignCenter" },
    { type: "button", id: "imageAlignRight", label: "图片右浮动", command: "imageAlignRight", icon: "alignRight" },
    { type: "button", id: "video", label: "视频", command: "video", icon: "video" },
    { type: "button", id: "audio", label: "音频", command: "audio", icon: "audio" },
    { type: "button", id: "file", label: "文件", command: "file", icon: "file" },
    { type: "button", id: "table", label: "表格", command: "table", icon: "table" },
    { type: "button", id: "horizontalRule", label: "分割线 (---)", command: "horizontalRule", icon: "minus" },
    { type: "button", id: "specialChar", label: "特殊字符", command: "specialChar", icon: "caseSensitive" },
    { type: "button", id: "emoji", label: "Emoji 表情", command: "emoji", icon: "emoji" },
  ],
  [
    { type: "button", id: "music", label: "音乐", command: "music", icon: "music" },
    { type: "button", id: "chart", label: "图表", command: "chart", icon: "chart" },
    { type: "button", id: "screenshot", label: "截图", command: "screenshot", icon: "screenshot" },
    { type: "button", id: "graffiti", label: "涂鸦", command: "graffiti", icon: "graffiti" },
    { type: "button", id: "remoteImage", label: "远程图片", command: "remoteImage", icon: "remoteImage" },
    { type: "button", id: "saveImage", label: "保存图片", command: "saveImage", icon: "saveImage" },
    { type: "dropdown", id: "template", dropdown: "template", label: "模板", width: 80 },
  ],
  [
    { type: "button", id: "insertTime", label: "插入时间", command: "insertTime", icon: "clock" },
    { type: "button", id: "insertDate", label: "插入日期", command: "insertDate", icon: "calendar" },
    { type: "button", id: "selectAll", label: "全选 (Ctrl+A)", command: "selectAll", icon: "selectAll" },
    { type: "button", id: "clearDocument", label: "清空文档", command: "clearDocument", icon: "clearDocument" },
    { type: "button", id: "print", label: "打印", command: "print", icon: "printer" },
    { type: "button", id: "preview", label: "预览", command: "preview", icon: "eye" },
  ],
  [
    { type: "button", id: "findReplace", label: "查找替换 (Ctrl+F)", command: "findReplace", icon: "search" },
  ],
  [{ type: "dropdown", id: "export", dropdown: "export", label: "导出", width: 80 }],
  [{ type: "button", id: "removeFormat", label: "清除格式 (Ctrl+\\)", command: "removeFormat", icon: "eraser" }],
  [
    { type: "dropdown", id: "paragraphSpacingBefore", dropdown: "paragraphSpacingBefore", label: "段前距", width: 80 },
    { type: "dropdown", id: "paragraphSpacingAfter", dropdown: "paragraphSpacingAfter", label: "段后距", width: 80 },
  ],
  [{ type: "dropdown", id: "textDirection", dropdown: "textDirection", label: "文字方向", width: 90 }],
  [{ type: "button", id: "characterBorder", label: "字符边框", command: "characterBorder", icon: "characterBorder" }],
  [{ type: "button", id: "pageBreak", label: "分页符", command: "pageBreak", icon: "pageBreak" }],
  [
    { type: "button", id: "iframe", label: "插入 iframe", command: "iframe", icon: "iframe" },
    { type: "button", id: "anchor", label: "插入锚点", command: "anchor", icon: "anchor" },
  ],
  [{ type: "dropdown", id: "textCase", dropdown: "textCase", label: "字母大小写", width: 100 }],
  [
    { type: "button", id: "formatPainterCopy", label: "格式刷复制", command: "formatPainterCopy", icon: "formatPainter" },
    { type: "button", id: "formatPainterApply", label: "格式刷应用", command: "formatPainterApply", icon: "formatPainter" },
  ],
  [{ type: "button", id: "autoFormat", label: "自动排版", command: "autoFormat", icon: "autoFormat" }],
  [{ type: "dropdown", id: "backgroundColor", dropdown: "backgroundColor", label: "背景色", width: 80 }],
  [
    { type: "button", id: "sourceToggle", label: "源码", command: "__source__", icon: "code", variant: "toggle" },
    { type: "button", id: "fullscreenToggle", label: "全屏 (F11)", command: "__fullscreen__", icon: "maximize", variant: "toggle" },
  ],
];

export class Toolbar {
  private el: HTMLElement;
  private editor: Editor;
  private store: UIStore;
  private i18n: I18n;
  private buttonEls = new Map<string, HTMLButtonElement>();
  private groupEls: HTMLElement[] = [];
  private groupConfigs: ToolbarItemConfig[][] = [];
  private moreWrap: HTMLElement | null = null;
  private hiddenItemIds = new Set<string>();
  private cleanups: (() => void)[] = [];
  private hidden: boolean;
  private whitelist: Set<string> | null;
  private responsive: boolean;

  constructor(editor: Editor, store: UIStore, items?: string[] | false, responsive = false, i18n?: I18n) {
    this.editor = editor;
    this.store = store;
    this.i18n = i18n ?? { locale: "zh-CN", t: (_k: string) => _k } as unknown as I18n;
    this.hidden = items === false;
    // null 表示不限制（显示全部）；空数组也视为不限制以避免误清空
    this.whitelist = Array.isArray(items) && items.length > 0 ? new Set(items) : null;
    this.responsive = responsive;
    this.el = this.build();
    if (this.responsive) this.setupResponsive();
    this.syncState();
    this.bindEditorEvents();
  }

  /** 获取工具栏项的显示标签：优先使用 localeData 覆盖 */
  private getItemLabel(item: ToolbarItemConfig): string {
    if (!item.id) return item.label ?? "";
    const key = `toolbar.${item.id}` as keyof I18nMessages;
    const translated = this.i18n.t(key);
    return translated === key ? (item.label ?? item.id) : translated;
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

      const groupEl = h("div", { className: "flex items-center gap-0.5 se-toolbar-group" });
      if (firstGroupRendered) {
        groupEl.appendChild(h("div", { className: "mx-1 h-6 w-px bg-se-divider se-toolbar-divider" }));
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
      this.groupEls.push(groupEl);
      this.groupConfigs.push(visibleItems);
    });

    // 「更多 ⋯」按钮：仅在启用响应式折叠时渲染
    if (this.responsive) {
      const moreWrap = h("div", { className: "relative hidden se-toolbar-more" });
      const moreBtn = h("button", {
        type: "button",
        title: "更多",
        className: "flex h-8 items-center gap-1 rounded px-2 text-[13px] text-se-ink hover:bg-se-hover",
      });
      moreBtn.setAttribute("aria-label", "更多");
      moreBtn.innerHTML = "更多 " + getIcon("chevronDown");
      let morePanel: HTMLElement | null = null;
      let morePanelCleanup: (() => void)[] = [];
      const closeMore = (): void => {
        if (morePanel) {
          morePanel.remove();
          morePanel = null;
        }
        morePanelCleanup.forEach((fn) => fn());
        morePanelCleanup = [];
      };
      moreBtn.addEventListener("click", () => {
        if (morePanel) {
          closeMore();
          return;
        }
        morePanel = h("div", {
          className: "absolute right-0 top-9 z-50 rounded-md border border-se-border bg-se-canvas shadow-dropdown",
        });
        morePanel.style.minWidth = "200px";
        const inner = h("div", { className: "py-1" });
        // 把所有当前被响应式隐藏的 group 的按钮渲染进来
        // 注意：dropdown 类型（heading/fontFamily/color 等）的 command 为 undefined，
        // 且其交互依赖浮层定位，无法在「更多」面板中直接展开，故跳过避免崩溃。
        this.groupEls.forEach((gEl, idx) => {
          if (!gEl.classList.contains("se-toolbar-overflow-hidden")) return;
          const cfgs = this.groupConfigs[idx];
          cfgs.forEach((cfg) => {
            if (cfg.type === "divider" || cfg.type === "dropdown" || !cfg.id || !cfg.command) return;
            const item = this.buildMenuItem(cfg.label ?? cfg.id, false, () => {
              this.handleCommand(cfg.command!);
              closeMore();
            });
            inner.appendChild(item);
          });
        });
        morePanel.appendChild(inner);
        moreWrap.appendChild(morePanel);
        morePanelCleanup.push(onClickOutside(morePanel, closeMore));
        morePanelCleanup.push(onEscape(closeMore));
      });
      moreWrap.appendChild(moreBtn);
      root.appendChild(moreWrap);
      this.moreWrap = moreWrap;
    }

    return root;
  }

  /**
   * 响应式折叠：监听工具栏宽度，溢出时从末尾向前隐藏 group，并显示「更多」按钮
   * 用 rAF 延迟 relayout，避免同步触发布局变更导致 ResizeObserver loop 警告
   */
  private setupResponsive(): void {
    if (this.hidden) return;
    if (typeof ResizeObserver === "undefined") return;
    let rafId = 0;
    const ro = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        this.relayout();
      });
    });
    ro.observe(this.el);
    this.cleanups.push(() => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    });
  }

  private relayout(): void {
    if (!this.moreWrap) return;
    // 暂时显示全部 group，便于测量
    this.groupEls.forEach((g) => g.classList.remove("se-toolbar-overflow-hidden"));
    this.moreWrap.classList.add("hidden");

    // 工具栏允许两行：第二行还放不下时才折叠
    const rootWidth = this.el.clientWidth;
    // 估算可用宽度（去掉 padding）
    const available = rootWidth - 16;
    // 测量所有 group 的总宽度
    let totalWidth = 0;
    this.groupEls.forEach((g) => {
      totalWidth += g.offsetWidth + 2;
    });
    // 加上「更多」按钮的预留宽度
    const moreBtnWidth = 80;

    if (totalWidth <= available) {
      // 不需要折叠
      return;
    }

    // 从末尾向前隐藏，直到能放下或只剩第一个 group
    let visibleWidth = totalWidth;
    const hiddenIdx: number[] = [];
    for (let i = this.groupEls.length - 1; i >= 1; i--) {
      if (visibleWidth + moreBtnWidth <= available) break;
      const g = this.groupEls[i];
      visibleWidth -= g.offsetWidth + 2;
      g.classList.add("se-toolbar-overflow-hidden");
      hiddenIdx.push(i);
    }
    if (hiddenIdx.length > 0) {
      this.moreWrap.classList.remove("hidden");
    }
  }

  /**
   * 运行时设置某个工具栏项的可见性
   * @param id 工具栏项 id（如 "bold" / "image"）
   * @param visible 是否可见
   */
  setItemVisible(id: string, visible: boolean): void {
    const btn = this.buttonEls.get(id);
    if (btn) {
      btn.style.display = visible ? "" : "none";
    }
    if (visible) this.hiddenItemIds.delete(id);
    else this.hiddenItemIds.add(id);
    this.relayout();
  }

  /** 隐藏整组工具栏项（按 group 索引） */
  setGroupVisible(groupIndex: number, visible: boolean): void {
    const g = this.groupEls[groupIndex];
    if (g) g.style.display = visible ? "" : "none";
    this.relayout();
  }

  private buildButton(item: ToolbarItemConfig): HTMLButtonElement {
    const label = this.getItemLabel(item);
    const btn = h("button", {
      type: "button",
      title: label,
      className: cn(
        "flex h-8 w-8 items-center justify-center rounded transition-colors text-se-ink hover:bg-se-hover",
      ),
      innerHTML: item.icon ? getIcon(item.icon) : "",
      onClick: () => this.handleCommand(item.command!),
    });
    btn.setAttribute("aria-label", label);
    return btn;
  }

  private buildDropdown(item: ToolbarItemConfig): HTMLElement {
    const wrap = h("div", { className: "relative" });
    const trigger = h("button", {
      type: "button",
      className: "flex h-8 items-center gap-1 rounded px-2 text-[13px] text-se-ink transition-colors hover:bg-se-hover",
    });
    trigger.setAttribute("aria-label", item.label ?? "");
    trigger.setAttribute("aria-haspopup", "true");
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
      className: "absolute left-0 top-9 z-50 rounded-md border border-se-border bg-se-canvas shadow-dropdown",
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
    } else if (kind === "export") {
      this.buildExportPanel(panel, close);
    } else if (kind === "codeLanguage") {
      this.buildCodeLanguagePanel(panel, close);
    } else if (kind === "paragraphSpacingBefore") {
      this.buildParagraphSpacingPanel(panel, close, "before");
    } else if (kind === "paragraphSpacingAfter") {
      this.buildParagraphSpacingPanel(panel, close, "after");
    } else if (kind === "textDirection") {
      this.buildTextDirectionPanel(panel, close);
    } else if (kind === "textCase") {
      this.buildTextCasePanel(panel, close);
    } else if (kind === "backgroundColor") {
      this.buildBackgroundColorPanel(panel, close);
    } else if (kind === "template") {
      this.buildTemplatePanel(panel, close);
    } else {
      return null;
    }
    return panel;
  }

  private buildExportPanel(panel: HTMLElement, close: () => void): void {
    const inner = h("div", { className: "py-1" });
    const options: { label: string; cmd: string }[] = [
      { label: "导出 Markdown (.md)", cmd: "__export_md__" },
      { label: "导出 Word (.doc)", cmd: "__export_word__" },
      { label: "导出 PDF（打印）", cmd: "__export_pdf__" },
    ];
    options.forEach((o) => {
      const item = this.buildMenuItem(o.label, false, () => {
        this.handleCommand(o.cmd);
        close();
      });
      inner.appendChild(item);
    });
    panel.appendChild(inner);
    panel.style.minWidth = "200px";
  }

  private buildCodeLanguagePanel(panel: HTMLElement, close: () => void): void {
    const options = [
      { label: "纯文本", value: "" },
      { label: "JavaScript", value: "javascript" },
      { label: "TypeScript", value: "typescript" },
      { label: "HTML", value: "html" },
      { label: "CSS", value: "css" },
      { label: "Python", value: "python" },
      { label: "Java", value: "java" },
      { label: "JSON", value: "json" },
      { label: "SQL", value: "sql" },
      { label: "Bash", value: "bash" },
    ];
    const inner = h("div", { className: "py-1" });
    const cur = this.editor.getAttributes("codeBlock").language as string | undefined;
    options.forEach((o) => {
      const active = (cur || "") === o.value;
      const item = this.buildMenuItem(o.label, active, () => {
        commandRegistry.run(this.editor, "codeBlockLang", o.value);
        close();
      });
      inner.appendChild(item);
    });
    panel.appendChild(inner);
    panel.style.minWidth = "140px";
  }

  private buildParagraphSpacingPanel(panel: HTMLElement, close: () => void, type: "before" | "after"): void {
    const inner = h("div", { className: "py-1" });
    const attrKey = type === "before" ? "paragraphSpacingBefore" : "paragraphSpacingAfter";
    const cmdKey = type === "before" ? "paragraphSpacingBefore" : "paragraphSpacingAfter";
    const cur = this.editor.getAttributes("paragraph")[attrKey] as string | undefined;
    PARAGRAPH_SPACING_OPTIONS.forEach((o) => {
      const active = (cur || "") === o.value;
      const item = this.buildMenuItem(o.label, active, () => {
        commandRegistry.run(this.editor, cmdKey, o.value);
        close();
      });
      inner.appendChild(item);
    });
    panel.appendChild(inner);
    panel.style.minWidth = "120px";
  }

  private buildTextDirectionPanel(panel: HTMLElement, close: () => void): void {
    const inner = h("div", { className: "py-1" });
    const cur = this.editor.getAttributes("paragraph").dir as string | undefined;
    TEXT_DIRECTION_OPTIONS.forEach((o) => {
      const active = (cur || "") === o.value;
      const item = this.buildMenuItem(o.label, active, () => {
        if (o.value) commandRegistry.run(this.editor, `textDirection${o.value.toUpperCase()}` as "textDirectionLtr" | "textDirectionRtl");
        else commandRegistry.run(this.editor, "textDirectionUnset");
        close();
      });
      inner.appendChild(item);
    });
    panel.appendChild(inner);
    panel.style.minWidth = "120px";
  }

  private buildTextCasePanel(panel: HTMLElement, close: () => void): void {
    const inner = h("div", { className: "py-1" });
    TEXT_CASE_OPTIONS.forEach((o) => {
      const item = this.buildMenuItem(o.label, false, () => {
        commandRegistry.run(this.editor, o.command);
        close();
      });
      inner.appendChild(item);
    });
    panel.appendChild(inner);
    panel.style.minWidth = "120px";
  }

  private buildBackgroundColorPanel(panel: HTMLElement, close: () => void): void {
    const colors = ["#ffffff", "#f5f5f4", "#fef3c7", "#dcfce7", "#dbeafe", "#f3e8ff", "#ffe4e6", "#1f2937"];
    const wrap = h("div", { className: "p-2" });
    const titleEl = h("div", { className: "mb-1.5 text-[11px] text-se-faint" });
    titleEl.textContent = "页面背景色";
    wrap.appendChild(titleEl);
    const grid = h("div", { className: "grid grid-cols-4 gap-1" });
    colors.forEach((c) => {
      const sw = h("button", {
        type: "button",
        title: c,
        className: "h-6 w-6 rounded border border-se-border transition-transform hover:scale-110",
      });
      (sw as HTMLElement).style.background = c;
      sw.addEventListener("click", () => {
        commandRegistry.run(this.editor, "backgroundColor", c);
        close();
      });
      grid.appendChild(sw);
    });
    wrap.appendChild(grid);
    const clearBtn = h("button", {
      type: "button",
      className: "mt-2 w-full rounded px-2 py-1 text-left text-[12px] text-se-sub hover:bg-se-hover",
    });
    clearBtn.textContent = "清除背景";
    clearBtn.addEventListener("click", () => {
      commandRegistry.run(this.editor, "backgroundColor", "");
      close();
    });
    wrap.appendChild(clearBtn);
    panel.appendChild(wrap);
    panel.style.minWidth = "140px";
  }

  private buildTemplatePanel(panel: HTMLElement, close: () => void): void {
    const inner = h("div", { className: "py-1" });
    defaultTemplates.forEach((tpl) => {
      const item = this.buildMenuItem(tpl.name, false, () => {
        commandRegistry.run(this.editor, "insertTemplate", tpl.html);
        close();
      });
      inner.appendChild(item);
    });
    panel.appendChild(inner);
    panel.style.minWidth = "140px";
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
    } else if (kind === "export") {
      label = "导出";
    } else if (kind === "codeLanguage") {
      const cur = this.editor.getAttributes("codeBlock").language as string | undefined;
      const options = [
        { label: "JS", value: "javascript" },
        { label: "TS", value: "typescript" },
        { label: "HTML", value: "html" },
        { label: "CSS", value: "css" },
        { label: "Python", value: "python" },
        { label: "Java", value: "java" },
        { label: "JSON", value: "json" },
        { label: "SQL", value: "sql" },
        { label: "Bash", value: "bash" },
      ];
      const m = options.find((o) => o.value === cur);
      label = m ? m.label : "语言";
    } else if (kind === "paragraphSpacingBefore") {
      const cur = this.editor.getAttributes("paragraph").paragraphSpacingBefore as string | undefined;
      const m = PARAGRAPH_SPACING_OPTIONS.find((o) => o.value === (cur ?? ""));
      label = m ? m.label : "段前距";
    } else if (kind === "paragraphSpacingAfter") {
      const cur = this.editor.getAttributes("paragraph").paragraphSpacingAfter as string | undefined;
      const m = PARAGRAPH_SPACING_OPTIONS.find((o) => o.value === (cur ?? ""));
      label = m ? m.label : "段后距";
    } else if (kind === "textDirection") {
      const cur = this.editor.getAttributes("paragraph").dir as string | undefined;
      const m = TEXT_DIRECTION_OPTIONS.find((o) => o.value === (cur ?? ""));
      label = m ? m.label : "方向";
    } else if (kind === "textCase") {
      label = "大小写";
    } else if (kind === "backgroundColor") {
      label = "";
    }
    labelEl.textContent = label;
  }

  private handleCommand(command: string): void {
    if (command === "__source__") return this.store.toggleSource();
    if (command === "__fullscreen__") return this.store.toggleFullscreen();
    if (command === "__export_md__" || command === "__export_word__" || command === "__export_pdf__") {
      window.dispatchEvent(new CustomEvent("seditor:exec", { detail: { command } }));
      return;
    }
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
