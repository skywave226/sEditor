import { Editor } from "@tiptap/core";
import { buildExtensions } from "../editor/core/extensions";
import { ensureCommandsRegistered } from "../editor/commands/definitions";
import { getPlaceholder, getHeight } from "../editor/runtime-config";
import type { EditorConfig } from "../editor/types";
import { cn, h } from "./dom";
import { UIStore, type EditorUIState } from "./store";
import { Toolbar } from "./toolbar";
import { DialogManager } from "./dialogs";
import { ContextMenu } from "./context-menu";
import { StatusBar } from "./status-bar";
import { SourceView } from "./source-view";

export interface SEditorOptions extends EditorConfig {
  target: HTMLElement | string;
}

export class SEditor {
  private editor: Editor | null;
  private store: UIStore;
  private toolbar: Toolbar;
  private statusBar: StatusBar;
  private contextMenu: ContextMenu;
  private dialogMgr: DialogManager;
  private sourceView: SourceView;
  private root: HTMLElement;
  private frame: HTMLElement;
  private editorWrap: HTMLElement;
  private target: HTMLElement;
  private onChangeRef?: (html: string) => void;
  private onEditorReadyRef?: (editor: Editor) => void;
  private cleanups: (() => void)[] = [];

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

    ensureCommandsRegistered();

    this.store = new UIStore();

    // 创建编辑器
    const editor = new Editor({
      extensions: buildExtensions(options.placeholder ?? getPlaceholder()),
      content: options.initialContent ?? "",
      editorProps: { attributes: { class: "se-content" } },
      onUpdate: ({ editor }) => {
        this.onChangeRef?.(editor.getHTML());
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

    // 对话框管理
    this.dialogMgr = new DialogManager(editor, this.store, options);

    // 源码视图
    this.sourceView = new SourceView(editor);

    // 订阅 store 变化
    const unsub = this.store.subscribe((state) => this.onStateChange(state));
    this.cleanups.push(unsub);

    // ESC 退出全屏
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.store.getState().isFullscreen) {
        this.store.setFullscreen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    this.cleanups.push(() => document.removeEventListener("keydown", onKey));

    // 就绪回调
    this.onEditorReadyRef?.(editor);
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

  exec(command: string, payload?: unknown): void {
    if (!this.editor) return;
    const commands = this.editor.commands as unknown as Record<string, (...args: unknown[]) => void>;
    const cmd = commands[command];
    if (typeof cmd === "function") {
      if (payload !== undefined) cmd.call(this.editor.commands, payload);
      else cmd.call(this.editor.commands);
    }
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.toolbar.destroy();
    this.statusBar.destroy();
    this.contextMenu.destroy();
    this.dialogMgr.destroy();
    this.sourceView.destroy();
    this.editor?.destroy();
    this.editor = null;
    this.root.remove();
  }
}
