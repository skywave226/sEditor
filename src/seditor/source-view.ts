import type { Editor } from "@tiptap/core";
import { h } from "./dom";

/**
 * 源码模式：进入时读取 HTML，退出时写回。
 */
export class SourceView {
  private editor: Editor;
  private textarea: HTMLTextAreaElement;
  private entered = false;

  constructor(editor: Editor) {
    this.editor = editor;
    this.textarea = h("textarea", {
      className: "se-content h-full w-full resize-none border-0 bg-se-canvas p-4 font-mono text-[13px] text-se-ink outline-none",
    }) as HTMLTextAreaElement;
    (this.textarea as HTMLTextAreaElement).style.fontFamily = '"SFMono-Regular", Consolas, monospace';
    (this.textarea as HTMLTextAreaElement).spellcheck = false;
  }

  /** 进入源码模式 */
  enter(): void {
    if (this.entered) return;
    this.textarea.value = this.editor.getHTML();
    this.entered = true;
  }

  /** 退出源码模式，写回 HTML */
  exit(): void {
    if (!this.entered) return;
    this.editor.commands.setContent(this.textarea.value, false);
    this.entered = false;
  }

  getElement(): HTMLTextAreaElement {
    return this.textarea;
  }

  destroy(): void {
    this.textarea.remove();
  }
}
