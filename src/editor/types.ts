import type { Editor } from "@tiptap/core";

/** 编辑器对外配置 */
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

/** 统一命令抽象：工具栏按钮通过命令名驱动编辑器 */
export interface EditorCommand {
  name: string;
  /** 当前是否可执行 */
  can: (editor: Editor) => boolean;
  /** 当前是否处于激活态 */
  isActive: (editor: Editor) => boolean;
  /** 执行命令 */
  run: (editor: Editor, payload?: unknown) => void;
}

/** 命令触发器（用于工具栏按钮） */
export type CommandRunner = (payload?: unknown) => void;

/** 字数统计结果 */
export interface WordCount {
  chars: number;
  words: number;
}

/** 图片插入选项 */
export interface ImageOptions {
  width?: number | string;
  align?: "left" | "center" | "right";
  alt?: string;
}

/** 弹窗类型 */
export type DialogType = "link" | "image" | "table" | "specialChar" | null;
