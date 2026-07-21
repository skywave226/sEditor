/**
 * 轻量级国际化机制。
 *
 * - 默认语言为中文（与现有 UI 一致）。
 * - 通过 EditorConfig.localeData 可覆盖任意 key，实现自定义翻译。
 * - 通过 EditorConfig.locale 可标识语言，当前仅作为元数据使用。
 */

const defaultMessages = {
  // 编辑器占位符
  "editor.placeholder": "在此输入正文内容……",

  // 工具栏按钮（id 与 toolbar.ts 中保持一致）
  "toolbar.undo": "撤销 (Ctrl+Z)",
  "toolbar.redo": "重做 (Ctrl+Y)",
  "toolbar.copy": "复制 (Ctrl+C)",
  "toolbar.cut": "剪切 (Ctrl+X)",
  "toolbar.paste": "粘贴 (Ctrl+V)",
  "toolbar.pastePlainText": "粘贴为纯文本 (Ctrl+Shift+V)",
  "toolbar.heading": "段落格式",
  "toolbar.fontFamily": "字体",
  "toolbar.fontSize": "字号",
  "toolbar.bold": "加粗 (Ctrl+B)",
  "toolbar.italic": "斜体 (Ctrl+I)",
  "toolbar.underline": "下划线 (Ctrl+U)",
  "toolbar.strike": "删除线 (Ctrl+Shift+X)",
  "toolbar.subscript": "下标 (Ctrl+,)",
  "toolbar.superscript": "上标 (Ctrl+.)",
  "toolbar.color": "文字颜色",
  "toolbar.highlight": "背景色",
  "toolbar.alignLeft": "左对齐 (Ctrl+Shift+L)",
  "toolbar.alignCenter": "居中 (Ctrl+Shift+E)",
  "toolbar.alignRight": "右对齐 (Ctrl+Shift+R)",
  "toolbar.alignJustify": "两端对齐 (Ctrl+Shift+J)",
  "toolbar.bulletList": "无序列表 (Ctrl+Shift+8)",
  "toolbar.orderedList": "有序列表 (Ctrl+Shift+7)",
  "toolbar.indent": "增加缩进 (Tab)",
  "toolbar.outdent": "减少缩进 (Shift+Tab)",
  "toolbar.lineHeight": "行距",
  "toolbar.blockquote": "引用 (Ctrl+Shift+B)",
  "toolbar.codeBlock": "代码块 (Ctrl+Alt+C)",
  "toolbar.codeLanguage": "语言",
  "toolbar.link": "超链接 (Ctrl+K)",
  "toolbar.unlink": "取消链接",
  "toolbar.image": "图片",
  "toolbar.imageAlignNone": "图片默认",
  "toolbar.imageAlignLeft": "图片左浮动",
  "toolbar.imageAlignCenter": "图片居中",
  "toolbar.imageAlignRight": "图片右浮动",
  "toolbar.video": "视频",
  "toolbar.audio": "音频",
  "toolbar.file": "文件",
  "toolbar.table": "表格",
  "toolbar.horizontalRule": "分割线 (---)",
  "toolbar.specialChar": "特殊字符",
  "toolbar.emoji": "Emoji 表情",
  "toolbar.music": "音乐",
  "toolbar.chart": "图表",
  "toolbar.screenshot": "截图",
  "toolbar.graffiti": "涂鸦",
  "toolbar.remoteImage": "远程图片",
  "toolbar.saveImage": "保存图片",
  "toolbar.template": "模板",
  "toolbar.insertTime": "插入时间",
  "toolbar.insertDate": "插入日期",
  "toolbar.selectAll": "全选 (Ctrl+A)",
  "toolbar.clearDocument": "清空文档",
  "toolbar.print": "打印",
  "toolbar.preview": "预览",
  "toolbar.findReplace": "查找替换 (Ctrl+F)",
  "toolbar.export": "导出",
  "toolbar.removeFormat": "清除格式 (Ctrl+\\)",
  "toolbar.paragraphSpacingBefore": "段前距",
  "toolbar.paragraphSpacingAfter": "段后距",
  "toolbar.textDirection": "文字方向",
  "toolbar.characterBorder": "字符边框",
  "toolbar.pageBreak": "分页符",
  "toolbar.iframe": "插入 iframe",
  "toolbar.anchor": "插入锚点",
  "toolbar.textCase": "字母大小写",
  "toolbar.formatPainterCopy": "格式刷复制",
  "toolbar.formatPainterApply": "格式刷应用",
  "toolbar.autoFormat": "自动排版",
  "toolbar.backgroundColor": "背景色",
  "toolbar.sourceToggle": "源码",
  "toolbar.fullscreenToggle": "全屏 (F11)",
  "toolbar.more": "更多",

  // 下拉面板公共
  "dropdown.default": "默认",
  "dropdown.heading.paragraph": "正文",
  "dropdown.heading.h1": "标题 1",
  "dropdown.heading.h2": "标题 2",
  "dropdown.heading.h3": "标题 3",
  "dropdown.heading.h4": "标题 4",
  "dropdown.heading.h5": "标题 5",
  "dropdown.heading.h6": "标题 6",
  "dropdown.textDirection.ltr": "从左到右",
  "dropdown.textDirection.rtl": "从右到左",
  "dropdown.textCase.upper": "大写",
  "dropdown.textCase.lower": "小写",
  "dropdown.textCase.capitalize": "首字母大写",
  "dropdown.paragraphSpacing.default": "默认",
  "dropdown.export.md": "导出 Markdown (.md)",
  "dropdown.export.word": "导出 Word (.doc)",
  "dropdown.export.pdf": "导出 PDF（打印）",
  "dropdown.codeLanguage.plain": "纯文本",
  "dropdown.codeLanguage.javascript": "JavaScript",
  "dropdown.codeLanguage.typescript": "TypeScript",
  "dropdown.codeLanguage.html": "HTML",
  "dropdown.codeLanguage.css": "CSS",
  "dropdown.codeLanguage.python": "Python",
  "dropdown.codeLanguage.java": "Java",
  "dropdown.codeLanguage.json": "JSON",
  "dropdown.codeLanguage.sql": "SQL",
  "dropdown.codeLanguage.bash": "Bash",
  "dropdown.color.title": "文字颜色",
  "dropdown.color.clear": "清除颜色",
  "dropdown.highlight.title": "背景颜色",
  "dropdown.highlight.clear": "清除背景",
  "dropdown.backgroundColor.title": "页面背景色",
  "dropdown.backgroundColor.clear": "清除背景",

  // 状态栏
  "status.path": "路径:",
  "status.words": "字数",
  "status.chars": "字符",
  "status.paragraphs": "段落",
  "status.reading": "阅读",
  "status.minutes": "{{minutes}} 分钟",
  "blockLabel.paragraph": "正文",
  "blockLabel.heading": "标题 {{level}}",
  "blockLabel.blockquote": "引用",
  "blockLabel.codeBlock": "代码块",
  "blockLabel.bulletList": "无序列表",
  "blockLabel.orderedList": "有序列表",
  "blockLabel.listItem": "列表项",
  "blockLabel.table": "表格",
  "blockLabel.tableRow": "行",
  "blockLabel.tableCell": "单元格",
  "blockLabel.tableHeader": "表头",
  "markLabel.bold": "加粗",
  "markLabel.italic": "斜体",
  "markLabel.underline": "下划线",
  "markLabel.strike": "删除线",
  "markLabel.link": "链接",
  "markLabel.code": "行内代码",

  // 右键菜单
  "contextMenu.cut": "剪切",
  "contextMenu.copy": "复制",
  "contextMenu.paste": "粘贴",
  "contextMenu.selectAll": "全选",
  "contextMenu.editLink": "编辑链接",
  "contextMenu.unlink": "取消链接",
  "contextMenu.addRowBefore": "上方插入行",
  "contextMenu.addRowAfter": "下方插入行",
  "contextMenu.addColumnBefore": "左侧插入列",
  "contextMenu.addColumnAfter": "右侧插入列",
  "contextMenu.deleteRow": "删除行",
  "contextMenu.deleteColumn": "删除列",
  "contextMenu.mergeCells": "合并单元格",
  "contextMenu.splitCell": "拆分单元格",
  "contextMenu.deleteTable": "删除表格",

  // 链接浮层
  "linkBubble.edit": "编辑链接",
  "linkBubble.unlink": "取消链接",

  // 表格浮层
  "tableBubble.addRowBefore": "上方插入行",
  "tableBubble.addRowAfter": "下方插入行",
  "tableBubble.addColumnBefore": "左侧插入列",
  "tableBubble.addColumnAfter": "右侧插入列",
  "tableBubble.deleteRow": "删除行",
  "tableBubble.deleteColumn": "删除列",
  "tableBubble.mergeCells": "合并单元格",
  "tableBubble.splitCell": "拆分单元格",
  "tableBubble.toggleHeaderRow": "切换表头行",
  "tableBubble.toggleHeaderColumn": "切换表头列",
  "tableBubble.deleteTable": "删除表格",

  // / 命令面板
  "slash.h1.label": "一级标题",
  "slash.h1.description": "大标题",
  "slash.h2.label": "二级标题",
  "slash.h2.description": "中标题",
  "slash.h3.label": "三级标题",
  "slash.h3.description": "小标题",
  "slash.paragraph.label": "正文",
  "slash.paragraph.description": "普通段落",
  "slash.bulletList.label": "无序列表",
  "slash.bulletList.description": "• 项目符号列表",
  "slash.orderedList.label": "有序列表",
  "slash.orderedList.description": "1. 编号列表",
  "slash.blockquote.label": "引用",
  "slash.blockquote.description": "> 引用块",
  "slash.codeBlock.label": "代码块",
  "slash.codeBlock.description": "``` 代码块",
  "slash.horizontalRule.label": "分割线",
  "slash.horizontalRule.description": "--- 水平线",
  "slash.table.label": "表格",
  "slash.table.description": "插入表格",
  "slash.empty": "无匹配命令",

  // 对话框公共
  "dialog.common.cancel": "取消",
  "dialog.common.confirm": "确定",
  "dialog.common.close": "关闭",
  "dialog.common.uploading": "上传中…",
  "dialog.common.uploadError": "上传失败：{{message}}",

  // 超链接对话框
  "dialog.link.title": "超链接",
  "dialog.link.href": "链接地址",
  "dialog.link.text": "链接文本",
  "dialog.link.target": "打开方式",
  "dialog.link.targetBlank": "新窗口",
  "dialog.link.targetSelf": "当前窗口",
  "dialog.link.remove": "取消已有链接",
  "dialog.link.urlPlaceholder": "https://",
  "dialog.link.textPlaceholder": "（可选）",

  // 图片对话框
  "dialog.image.title": "插入图片",
  "dialog.image.tabUpload": "本地上传",
  "dialog.image.tabUrl": "网络图片",
  "dialog.image.noUpload": "未配置 imageUpload 上传接口，仅支持网络图片地址。",
  "dialog.image.multiTip": "可按住 Ctrl/Shift 多选，所有图片将依次插入。",
  "dialog.image.singleTip": "每次仅可选择一张图片。",
  "dialog.image.noUploadAbility": "未配置上传能力，请使用 URL 插入。",
  "dialog.image.uploading": "上传中… ({{current}}/{{total}})",
  "dialog.image.invalid": "以下文件将被跳过：{{list}}",
  "dialog.image.invalidType": "非图片",
  "dialog.image.invalidSize": "超过 {{size}}MB",
  "dialog.image.uploadError": "上传失败：{{message}}",
  "dialog.image.invalidReturn": "上传返回值无效",
  "dialog.image.invalidReturnIndex": "第 {{index}} 张图片上传返回值无效",
  "dialog.image.preview": "图片预览",
  "dialog.image.urlPlaceholder": "https://",
  "dialog.image.fileLabel": "选择文件",
  "dialog.image.urlLabel": "图片地址",
  "dialog.image.altLabel": "替代文本",
  "dialog.image.altPlaceholder": "（可选）",
  "dialog.image.widthLabel": "宽度（px 或 %）",
  "dialog.image.widthPlaceholder": "如 400 或 100%",
  "dialog.image.heightLabel": "高度（px 或 %）",
  "dialog.image.heightPlaceholder": "如 300 或 100%",
  "dialog.image.lockRatio": "锁定宽高比",
  "dialog.image.align": "对齐方式",
  "dialog.image.alignLeft": "左对齐",
  "dialog.image.alignCenter": "居中",
  "dialog.image.alignRight": "右对齐",

  // 文件对话框
  "dialog.file.title": "插入文件",
  "dialog.file.close": "关闭",
  "dialog.file.noUpload": "未配置 fileUpload 函数，无法使用文件上传功能。",
  "dialog.file.sizeLimit": "单文件上限 {{size}}MB{{extensions}}。上传成功后将作为下载链接插入。",
  "dialog.file.supportedExts": "，仅支持 {{extensions}}",
  "dialog.file.fileLabel": "选择文件",
  "dialog.file.uploading": "上传中…",
  "dialog.file.oversize": "超过 {{size}}MB",
  "dialog.file.unsupportedExt": "不支持 .{{ext}}",
  "dialog.file.noUploadAbility": "未配置上传能力",
  "dialog.file.invalidReturn": "上传返回值无效",
  "dialog.file.inserted": "已插入",
  "dialog.file.failed": "失败：{{message}}",

  // 表格对话框
  "dialog.table.title": "插入表格",
  "dialog.table.rows": "行数",
  "dialog.table.cols": "列数",
  "dialog.table.header": "表头",
  "dialog.table.withHeader": "包含表头行",

  // 特殊字符对话框
  "dialog.specialChar.title": "特殊字符",
  "dialog.specialChar.group.common": "常用",
  "dialog.specialChar.group.math": "数学",
  "dialog.specialChar.group.unit": "单位",
  "dialog.specialChar.group.arrow": "箭头",
  "dialog.specialChar.group.greek": "希腊",
  "dialog.specialChar.tip": "点击字符插入，可连续插入多个。",

  // 视频对话框
  "dialog.video.title": "插入视频",
  "dialog.video.tabUrl": "网络视频",
  "dialog.video.tabUpload": "本地上传",
  "dialog.video.noUpload": "未配置 fileUpload 上传接口，仅支持网络视频地址。",
  "dialog.video.urlLabel": "视频地址",
  "dialog.video.fileLabel": "选择视频文件",
  "dialog.video.widthLabel": "宽度（px 或 %，可选）",
  "dialog.video.widthPlaceholder": "如 480 或 100%",
  "dialog.video.urlPlaceholder": "https://",

  // 音频对话框
  "dialog.audio.title": "插入音频",
  "dialog.audio.tabUrl": "网络音频",
  "dialog.audio.tabUpload": "本地上传",
  "dialog.audio.noUpload": "未配置 fileUpload 上传接口，仅支持网络音频地址。",
  "dialog.audio.urlLabel": "音频地址",
  "dialog.audio.fileLabel": "选择音频文件",
  "dialog.audio.urlPlaceholder": "https://",

  // Emoji 对话框
  "dialog.emoji.title": "Emoji 表情",
  "dialog.emoji.group.emoji": "表情",
  "dialog.emoji.group.gesture": "手势",
  "dialog.emoji.group.animal": "动物",
  "dialog.emoji.group.food": "食物",
  "dialog.emoji.group.object": "物品",

  // 查找替换对话框
  "dialog.findReplace.title": "查找与替换",
  "dialog.findReplace.find": "查找",
  "dialog.findReplace.findPlaceholder": "输入要查找的内容",
  "dialog.findReplace.replace": "替换为",
  "dialog.findReplace.replacePlaceholder": "输入替换为的内容",
  "dialog.findReplace.matchCase": "区分大小写",
  "dialog.findReplace.found": "找到 {{count}} 处匹配",
  "dialog.findReplace.notFound": "未找到匹配",
  "dialog.findReplace.current": "第 {{current}} / {{total}} 处",
  "dialog.findReplace.replacedAll": "已替换 {{count}} 处",
  "dialog.findReplace.allDone": "全部替换完成",
  "dialog.findReplace.findNext": "查找下一个",
  "dialog.findReplace.replaceBtn": "替换",
  "dialog.findReplace.replaceAll": "全部替换",

  // iframe 对话框
  "dialog.iframe.title": "插入 iframe",
  "dialog.iframe.src": "页面地址",
  "dialog.iframe.width": "宽度",
  "dialog.iframe.height": "高度",
  "dialog.iframe.srcPlaceholder": "https://",
  "dialog.iframe.widthPlaceholder": "如 100% 或 480",
  "dialog.iframe.heightPlaceholder": "如 300",

  // 锚点对话框
  "dialog.anchor.title": "插入锚点",
  "dialog.anchor.id": "锚点 ID",
  "dialog.anchor.idPlaceholder": "唯一标识，如 section-1",
  "dialog.anchor.name": "名称",
  "dialog.anchor.namePlaceholder": "（可选）显示名称",

  // 音乐对话框
  "dialog.music.title": "插入音乐",
  "dialog.music.tabUrl": "网络音频",
  "dialog.music.tabUpload": "本地上传",
  "dialog.music.noUpload": "未配置 fileUpload 上传接口，仅支持网络音频地址。",
  "dialog.music.urlLabel": "音频地址",
  "dialog.music.fileLabel": "选择音乐文件",
  "dialog.music.name": "名称",
  "dialog.music.namePlaceholder": "（可选）歌曲名称",
  "dialog.music.artist": "艺术家",
  "dialog.music.artistPlaceholder": "（可选）艺术家",
  "dialog.music.urlPlaceholder": "https://",

  // 图表对话框
  "dialog.chart.title": "插入图表",
  "dialog.chart.type": "图表类型",
  "dialog.chart.typeBar": "柱状图",
  "dialog.chart.typeLine": "折线图",
  "dialog.chart.typePie": "饼图",
  "dialog.chart.titleLabel": "标题",
  "dialog.chart.titlePlaceholder": "（可选）",
  "dialog.chart.labels": "标签（逗号分隔）",
  "dialog.chart.labelsPlaceholder": "如 一月,二月,三月",
  "dialog.chart.values": "数值（逗号分隔）",
  "dialog.chart.valuesPlaceholder": "如 10,20,30",
  "dialog.chart.colors": "颜色（逗号分隔，可选）",
  "dialog.chart.colorsPlaceholder": "如 #3b82f6,#ef4444",

  // 涂鸦对话框
  "dialog.graffiti.title": "涂鸦",
  "dialog.graffiti.clear": "清空",

  // 远程图片对话框
  "dialog.remoteImage.title": "远程图片",
  "dialog.remoteImage.urlLabel": "图片地址",
  "dialog.remoteImage.urlPlaceholder": "https://",
  "dialog.remoteImage.tip": "会尝试下载图片并转为本地 dataURL，受目标站 CORS 策略限制。",

  // 导出
  "export.printBlocked": "[sEditor] 弹出打印窗口被浏览器拦截，请允许弹窗后重试。",

  // 图片浮动工具栏
  "imageToolbar.alignNone": "默认",
  "imageToolbar.alignLeft": "左浮动",
  "imageToolbar.alignCenter": "居中",
  "imageToolbar.alignRight": "右浮动",
  "imageToolbar.delete": "删除图片",

  // 节点默认文本
  "node.musicFallback": "音乐",
  "node.anchorFallback": "锚点",
  "node.chartFallback": "图表",
} as const;

export type I18nMessages = typeof defaultMessages;
export type I18nMessagesKey = keyof I18nMessages;

export interface I18n {
  locale: string;
  t<K extends keyof I18nMessages>(key: K, vars?: Record<string, string | number>): string;
}

export interface I18nOptions {
  locale?: string;
  localeData?: Partial<I18nMessages>;
}

export function createI18n(options?: I18nOptions): I18n {
  const locale = options?.locale ?? "zh-CN";
  const overrides = options?.localeData ?? {};
  const messages = { ...defaultMessages, ...overrides } as I18nMessages;

  return {
    locale,
    t(key, vars) {
      let text = (messages as Record<string, string>)[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        }
      }
      return text;
    },
  };
}
