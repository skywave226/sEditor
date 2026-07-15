import type { Editor } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";

/** 编辑器对外配置 */
export interface EditorConfig {
  initialContent?: string;
  placeholder?: string;
  height?: number | string;
  toolbar?: string[] | false;
  imageUpload?: (file: File) => Promise<string>;
  onChange?: (html: string) => void;
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

/** 工具栏按钮定义 */
export interface ToolbarButtonItem {
  type: "button";
  id: string;
  icon: LucideIcon;
  label: string;
  command: string;
  payload?: unknown;
  /** 部分按钮需要特殊样式（如源码切换） */
  variant?: "default" | "toggle";
}

/** 工具栏分隔符 */
export interface ToolbarDividerItem {
  type: "divider";
  id: string;
}

/** 工具栏下拉定义 */
export interface ToolbarDropdownItem {
  type: "dropdown";
  id: string;
  /** 下拉类型标识，由 Toolbar 内部映射到具体组件 */
  dropdown:
    | "heading"
    | "fontFamily"
    | "fontSize"
    | "color"
    | "highlight"
    | "lineHeight";
  label: string;
  width?: number;
}

export type ToolbarItem =
  | ToolbarButtonItem
  | ToolbarDividerItem
  | ToolbarDropdownItem;

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
