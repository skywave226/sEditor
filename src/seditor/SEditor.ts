import { Editor } from "@tiptap/core";
import { buildExtensions } from "../editor/core/extensions";
import { ensureCommandsRegistered } from "../editor/commands/definitions";
import { commandRegistry } from "../editor/commands/registry";
import { getPlaceholder, getHeight } from "../editor/runtime-config";
import type { EditorConfig } from "../editor/types";
import { cn, h } from "./dom";
import { UIStore, type EditorUIState } from "./store";
import { Toolbar } from "./toolbar";
import { DialogManager } from "./dialogs";
import { ContextMenu } from "./context-menu";
import { StatusBar } from "./status-bar";
import { SourceView } from "./source-view";
import { TableBubble } from "./table-bubble";
import { LinkBubble } from "./link-bubble";
import { SlashMenu } from "./slash-menu";
import { exportMarkdown, exportWord, exportPDF } from "./exporter";

export interface SEditorOptions extends EditorConfig {
  target: HTMLElement | string;
}

export class SEditor {
  private editor: Editor | null;
  private store: UIStore;
  private toolbar: Toolbar;
  private statusBar: StatusBar;
  private contextMenu: ContextMenu;
  private tableBubble: TableBubble;
  private linkBubble: LinkBubble;
  private slashMenu: SlashMenu;
  private dialogMgr: DialogManager;
  private sourceView: SourceView;
  private root: HTMLElement;
  private frame: HTMLElement;
  private editorWrap: HTMLElement;
  private target: HTMLElement;
  private onChangeRef?: (html: string) => void;
  private onEditorReadyRef?: (editor: Editor) => void;
  private cleanups: (() => void)[] = [];
  // 草稿自动保存
  private draftKey?: string;
  private draftTimer?: ReturnType<typeof setInterval>;
  private draftRestored = false;
  // 上传函数引用（用于拖拽/粘贴自动上传）
  private imageUploadFn?: (file: File) => Promise<string>;
  private fileUploadFn?: (file: File) => Promise<string>;
  private imageMaxSizeBytes: number;

  constructor(options: SEditorOptions) {
    const target =
      typeof options.target === "string"
        ? document.querySelector<HTMLElement>(options.target)
        : options.target;
    if (!target) {
      throw new Error(`[sEditor] 挂载目标未找到: ${options.target}`);
    }
    this.target = target;
    this.onChangeRef = options.onChange;
    this.onEditorReadyRef = options.onEditorReady;
    this.draftKey = options.draftKey;
    this.imageUploadFn = options.imageUpload;
    this.fileUploadFn = options.fileUpload;
    this.imageMaxSizeBytes = options.imageMaxSize ?? 5 * 1024 * 1024;

    ensureCommandsRegistered();

    this.store = new UIStore();

    // 草稿恢复：若启用 draftKey 且 localStorage 中存在草稿，覆盖 initialContent
    let initialContent = options.initialContent ?? "";
    if (this.draftKey && typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem(this.draftKey);
        if (saved) {
          initialContent = saved;
          this.draftRestored = true;
        }
      } catch {
        // localStorage 不可用时静默忽略
      }
    }

    // 创建编辑器
    const editor = new Editor({
      extensions: buildExtensions(options.placeholder ?? getPlaceholder()),
      content: initialContent,
      editorProps: {
        attributes: { class: "se-content" },
        // 拦截粘贴：若剪贴板包含图片文件，且配置了 imageUpload，则自动上传并插入
        handlePaste: (_view, event) => this.handlePaste(event),
        // 拦截拖拽：图片/文件拖入时若有上传能力则上传，否则交给浏览器默认行为
        handleDrop: (_view, event) => this.handleDrop(event),
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.onChangeRef?.(html);
        this.scheduleDraftSave(html);
      },
    });
    this.editor = editor;

