import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Quote,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Eraser,
  Code,
  Maximize2,
  CaseSensitive,
} from "lucide-react";
import type { ToolbarItem } from "../types";

/**
 * 工具栏分组配置（仿 UEditor 经典布局）。
 * 每个分组之间自动插入分隔线。
 */
export const toolbarGroups: ToolbarItem[][] = [
  // 操作
  [
    { type: "button", id: "undo", icon: Undo2, label: "撤销", command: "undo" },
    { type: "button", id: "redo", icon: Redo2, label: "重做", command: "redo" },
  ],
  // 段落格式
  [{ type: "dropdown", id: "heading", dropdown: "heading", label: "段落格式", width: 120 }],
  // 字体 / 字号
  [
    { type: "dropdown", id: "fontFamily", dropdown: "fontFamily", label: "字体", width: 120 },
    { type: "dropdown", id: "fontSize", dropdown: "fontSize", label: "字号", width: 72 },
  ],
  // 文字样式
  [
    { type: "button", id: "bold", icon: Bold, label: "加粗", command: "bold" },
    { type: "button", id: "italic", icon: Italic, label: "斜体", command: "italic" },
    { type: "button", id: "underline", icon: Underline, label: "下划线", command: "underline" },
    { type: "button", id: "strike", icon: Strikethrough, label: "删除线", command: "strike" },
  ],
  // 颜色
  [
    { type: "dropdown", id: "color", dropdown: "color", label: "文字颜色", width: 36 },
    { type: "dropdown", id: "highlight", dropdown: "highlight", label: "背景色", width: 36 },
  ],
  // 对齐
  [
    { type: "button", id: "alignLeft", icon: AlignLeft, label: "左对齐", command: "alignLeft" },
    { type: "button", id: "alignCenter", icon: AlignCenter, label: "居中", command: "alignCenter" },
    { type: "button", id: "alignRight", icon: AlignRight, label: "右对齐", command: "alignRight" },
    { type: "button", id: "alignJustify", icon: AlignJustify, label: "两端对齐", command: "alignJustify" },
  ],
  // 列表
  [
    { type: "button", id: "bulletList", icon: List, label: "无序列表", command: "bulletList" },
    { type: "button", id: "orderedList", icon: ListOrdered, label: "有序列表", command: "orderedList" },
  ],
  // 缩进
  [
    { type: "button", id: "indent", icon: IndentIncrease, label: "增加缩进", command: "indent" },
    { type: "button", id: "outdent", icon: IndentDecrease, label: "减少缩进", command: "outdent" },
  ],
  // 行距
  [{ type: "dropdown", id: "lineHeight", dropdown: "lineHeight", label: "行距", width: 72 }],
  // 块级
  [
    { type: "button", id: "blockquote", icon: Quote, label: "引用", command: "blockquote" },
    { type: "button", id: "codeBlock", icon: Code2, label: "代码块", command: "codeBlock" },
  ],
  // 插入
  [
    { type: "button", id: "link", icon: LinkIcon, label: "超链接", command: "link" },
    { type: "button", id: "image", icon: ImageIcon, label: "图片", command: "image" },
    { type: "button", id: "table", icon: TableIcon, label: "表格", command: "table" },
    { type: "button", id: "horizontalRule", icon: Minus, label: "分割线", command: "horizontalRule" },
    { type: "button", id: "specialChar", icon: CaseSensitive, label: "特殊字符", command: "specialChar" },
  ],
  // 工具
  [{ type: "button", id: "removeFormat", icon: Eraser, label: "清除格式", command: "removeFormat" }],
  // 视图
  [
    { type: "button", id: "sourceToggle", icon: Code, label: "源码", command: "__source__", variant: "toggle" },
    { type: "button", id: "fullscreenToggle", icon: Maximize2, label: "全屏", command: "__fullscreen__", variant: "toggle" },
  ],
];
