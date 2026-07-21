import type { Editor } from "@tiptap/core";
import type { ErrorContext } from "./core/logger";
import type { I18nMessages } from "./core/i18n";

/** 编辑器对外配置 */
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
  /** 上传前是否压缩图片；true 时使用默认参数，也可传入自定义参数 */
  imageCompress?: boolean | { maxWidth?: number; maxHeight?: number; quality?: number; type?: "image/jpeg" | "image/webp" };
  /** 自定义文件上传函数，返回文件 URL（用于插入文件下载链接） */
  fileUpload?: (file: File) => Promise<string>;
  /** 单个文件最大字节数，默认 20MB */
  fileMaxSize?: number;
  /** 允许的文件扩展名白名单（小写，不含点）。默认 null 表示不限制 */
  fileAllowedExts?: string[] | null;
  /** 自动保存草稿的存储 key。设置后启用自动保存（localStorage）。默认不启用 */
  draftKey?: string;
  /** 自动保存间隔（毫秒），默认 3000 */
  draftInterval?: number;
  /** 主题：light / dark / auto。auto 跟随系统。默认 light */
  theme?: "light" | "dark" | "auto";
  /** 界面语言标识，当前仅作为元数据，配合 localeData 使用 */
  locale?: string;
  /** 自定义翻译覆盖，key 见 editor/core/i18n.ts */
  localeData?: Partial<I18nMessages>;
  onChange?: (html: string) => void;
  /** 编辑器实例就绪后回调（浏览器打包场景下用于获取 Editor 实例） */
  onEditorReady?: (editor: Editor) => void;
  /** 错误回调，上传/导出等异常时触发。未配置时降级到 console.error */
  onError?: (error: Error, context: ErrorContext) => void;
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
  /** 段落数 */
  paragraphs: number;
  /** 预计阅读时长（分钟） */
  readingTime: number;
}

/** 图片插入选项 */
export interface ImageOptions {
  width?: number | string;
  height?: number | string;
  align?: "left" | "center" | "right";
  alt?: string;
}

/** 文件插入选项 */
export interface FileInsertOptions {
  /** 文件名（用于展示文本，可选） */
  name?: string;
  /** 下载属性（默认 true） */
  download?: boolean;
}

/** 视频/音频插入选项 */
export interface MediaOptions {
  src: string;
  width?: string | number;
  controls?: boolean;
}

/** 弹窗类型 */
export type DialogType =
  | "link"
  | "image"
  | "file"
  | "table"
  | "specialChar"
  | "video"
  | "audio"
  | "emoji"
  | "findReplace"
  | "music"
  | "chart"
  | "graffiti"
  | "remoteImage"
  | null;