    // 构建 DOM
    this.root = h("div", {
      className: cn(
        "flex flex-col overflow-hidden rounded-lg border border-se-border bg-white shadow-sm",
      ),
    });
    (this.root as HTMLElement).style.height = "auto";

    // 主题：默认 light；dark 时给 root 加 se-dark 类
    this.applyTheme(options.theme ?? "light");

    this.frame = h("div", {
      className: "relative flex-1 overflow-auto bg-white",
    });
    (this.frame as HTMLElement).style.minHeight = `${options.height ?? getHeight()}px`;

    this.editorWrap = h("div", { className: "px-4 py-3" });
    this.editorWrap.appendChild(editor.view.dom);

    this.frame.appendChild(this.editorWrap);
    this.root.appendChild(this.frame);

    // 工具栏（toolbar: false 时不挂载）
    this.toolbar = new Toolbar(editor, this.store, options.toolbar);
    if (!this.toolbar.isHidden()) {
      this.root.insertBefore(this.toolbar.getElement(), this.root.firstChild);
    }

    // 状态栏
    this.statusBar = new StatusBar(editor);
    this.root.appendChild(this.statusBar.getElement());

    target.appendChild(this.root);

    // 右键菜单
    this.contextMenu = new ContextMenu(editor, this.store);
    const onCtx = (e: MouseEvent) => {
      e.preventDefault();
      this.contextMenu.open(e.clientX, e.clientY);
    };
    this.root.addEventListener("contextmenu", onCtx);
    this.cleanups.push(() => this.root.removeEventListener("contextmenu", onCtx));

    // 表格浮动工具栏
    this.tableBubble = new TableBubble(editor);

    // 链接编辑浮层
    this.linkBubble = new LinkBubble(editor);
    const onOpenLinkDialog = (): void => this.store.openDialog("link");
    window.addEventListener("seditor:open-link-dialog", onOpenLinkDialog);
    this.cleanups.push(() => window.removeEventListener("seditor:open-link-dialog", onOpenLinkDialog));

    // 工具栏通过事件委托触发导出等伪命令（toolbar 无法直接访问 SEditor 实例）
    const onExec = (e: Event): void => {
      const detail = (e as CustomEvent<{ command: string; payload?: unknown }>).detail;
      if (!detail) return;
      this.exec(detail.command, detail.payload);
    };
    window.addEventListener("seditor:exec", onExec);
    this.cleanups.push(() => window.removeEventListener("seditor:exec", onExec));

    // / 命令面板
    this.slashMenu = new SlashMenu(editor, this.store);

    // 对话框管理
    this.dialogMgr = new DialogManager(editor, this.store, options);

    // 源码视图
    this.sourceView = new SourceView(editor);

    // 订阅 store 变化
    const unsub = this.store.subscribe((state) => this.onStateChange(state));
    this.cleanups.push(unsub);

