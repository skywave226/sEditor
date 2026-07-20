import { SEditor, type SEditorOptions } from "./seditor/SEditor";
import type { Editor } from "@tiptap/core";
import "./index.css";
import "./styles/editor.css";

export type { SEditorOptions } from "./seditor/SEditor";
export type { EditorConfig } from "./editor/types";

export interface SEditorInstance {
  getHTML(): string;
  setHTML(html: string): void;
  getText(): string;
  setText(text: string): void;
  focus(): void;
  blur(): void;
  insertImage(src: string, opts?: { alt?: string; width?: number | string }): void;
  insertFile(src: string, opts?: { name?: string; download?: boolean }): void;
  exportMarkdown(filename?: string): void;
  exportWord(filename?: string): void;
  exportPDF(filename?: string): void;
  importMarkdown(md: string): void;
  clearDraft(): void;
  hasRestoredDraft(): boolean;
  exec(command: string, payload?: unknown): void;
  destroy(): void;
  getEditor(): Editor | null;
}

let _instanceCounter = 0;
const instances = new Map<number, SEditor>();

/**
 * 创建单个编辑器实例
 */
export function create(options: SEditorOptions): SEditorInstance {
  const editor = new SEditor(options);
  const id = ++_instanceCounter;
  instances.set(id, editor);
  return {
    getHTML: () => editor.getHTML(),
    setHTML: (html) => editor.setHTML(html),
    getText: () => editor.getText(),
    setText: (text) => editor.setText(text),
    focus: () => editor.focus(),
    blur: () => editor.blur(),
    insertImage: (src, opts) => editor.insertImage(src, opts),
    insertFile: (src, opts) => editor.insertFile(src, opts),
    exportMarkdown: (filename) => editor.exportMarkdown(filename),
    exportWord: (filename) => editor.exportWord(filename),
    exportPDF: (filename) => editor.exportPDF(filename),
    importMarkdown: (md) => editor.importMarkdown(md),
    clearDraft: () => editor.clearDraft(),
    hasRestoredDraft: () => editor.hasRestoredDraft(),
    exec: (command, payload) => editor.exec(command, payload),
    destroy: () => {
      editor.destroy();
      instances.delete(id);
    },
    getEditor: () => editor.getEditor(),
  };
}

/**
 * 批量挂载：扫描页面上所有 [data-seditor] 元素
 */
export function createAll(selector = "[data-seditor]"): SEditorInstance[] {
  const nodes = document.querySelectorAll<HTMLElement>(selector);
  const list: SEditorInstance[] = [];
  nodes.forEach((node) => {
    const opts: SEditorOptions = {
      target: node,
      placeholder: node.dataset.placeholder,
      height: node.dataset.height ? Number(node.dataset.height) : undefined,
      initialContent: node.dataset.initialContent,
    };
    list.push(create(opts));
  });
  return list;
}
