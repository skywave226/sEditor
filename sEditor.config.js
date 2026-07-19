/**
 * sEditor 运行时配置文件
 * 在引入 sEditor.js 之前加载本文件，即可自定义字体、字号、颜色等选项。
 * 全局变量名固定为 window.sEditorConfig。
 */
window.sEditorConfig = {
  // 字体列表
  fonts: [
    { label: "默认", value: "" },
    { label: "宋体", value: "SimSun, STSong, serif" },
    { label: "黑体", value: "SimHei, STHeiti, sans-serif" },
    { label: "楷体", value: "KaiTi, STKaiti, serif" },
    { label: "微软雅黑", value: "Microsoft YaHei, sans-serif" },
    { label: "仿宋", value: "FangSong, STFangsong, serif" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Times New Roman", value: '"Times New Roman", serif' },
    { label: "Courier New", value: '"Courier New", monospace' },
  ],

  // 字号列表
  fontSizes: [
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
  ],

  // 文字颜色
  colors: [
    "#000000", "#444444", "#666666", "#999999", "#cccccc", "#ffffff",
    "#ff0000", "#ff8a00", "#ffce00", "#39b54a", "#00a0e9", "#0052d9",
    "#7b49d8", "#e9539b", "#c7254e", "#8b4513", "#2f4f4f", "#556b2f",
  ],

  // 背景高亮颜色（transparent 表示清除）
  highlightColors: [
    "transparent", "#ffff00", "#ffce00", "#ff8a00", "#ff0000", "#ff69b4",
    "#39b54a", "#00a0e9", "#0052d9", "#7b49d8", "#e9539b", "#cccccc",
  ],

  // 行距选项
  lineHeights: [
    { label: "1.0", value: "1" },
    { label: "1.15", value: "1.15" },
    { label: "1.5", value: "1.5" },
    { label: "1.75", value: "1.75" },
    { label: "2.0", value: "2" },
    { label: "2.5", value: "2.5" },
    { label: "3.0", value: "3" },
  ],

  // 默认占位提示文字
  placeholder: "在此输入正文内容……",

  // 默认编辑区高度（数字为 px，字符串可为 "100%" 等）
  height: 300,
};
