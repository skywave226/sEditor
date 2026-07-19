/**
 * 运行时配置：浏览器 IIFE 打包场景下，从 window.sEditorConfig 读取用户可配置项。
 * 若未配置则使用默认值。开发模式（vite dev）下同样可用。
 */

export interface FontOption {
  label: string;
  value: string;
}

export interface SizeOption {
  label: string;
  value: string;
}

export interface SEditorGlobalConfig {
  fonts?: FontOption[];
  fontSizes?: SizeOption[];
  colors?: string[];
  highlightColors?: string[];
  lineHeights?: SizeOption[];
  placeholder?: string;
  height?: number | string;
}

const DEFAULT_FONTS: FontOption[] = [
  { label: "默认", value: "" },
  { label: "宋体", value: "SimSun, STSong, serif" },
  { label: "黑体", value: "SimHei, STHeiti, sans-serif" },
  { label: "楷体", value: "KaiTi, STKaiti, serif" },
  { label: "微软雅黑", value: "Microsoft YaHei, sans-serif" },
  { label: "仿宋", value: "FangSong, STFangsong, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
  { label: "Courier New", value: '"Courier New", monospace' },
];

const DEFAULT_FONT_SIZES: SizeOption[] = [
  { label: "默认", value: "" },
  { label: "12", value: "12px" },
  { label: "13", value: "13px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
  { label: "48", value: "48px" },
];

const DEFAULT_COLORS: string[] = [
  "#000000", "#444444", "#666666", "#999999", "#cccccc", "#ffffff",
  "#ff0000", "#ff8a00", "#ffce00", "#39b54a", "#00a0e9", "#0052d9",
  "#7b49d8", "#e9539b", "#c7254e", "#8b4513", "#2f4f4f", "#556b2f",
];

const DEFAULT_HIGHLIGHT_COLORS: string[] = [
  "transparent", "#ffff00", "#ffce00", "#ff8a00", "#ff0000", "#ff69b4",
  "#39b54a", "#00a0e9", "#0052d9", "#7b49d8", "#e9539b", "#cccccc",
];

const DEFAULT_LINE_HEIGHTS: SizeOption[] = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "1.75", value: "1.75" },
  { label: "2.0", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3.0", value: "3" },
];

declare global {
  interface Window {
    sEditorConfig?: SEditorGlobalConfig;
  }
}

export function getGlobalConfig(): SEditorGlobalConfig {
  if (typeof window !== "undefined" && window.sEditorConfig) {
    return window.sEditorConfig;
  }
  return {};
}

export function getFonts(): FontOption[] {
  return getGlobalConfig().fonts ?? DEFAULT_FONTS;
}

export function getFontSizes(): SizeOption[] {
  return getGlobalConfig().fontSizes ?? DEFAULT_FONT_SIZES;
}

export function getColors(): string[] {
  return getGlobalConfig().colors ?? DEFAULT_COLORS;
}

export function getHighlightColors(): string[] {
  return getGlobalConfig().highlightColors ?? DEFAULT_HIGHLIGHT_COLORS;
}

export function getLineHeights(): SizeOption[] {
  return getGlobalConfig().lineHeights ?? DEFAULT_LINE_HEIGHTS;
}

export function getPlaceholder(): string {
  return getGlobalConfig().placeholder ?? "在此输入正文内容……";
}

export function getHeight(): number | string {
  return getGlobalConfig().height ?? 300;
}
