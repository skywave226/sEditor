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
  /** 启用工具栏响应式折叠：默认 false（全部按钮直接展示，允许换行） */
  toolbarResponsive?: boolean;
  /** 自定义图片上传函数，返回图片 URL（单张） */
  imageUpload?: (file: File) => Promise<string>;
  /** 单张图片最大字节数，默认 5MB */
  imageMaxSize?: number;
  /** 是否允许多图上传（一次选择多个文件），默认 true */
  imageMultiUpload?: boolean;
  /** 自定义文件上传函数，返回文件 URL（用于插入文件下载链接） */
  fileUpload?: (file: File) => Promise<string>;
  /** 单个文件最大字节数，默认 20MB */
  fileMaxSize?: number;
  /** 允许的文件扩展名白名单（小写，不含点）。默认 null 表示不限制 */
  fileAllowedExts?: string[] | null;
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
  insertFile(src: string, opts?: { name?: string; download?: boolean }): void;
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
