import type { Editor } from "@tiptap/core";

/**
 * sEditor 类型声明
 *
 * - 浏览器单文件引入：`<script src="./dist/sEditor.js">` → `window.sEditor.create(...)`
 * - 打包器场景：`import { create } from '@skywave226/seditor'`
 * - 样式：`import '@skywave226/seditor/dist/sEditor.css'`
 *
 * 注意：根目录 index.js 是 Node/SSR 环境的占位入口（调用 create 会抛错），
 * 真正的实现见 dist/sEditor.esm.js（ESM）与 dist/sEditor.js（IIFE）。
 */

export interface EditorConfig {
  initialContent?: string;
  placeholder?: string;
  height?: number | string;
  toolbar?: string[] | false;
  imageUpload?: (file: File) => Promise<string>;
  onChange?: (html: string) => void;
  /** 编辑器实例就绪后回调（浏览器打包场景下用于获取 Editor 实例） */
  onEditorReady?: (editor: Editor) => void;
}

export interface SEditorOptions extends EditorConfig {
  /** 挂载目标：选择器字符串或 DOM 节点 */
  target: HTMLElement | string;
}

export interface SEditorInstance {
  getHTML(): string;
  setHTML(html: string): void;
  getText(): string;
  setText(text: string): void;
  focus(): void;
  blur(): void;
  insertImage(src: string, opts?: { alt?: string; width?: number | string }): void;
  exec(command: string, payload?: unknown): void;
  destroy(): void;
  getEditor(): Editor | null;
}

/** 创建单个编辑器实例 */
export function create(options: SEditorOptions): SEditorInstance;

/** 批量挂载：扫描页面上所有匹配 selector 的元素（默认 [data-seditor]） */
export function createAll(selector?: string): SEditorInstance[];

export const version: string;

declare const _default: {
  version: string;
  create: typeof create;
  createAll: typeof createAll;
};
export default _default;