    // ESC 退出全屏 / Ctrl+F 查找替换
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.store.getState().isFullscreen) {
        this.store.setFullscreen(false);
      }
      // Ctrl+F / Cmd+F 打开查找替换：仅在 ProseMirror 编辑区域获得焦点时触发，
      // 避免拦截对话框内的输入框（如链接地址输入框）
      const target = e.target as HTMLElement | null;
      const viewDom = this.editor?.view.dom;
      const isInsideEditor = !!target && !!viewDom && (viewDom === target || viewDom.contains(target));
      if (isInsideEditor && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        this.store.openDialog("findReplace");
      }
    };
    this.root.addEventListener("keydown", onKey);
    this.cleanups.push(() => this.root.removeEventListener("keydown", onKey));

    // 草稿自动保存定时器
    if (this.draftKey) {
      const interval = options.draftInterval ?? 3000;
      this.draftTimer = setInterval(() => this.saveDraft(), interval);
      // 页面卸载前同步保存一次
      const onBeforeUnload = () => this.saveDraft();
      window.addEventListener("beforeunload", onBeforeUnload);
      this.cleanups.push(() => window.removeEventListener("beforeunload", onBeforeUnload));
    }

    // 就绪回调
    this.onEditorReadyRef?.(editor);
  }

  /** 应用主题：light / dark / auto；auto 时监听系统主题变化 */
  private applyTheme(theme: "light" | "dark" | "auto"): void {
    const setDark = (v: boolean): void => {
      if (v) this.root.classList.add("se-dark");
      else this.root.classList.remove("se-dark");
    };
    if (theme === "dark") {
      setDark(true);
      return;
    }
    if (theme === "light") {
      setDark(false);
      return;
    }
    // auto：根据 prefers-color-scheme 动态切换
    if (typeof window.matchMedia !== "function") {
      setDark(false);
      return;
    }
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mql.matches);
    const onChange = (e: MediaQueryListEvent): void => setDark(e.matches);
    mql.addEventListener("change", onChange);
    this.cleanups.push(() => mql.removeEventListener("change", onChange));
  }

  /** 拦截粘贴：检测剪贴板中的图片文件，调用 imageUpload 自动上传并插入 */
  private handlePaste(event: ClipboardEvent): boolean {
    if (!this.imageUploadFn) return false;
    const items = event.clipboardData?.items;
    if (!items) return false;
    const imageItems = Array.from(items).filter((it) => it.type.startsWith("image/"));
    if (imageItems.length === 0) return false;
    event.preventDefault();
    // 异步上传并插入
    void (async () => {
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (!file) continue;
        if (file.size > this.imageMaxSizeBytes) {
          continue;
        }
        try {
          const url = await this.imageUploadFn!(file);
          if (url) {
            this.editor?.chain().focus().setImage({ src: url }).run();
          }
        } catch (err) {
          console.error("[sEditor] 粘贴图片上传失败:", err);
        }
      }
    })();
    return true;
  }

  /** 拦截拖拽：检测拖入的图片/文件，调用上传函数并插入 */
  private handleDrop(event: DragEvent): boolean {
    if (!this.imageUploadFn && !this.fileUploadFn) return false;
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return false;
    event.preventDefault();
    void (async () => {
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/") && this.imageUploadFn) {
          if (file.size > this.imageMaxSizeBytes) continue;
          try {
            const url = await this.imageUploadFn(file);
            if (url) this.editor?.chain().focus().setImage({ src: url }).run();
          } catch (err) {
            console.error("[sEditor] 拖拽图片上传失败:", err);
          }
        } else if (this.fileUploadFn) {
          try {
            const url = await this.fileUploadFn(file);
            if (url) {
              commandRegistry.run(this.editor!, "file", {
                src: url,
                name: file.name,
                download: true,
              });
            }
          } catch (err) {
            console.error("[sEditor] 拖拽文件上传失败:", err);
          }
        }
      }
    })();
    return true;
  }

  /** 调度草稿保存（防抖：仅记录最新 html，定时器统一刷盘） */
  private scheduleDraftSave(html: string): void {
    if (!this.draftKey) return;
    this._pendingDraft = html;
  }
  private _pendingDraft: string | null = null;

  private saveDraft(): void {
    if (!this.draftKey) return;
    const html = this._pendingDraft ?? this.editor?.getHTML() ?? "";
    if (!html) return;
    try {
      localStorage.setItem(this.draftKey, html);
      this._pendingDraft = null;
    } catch {
      // localStorage 满 / 不可用时静默忽略
    }
  }

  /** 清除草稿（用户主动保存或重置后调用） */
  clearDraft(): void {
    if (!this.draftKey) return;
    try {
      localStorage.removeItem(this.draftKey);
      this._pendingDraft = null;
    } catch {
      /* ignore */
    }
  }

  /** 是否从草稿恢复 */
  hasRestoredDraft(): boolean {
    return this.draftRestored;
  }

  private onStateChange(state: EditorUIState): void {
    // 全屏切换
    if (state.isFullscreen) {
      this.root.classList.add("fixed", "inset-0", "z-50", "rounded-none", "border-0");
    } else {
      this.root.classList.remove("fixed", "inset-0", "z-50", "rounded-none", "border-0");
    }

    // 源码模式切换
    if (state.isSourceMode) {
      this.sourceView.enter();
      this.editorWrap.style.display = "none";
      this.frame.appendChild(this.sourceView.getElement());
    } else {
      if (this.sourceView.getElement().parentElement) {
        this.sourceView.exit();
        this.sourceView.getElement().remove();
      }
      this.editorWrap.style.display = "";
    }

    // 对话框
    if (state.activeDialog) {
      this.dialogMgr.open(state.activeDialog);
    } else {
      this.dialogMgr.close();
    }
  }

  getEditor(): Editor | null {
    return this.editor;
  }

  getHTML(): string {
    return this.editor?.getHTML() ?? "";
  }

  setHTML(html: string): void {
    this.editor?.commands.setContent(html);
  }

  getText(): string {
    return this.editor?.getText() ?? "";
  }

  setText(text: string): void {
    this.editor?.commands.setContent(text);
  }

  focus(): void {
    this.editor?.commands.focus();
  }

  blur(): void {
    this.editor?.commands.blur();
  }

  insertImage(src: string, opts?: { alt?: string; width?: number | string }): void {
    if (!this.editor) return;
    const attrs: Record<string, unknown> = { src };
    if (opts?.alt) attrs.alt = opts.alt;
    if (opts?.width != null) attrs.width = opts.width;
    this.editor.chain().focus().setImage(attrs as { src: string; alt?: string }).run();
  }

  /** 插入文件下载链接 */
  insertFile(src: string, opts?: { name?: string; download?: boolean }): void {
    if (!this.editor) return;
    commandRegistry.run(this.editor, "file", {
      src,
      name: opts?.name,
      download: opts?.download ?? true,
    });
  }

  /** 导出为 Markdown 文件 */
  exportMarkdown(filename?: string): void {
    exportMarkdown(this.getHTML(), filename);
  }

  /** 导出为 Word（.doc）文件 */
  exportWord(filename?: string): void {
    exportWord(this.getHTML(), filename);
  }

  /** 导出为 PDF（通过浏览器打印对话框） */
  exportPDF(filename?: string): void {
    exportPDF(this.getHTML(), filename);
  }

  exec(command: string, payload?: unknown): void {
    if (!this.editor) return;
    // 导出伪命令
    if (command === "__export_md__") return this.exportMarkdown(typeof payload === "string" ? payload : undefined);
    if (command === "__export_word__") return this.exportWord(typeof payload === "string" ? payload : undefined);
    if (command === "__export_pdf__") return this.exportPDF(typeof payload === "string" ? payload : undefined);
    // 优先路由到 commandRegistry（覆盖 image/file/table/link 等自定义命令）
    const cmd = commandRegistry.get(command);
    if (cmd) {
      cmd.run(this.editor, payload);
      return;
    }
    // 回退到 TipTap 原生命令
    const commands = this.editor.commands as unknown as Record<string, (...args: unknown[]) => void>;
    const nativeCmd = commands[command];
    if (typeof nativeCmd === "function") {
      if (payload !== undefined) nativeCmd.call(this.editor.commands, payload);
      else nativeCmd.call(this.editor.commands);
    }
  }

  destroy(): void {
    // 卸载前同步保存草稿
    if (this.draftTimer) {
      clearInterval(this.draftTimer);
      this.draftTimer = undefined;
    }
    this.saveDraft();
    this.cleanups.forEach((fn) => fn());
    this.toolbar.destroy();
    this.statusBar.destroy();
    this.contextMenu.destroy();
    this.tableBubble.destroy();
    this.linkBubble.destroy();
    this.slashMenu.destroy();
    this.dialogMgr.destroy();
    this.sourceView.destroy();
    this.editor?.destroy();
    this.editor = null;
    this.root.remove();
  }
}
