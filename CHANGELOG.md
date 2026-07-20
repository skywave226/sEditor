# 更新说明

## [2.6.0] - 2026-07-20

### 新增
- **音乐插入**：新增 `Music` 节点，支持音频地址、歌曲名、艺术家；工具栏新增「音乐」按钮与对话框。
- **图表插入**：新增 `Chart` 节点，支持柱状图 / 折线图 / 饼图，根据 labels / values 渲染为内联 SVG 图片；工具栏新增「图表」按钮与对话框。
- **屏幕截图**：新增 `screenshot` 命令，调用浏览器 `getDisplayMedia` 捕获屏幕并插入为图片。
- **涂鸦**：新增 `graffiti` 命令与对话框，提供画布、颜色、笔刷、清空，确认后插入为图片。
- **远程图片**：新增 `remoteImage` 命令与对话框，尝试下载远程图片并转为 dataURL 插入。
- **保存图片**：新增 `saveImage` 命令，将当前选中的图片下载到本地。
- **文档模板**：新增 `templates.ts` 与 `insertTemplate` 命令，工具栏新增「模板」下拉，可插入两栏文本、提示框、警告框、引用块、代码卡片等预设 HTML。
- **元素路径**：状态栏 `StatusBar` 已显示当前光标所在块级节点路径与激活 marks。
- **工程配置**：`EditorConfig` 已补齐图片上传、文件上传、多图上传、自动保存草稿、主题、高度、工具栏自定义、响应式折叠、生命周期回调等配置项。

### 变更
- `src/editor/core/extensions.ts` 注册 `Music` / `Chart`。
- `src/editor/commands/definitions.ts` 注册 v2.6.0 全部命令。
- `src/seditor/toolbar.ts` / `src/seditor/icons.ts` / `src/seditor/dialogs.ts` 增加对应按钮、图标与音乐 / 图表 / 涂鸦 / 远程图片对话框。
- `package.json` / `index.js` / `index.d.ts` 版本升至 2.6.0，并补齐 `draftKey` / `draftInterval` / `theme` 与实例 API 类型声明。

---

## [2.5.0] - 2026-07-20

### 新增
- **段前 / 段后距**：新增 `ParagraphSpacing` 扩展，为段落/标题增加 `paragraphSpacingBefore` / `paragraphSpacingAfter` 属性；工具栏新增「段前距 / 段后距」下拉。
- **文字方向**：新增 `TextDirection` 扩展，支持段落/标题设置 `dir="ltr" / "rtl"`；工具栏新增「文字方向」下拉。
- **字符边框**：新增 `CharacterBorder` Mark 扩展，给选中文本加 1px 实线边框。
- **分页符**：新增 `PageBreak` 节点，渲染为 `page-break-after: always` 的分页块。
- **iframe 插入**：新增 `Iframe` 节点与对话框，支持设置地址、宽度、高度。
- **锚点**：新增 `Anchor` 内联原子节点，作为文档内书签目标。
- **字母大小写**：新增「大写 / 小写 / 首字母大写」三个命令，对选中文本执行转换。
- **格式刷**：新增「格式刷复制 / 应用」命令，可复制当前选区 marks 并应用到新选区。
- **自动排版**：新增 `autoFormat` 命令，对选区或全文执行规范化（合并空格、全角空格转半角、连续标点转换等）。
- **页面背景色**：新增 `backgroundColor` 命令，通过工具栏下拉为编辑区设置背景色。

### 变更
- `src/editor/core/extensions.ts` 注册 `ParagraphSpacing` / `TextDirection` / `CharacterBorder` / `PageBreak` / `Iframe` / `Anchor`。
- `src/editor/commands/definitions.ts` 注册 v2.5.0 全部命令。
- `src/seditor/toolbar.ts` / `src/seditor/icons.ts` / `src/seditor/dialogs.ts` 增加对应按钮、图标与 iframe/锚点对话框。

### 测试
- `pnpm check` 0 错误；`pnpm test` 21/21 通过；`pnpm lint` 0 错误；`pnpm build:lib` 成功（sEditor.js 479.00 kB / sEditor.esm.js 705.97 kB）。

---

## [2.4.0] - 2026-07-20

### 新增
- **表格高级操作**：表格浮动工具栏 `TableBubble` 增加「上方插入行/下方插入行/左侧插入列/右侧插入列/删除行/删除列/合并单元格/拆分单元格/切换表头行/切换表头列/删除表格」全部能力，调用 TipTap Table 内置命令实现。
- **图片对齐**：`ResizableImage` 扩展新增 `align` 属性（none / left / right / center），图片 NodeView 根据对齐方式动态应用 `float` / `margin` / `display` 样式；工具栏新增「图片默认 / 左浮动 / 居中 / 右浮动」四个按钮，图片 hover 浮层也支持快速切换对齐。
- **下标 / 上标**：新增 `Subscript` / `Superscript` Mark 扩展，渲染为 `<sub>` / `<sup>`，支持工具栏按钮及快捷键 `Ctrl+,` / `Ctrl+.`。
- **取消链接**：工具栏新增「取消链接」按钮，调用 `unsetLink` 移除当前选区的超链接。
- **全选 / 清空文档**：工具栏新增「全选」和「清空文档」按钮，分别映射 `selectAll` / `clearContent`。
- **代码语言选择**：工具栏新增「语言」下拉，支持在代码块内切换语言（纯文本 / JavaScript / TypeScript / HTML / CSS / Python / Java / Go / Rust / SQL / Shell / JSON / XML / Markdown / YAML / Bash 等）。
- **打印 / 预览**：工具栏新增「打印」和「预览」按钮；打印调用 `window.print()`，预览打开新窗口展示当前 HTML 内容。
- **插入时间 / 日期**：工具栏新增「插入时间」和「插入日期」按钮，按 `HH:mm:ss` / `YYYY-MM-DD` 格式插入文本。

### 变更
- `ResizableImage.addCommands` 现在继承父扩展的 `setImage` 命令，避免自定义 NodeView 覆盖后丢失 `setImage`；同时新增 `setImageAlign` 命令并正确声明模块类型。
- `src/editor/core/extensions.ts` 注册 `Subscript` / `Superscript`。
- `src/editor/commands/definitions.ts` 注册 `subscript` / `superscript` / `unlink` / `imageAlignNone/Left/Center/Right` / `selectAll` / `clearDocument` / `codeBlockLang` / `insertTime` / `insertDate` / `print` / `preview` / 表格相关命令。
- `src/seditor/toolbar.ts` 与 `src/seditor/icons.ts` 增加对应按钮与图标。

### 测试
- `pnpm check` 0 错误；`pnpm test` 21/21 通过；`pnpm lint` 0 错误；`pnpm build:lib` 成功（sEditor.js 465.75 kB / sEditor.esm.js 688.63 kB）。

---

## [2.3.3] - 2026-07-19

### 变更
- **工具栏默认展示全部按钮**：新增配置项 `toolbarResponsive?: boolean`，默认 `false`。默认行为改为全部按钮直接展示（使用 `flex-wrap` 自动换行），不再折叠到「更多 ⋯」下拉菜单。
  - `Toolbar` 构造函数新增第 4 个参数 `responsive = false`；仅在 `responsive === true` 时才渲染「更多」按钮并启用 `ResizeObserver` 折叠逻辑。
  - `EditorConfig` / `index.d.ts` 同步新增 `toolbarResponsive?: boolean` 类型声明。
  - 若需要恢复之前的响应式折叠行为，创建编辑器时传入 `toolbarResponsive: true` 即可。

### 测试
- `pnpm check` 0 错误；`pnpm test` 21/21 通过；`pnpm lint` 0 错误；`pnpm build:lib` 成功（sEditor.js 457.13 kB / sEditor.esm.js 677.92 kB）；`pnpm dev` 预览确认工具栏全部按钮直接可见，无「更多」下拉。

---

## [2.3.2] - 2026-07-19

### 修复
- **暗色主题下浮层/菜单背景仍为白色**（v2.3.0/v2.3.1 遗留）：多个组件直接使用 Tailwind `bg-white`，在 `.se-dark` 模式下不会随 CSS 变量变化。统一改为 `bg-se-canvas`：
  - `Toolbar` 的 dropdown panel / 「更多」面板
  - `SlashMenu` 命令面板
  - `ContextMenu` 右键菜单
  - `LinkBubble` 链接编辑浮层
  - `TableBubble` 表格浮动工具栏
  - `DialogManager` 对话框壳
  - `SourceView` 源码编辑 textarea
  - `src/index.css` 补充 `.se-dark .bg-se-canvas` 兜底规则。
- **copy / cut 命令兼容性兜底无效**：`document.execCommand("copy")` / `document.execCommand("cut")` 在没有选中文本时不会复制内容。在 `src/editor/commands/definitions.ts` 和 `src/seditor/context-menu.ts` 中增加 `fallbackCopyToClipboard` 辅助函数，通过创建临时 textarea、选中文本后再执行 copy。
- **导出下载 DOM 移除不安全**：`exporter.ts` 中 `downloadBlob` 使用 `document.body.removeChild(a)`，若 body 状态异常可能抛错；改为 `a.remove()`。
- **theme: "auto" 不监听系统主题变化**：`SEditor.applyTheme` 仅在初始化时判断 `prefers-color-scheme`，切换到 auto 后不会跟随系统变化。改为 `matchMedia.addEventListener("change", ...)` 动态监听，并在 `destroy()` 中清理。
- **Ctrl+F 全局拦截 root 内所有输入框**：`SEditor` 的 keydown 监听在 `root` 上，导致对话框内的链接地址输入框、查找替换输入框等按 Ctrl+F 时也被拦截。改为仅在 ProseMirror 编辑区域（`editor.view.dom`）获得焦点时才打开查找替换对话框。
- **响应式工具栏 ResizeObserver loop 警告**：`Toolbar.setupResponsive` 同步调用 `relayout()` 触发布局变更，浏览器报 `ResizeObserver loop completed with undelivered notifications`。改为 `requestAnimationFrame` 延迟 relayout，并妥善清理 rafId。

### 测试
- `pnpm check` 0 错误；`pnpm test` 21/21 通过；`pnpm lint` 0 错误；`pnpm build:lib` 成功（sEditor.js 457.03 kB / sEditor.esm.js 677.73 kB）；`pnpm dev` 浏览器无错误/无 ResizeObserver 警告。

---

## [2.3.1] - 2026-07-19

### 修复
- **响应式工具栏折叠失效**（v2.3.0 引入）：`.se-toolbar-overflow-hidden` CSS 类未在任何样式表中定义，导致 `relayout()` 给 group 加该类后无视觉效果，响应式折叠功能实际失效。在 `src/index.css` 补充 `.se-toolbar-overflow-hidden { display: none !important; }`。
- **/ 命令面板破坏文档结构**（v2.3.0 引入）：`SlashMenu.execute` 中 `deleteRange({ from: this.slashPos - 1, to: sel })` 多减了 1。`slashPos = $from.before($from.depth) + 1` 已是段落内 `/` 字符前的位置，再 -1 会跨越段落 opening tag，破坏 ProseMirror 文档结构。改为 `from: this.slashPos`。
- **「更多」面板点击 dropdown 项崩溃**（v2.3.0 引入）：响应式折叠隐藏含 dropdown 的 group 后，「更多 ⋯」面板遍历 `groupConfigs` 时未跳过 `type === "dropdown"` 的项，导致 `cfg.command` 为 `undefined`，`handleCommand(undefined!)` 调用 `commandRegistry.run(editor, undefined)` 崩溃。增加 dropdown / 缺 command 的过滤。
- **SlashMenu 定位在 jsdom/极端布局下抛错**（v2.3.0 引入）：`position()` 直接调用 `editor.view.coordsAtPos()`，在 jsdom（无 `getClientRects`）或极端布局下会抛 `target.getClientRects is not a function`，导致整个 SlashMenu 不可用。加 try/catch 兜底，坐标计算失败时菜单保持默认位置，不影响命令执行。

### 测试
- 新增回归用例：`SlashMenu 回归 > execute 删除 / 前缀后文档结构完整，命令正常执行` —— 直接实例化 SlashMenu，验证 execute 删除 `/` 前缀后文档结构完整（段落转为 h1，无残留 `/`）。
- `pnpm check` 0 错误；`pnpm test` 21/21 通过；`pnpm lint` 0 错误；`pnpm build:lib` 成功（sEditor.js 456.32 kB / sEditor.esm.js 676.73 kB）。

---

## [2.3.0] - 2026-07-19

### 新增
- **导出 PDF/Word/Markdown**：新增 `exporter.ts` 模块，提供三套导出能力：
  - **Markdown**：内置轻量 HTML → Markdown 转换器（基于 `DOMParser` 递归遍历），覆盖 h1-h6/p/strong/em/del/code/pre/ul/ol/li/blockquote/hr/a/img/table/video/audio 等常见节点，无第三方依赖。
  - **Word**：生成 `application/msword` MIME 的 `.doc` 文件，内嵌 Microsoft Office 命名空间 HTML，Word/WPS 可直接打开。
  - **PDF**：新窗口写入打印专用 HTML 并调用 `window.print()`，由用户选择「另存为 PDF」；自动屏蔽弹窗拦截。
  - 工具栏新增「导出」下拉菜单（Markdown / Word / PDF 三项），通过 `window.dispatchEvent(new CustomEvent("seditor:exec"))` 跨组件分发到 `SEditor.exec()` 路由。
  - 实例 API：`exportMarkdown(filename?)` / `exportWord(filename?)` / `exportPDF(filename?)`；亦可通过 `exec("__export_md__" | "__export_word__" | "__export_pdf__")` 触发。
- **/ 命令面板**：新增 `slash-menu.ts` 模块，在段落行首输入 `/` 时弹出命令菜单（标题/正文/列表/引用/代码块/分割线/表格），支持关键词过滤、方向键导航、回车执行、ESC 关闭、点击外部关闭；执行前自动删除 `/` 前缀字符。
- **暗色主题样式完善**：`src/index.css` 新增 `.se-dark` 范围内的 CSS 变量覆盖（border/divider/bar-bg/hover/active/primary/ink/sub/faint/canvas/page），并对 `bg-white`/`bg-se-bar`/`text-se-*`/`border-se-border` 等 Tailwind 工具类用 `!important` 兜底；暗色模式下代码块、引用、表头分别调整为深色配色。
- **工具栏运行时可配置显隐**：`Toolbar` 新增 `setItemVisible(id, visible)` / `setGroupVisible(groupIndex, visible)` API，运行时可动态隐藏/显示工具栏项或整组。
- **响应式工具栏折叠**：`Toolbar` 新增 `setupResponsive()` + `relayout()`，用 `ResizeObserver` 监听工具栏宽度，溢出时从末尾向前给 group 加 `se-toolbar-overflow-hidden` 类，并显示「更多 ⋯」按钮；点击「更多」打开面板，列出所有被响应式隐藏的 group 中的项。

### 变更
- `SEditorOptions` / `EditorConfig` 已在 2.2.0 引入 `theme` 字段；本版本完善对应样式。
- `SEditorInstance` 接口新增 `exportMarkdown` / `exportWord` / `exportPDF` / `clearDraft` / `hasRestoredDraft`。
- `SEditor` 新增 `slashMenu` 成员，并在 `destroy()` 中清理；新增 `seditor:exec` 事件监听，用于工具栏跨组件触发导出伪命令。
- `Toolbar` 新增 `groupEls` / `groupConfigs` / `moreWrap` / `hiddenItemIds` 成员；构造函数调用 `setupResponsive()`；`build()` 给每个 group 加 `se-toolbar-group` 类并记录到 `groupEls/groupConfigs`，末尾新增「更多 ⋯」按钮（默认 hidden）；`handleCommand` 追加 export 伪命令分支，通过 `window.dispatchEvent` 分发；`buildDropdownPanel` 追加 `kind === "export"` 分支调 `buildExportPanel`；`updateDropdownLabel` 追加 `kind === "export"` 返回 "导出"。

### 测试
- `pnpm check` 0 错误（strict）；`pnpm test` 20/20 通过；`pnpm lint` 0 错误；`pnpm build:lib` 成功（sEditor.js 456.29 kB / sEditor.esm.js 676.66 kB）。

---

## [2.2.0] - 2026-07-19

### 新增
- **Markdown 快捷输入**：新增 `MarkdownShortcuts` 扩展，补充内联 Markdown 标记（`**bold**`/`__bold__`/`*italic*`/`_italic_`/`~~strike~~`/`` `code` ``），块级 Markdown（`#`/`-`/`>`/`---`/` ``` `）由 StarterKit 提供。
- **粘贴为纯文本**：工具栏新增「粘贴为纯文本」按钮（`pastePlainText` 命令），仅插入剪贴板的纯文本内容，丢弃所有格式。
- **拖拽上传**：编辑器拖入图片/文件时，自动调用 `imageUpload` / `fileUpload` 上传并插入；未配置上传函数则交由浏览器默认行为。
- **粘贴图片上传**：粘贴剪贴板中的图片（如截图）时，自动调用 `imageUpload` 上传并插入到光标处。
- **视频/音频插入**：新增 `Video` / `Audio` TipTap 扩展（`<video controls>` / `<audio controls>`，atom 不可编辑，draggable 可拖动），工具栏新增「视频」「音频」按钮，对话框支持网络地址与本地上传（复用 `fileUpload`）。
- **Emoji 表情选择器**：新增 Emoji 对话框，分「表情/手势/动物/食物/物品」5 组常用 Emoji，点击即插入。
- **查找与替换**：新增「查找与替换」对话框，支持查找下一个 / 替换当前 / 全部替换 / 区分大小写；定位匹配并滚动到选区。`Ctrl+F` / `Cmd+F` 快捷键打开。
- **自动保存草稿**：新增 `draftKey` / `draftInterval` 配置项，启用后定时将 HTML 内容写入 `localStorage`，下次加载自动恢复；`beforeunload` 同步保存；提供 `clearDraft()` / `hasRestoredDraft()` 实例 API。
- **字数统计扩展**：状态栏新增「段落」「阅读」显示（阅读时长按 300 字/分钟估算）。
- **暗色主题基础**：`EditorConfig` 新增 `theme` 字段（`light` / `dark` / `auto`），`auto` 跟随系统 `prefers-color-scheme`；`SEditor` 根节点根据主题切换 `se-dark` 类名。
- **新增图标**：`pasteText` / `emoji` / `search` / `replace` / `video` / `audio` / `save` / `history`。

### 变更
- `EditorConfig` 新增 `draftKey` / `draftInterval` / `theme` 字段。
- `DialogType` 联合类型增加 `"video"` / `"audio"` / `"emoji"` / `"findReplace"`。
- `WordCount` 新增 `paragraphs` / `readingTime` 字段。
- `MediaOptions` 新增类型，用于 video/audio 命令。
- `buildExtensions` 数组追加 `MarkdownShortcuts` / `Video` / `Audio`。
- `SEditor` 新增 `imageUploadFn` / `fileUploadFn` / `imageMaxSizeBytes` 成员；`editorProps` 新增 `handlePaste` / `handleDrop` 拦截器；构造函数新增草稿恢复逻辑、`Ctrl+F` 快捷键监听、`applyTheme` 调用。
- `StatusBar` 新增 `parasEl` / `readingEl` 成员。
- `DIALOG_COMMANDS` 集合追加 `video` / `audio` / `emoji` / `findReplace`。

### 测试
- `pnpm check` 0 错误（strict）；`pnpm test` 20/20 通过（新增 5 个用例：视频插入、音频插入、Emoji 插入、草稿保存、草稿恢复）；`pnpm lint` 0 错误；`pnpm build:lib` 成功（sEditor.js 444.09 kB / sEditor.esm.js 661.08 kB）。

---

## [2.1.0] - 2026-07-19

### 新增
- **复制/剪切/粘贴按钮**：工具栏新增剪贴板组（`copy`/`cut`/`paste` 三个按钮），基于 `navigator.clipboard` API 实现，并对老浏览器降级到 `document.execCommand`。
- **图片拖拽调整大小**：新增 `ResizableImage` 扩展（替代默认 Image），通过自定义 NodeView 在图片右下角添加拖拽手柄，鼠标拖拽按宽度等比例缩放，结果写入 `node.attrs.width`。
- **图片浮动工具栏**：图片 hover 时显示浮动对齐工具栏，提供「左对齐 / 居中 / 右对齐 / 删除」快捷操作。
- **表格浮动工具栏**：新增 `TableBubble` 组件，光标进入表格时在表格上方显示工具栏，提供「上下插入行 / 左右插入列 / 删除行列 / 合并拆分单元格 / 切换表头行 / 删除表格」等操作。
- **链接编辑浮层**：新增 `LinkBubble` 组件，光标位于链接中时在链接下方显示浮层，显示当前 URL（可点击打开），并提供「编辑」「取消链接」按钮。
- **快捷键提示**：所有工具栏按钮的 `title` 都补充了对应的快捷键提示（如「加粗 (Ctrl+B)」「超链接 (Ctrl+K)」），便于发现快捷键。
- **新增图标**：`copy` / `scissors` / `clipboardPaste` / `trash` / `rowTop` / `rowBottom` / `colLeft` / `colRight` / `merge` / `split` / `tableHeader` / `trashTable` / `edit` / `unlink`。

### 变更
- `buildExtensions` 中 `Image` 替换为 `ResizableImage`，保留 `inline: true` / `allowBase64: true` 配置。
- `SEditor` 新增 `tableBubble` / `linkBubble` 成员，并在 `destroy()` 中清理。
- 链接对话框通过 `window.dispatchEvent(new CustomEvent("seditor:open-link-dialog"))` 由 `LinkBubble` 触发，由 `SEditor` 监听后调 `store.openDialog("link")`。

### 测试
- `pnpm check` 0 错误（strict）；`pnpm test` 15/15 通过；`pnpm lint` 0 错误；`pnpm build:lib` 成功（sEditor.js 429.08 kB / sEditor.esm.js 639.92 kB）。

---

## [2.0.6] - 2026-07-19

### 新增
- **多图上传**：图片对话框「本地上传」Tab 支持一次选择多张图片（`imageMultiUpload` 默认 `true`），逐张上传后批量插入到文档中，每张图独立成段并按选定对齐方式排列。可通过 `imageMultiUpload: false` 关闭。
- **文件上传**：新增独立的「文件」对话框与 `fileUpload` 配置项，将任意非黑名单文件作为带 `download` 属性的下载链接插入文档。新增配置项 `fileMaxSize`（默认 20MB）、`fileAllowedExts`（默认 `null` 不限制）。
- **`insertFile` API**：实例新增 `insertFile(src, opts?)` 方法，`opts.download` 默认 `true`，可传 `false` 插入不强制下载的链接。
- **`file` 命令**：`exec('file', { src, name, download })` 路由到命令注册表，可编程式插入下载链接。
- **`DownloadableLink` 扩展**：扩展 TipTap Link 增加 `download` 属性的 `parseHTML`/`renderHTML`，使 `<a download>` 可被正确序列化与反序列化（默认 Link 扩展会丢弃该属性）。
- **工具栏「文件」按钮与 file 图标**：在插入组新增「文件」按钮，点击后弹出文件对话框。
- **后端模板新增 `/api/upload-file` 接口**：5 种后端模板（Node.js / Python / Java / PHP / Go）均补充通用文件上传接口，统一扩展名黑名单（拒绝 .html/.svg/.js/.exe/.php 等 24 类危险文件）+ `FILE_MAX_SIZE`（默认 20MB）+ 响应 `{ url, name }`。PHP 新增独立的 `upload-file.php`。

### 变更
- `EditorConfig` 新增 `imageMultiUpload`、`fileUpload`、`fileMaxSize`、`fileAllowedExts` 字段。
- `DialogType` 联合类型增加 `"file"`。
- `SEditor.exec` 优先路由到 `commandRegistry`（覆盖 `image`/`file`/`link`/`table`/`specialChar` 等自定义命令），未命中再回退 TipTap 原生命令。
- 文档同步：`USAGE.md` 第七章重写为「图片与文件上传」，新增 7.1 多图上传、7.2 文件上传、7.3 接口协议（含图片/文件双接口对照）、7.4 后端模板、7.5 接入示例；`README.md` 特性列表与后端模板章节同步；`server-templates/README.md` 更新接口契约、模板清单、环境变量（新增 `FILE_MAX_SIZE`）、安全特性（新增文件扩展名黑名单）、Nginx `client_max_body_size` 调整为 21m、已知限制新增「无病毒扫描」。
- Java `application.yml`：`spring.servlet.multipart.max-file-size` 由 5MB 调整为 20MB 以支持文件接口；新增 `upload.file-max-size` 配置项。

### 测试
- `smoke.test.ts` 新增 4 个测试用例：
  - `insertFile 应插入文件下载链接`（校验 href、文件名、download 属性）
  - `insertFile download:false 不带 download 属性`
  - `exec('file', ...) 应通过 commandRegistry 路由生效`
  - `多次 insertImage 模拟批量插入应全部生效`（多图上传回归）

---

## [2.0.5] - 2026-07-19

### 文档
- **README.md**：新增「后端接口模板（仅用于测试）」章节，明确 `server-templates/` 下的模板仅用于本地开发与功能联调，不能直接用于正式环境，并列出生产级限制清单。
- **USAGE.md 7.1 接口协议**：扩充为完整的上传图片接口说明，新增鉴权头、响应字段（`url`/`error`）类型与必填说明、后端应做的校验清单（大小/扩展名/magic bytes/随机文件名/速率限制/鉴权）。
- **USAGE.md 7.2 后端模板**：标题改为「后端模板（仅用于测试）」并新增风险提示块；安全特性清单同步至最新（移除 SVG、新增 magic bytes/速率限制/鉴权/安全响应头/临时文件策略）。
- **USAGE.md 7.3 示例**：补充 `UPLOAD_TOKEN` 鉴权配置与 `Authorization` 请求头示例。

---

## [2.0.4] - 2026-07-19

### 安全加固（后端模板）
所有 `server-templates/` 下的上传模板按审计报告统一加固：

- **C1 移除 SVG 出白名单**：SVG 可内嵌 `<script>` 导致存储型 XSS，所有模板不再支持。
- **C2 增加 magic bytes 文件头校验**：读取文件头字节判断真实类型，防伪造扩展名/MIME。
- **C3 PHP 防解析**：新增 `uploads/.htaccess`，禁止 PHP 解析与脚本执行。
- **C4 Python 关闭默认 debug**：`FLASK_DEBUG` 改为环境变量控制，默认 0。
- **C5 Python 流式校验大小**：先 `Content-Length` 早期拒绝，再流式落盘，避免 OOM。

### 高危修复
- **H1 CORS 改为白名单**：所有模板新增 `CORS_ORIGIN` 环境变量，默认 `http://localhost:5173`，不再使用 `*`。
- **H2 Bearer Token 鉴权**：新增 `UPLOAD_TOKEN` 环境变量，留空不鉴权（开发用），配置后强制校验 `Authorization: Bearer <token>`，使用常量时间比较。
- **H3 速率限制**：所有模板内置基于 IP 的内存限流器，默认 10 次/分钟，可通过 `RATE_LIMIT` 配置。
- **H4 Java multipart 配置**：`application.yml` 显式配置 `spring.servlet.multipart.max-file-size`，并加 `MaxUploadSizeExceededException` 全局异常处理返回 413。
- **H5 文件权限**：Java/Go 显式 `setPosixFilePermissions` / `chmod 0640`，仅 owner 可读写。
- **H6 PHP PUBLIC_BASE 改环境变量**：通过 `getenv('PUBLIC_BASE')` 读取。
- **H7 Go uploadDir 改环境变量**：通过 `UPLOAD_DIR` 配置。

### 中危修复
- **M1 安全响应头**：所有模板设置 `X-Content-Type-Options: nosniff` / `X-Frame-Options: DENY` / `Content-Security-Policy: default-src 'none'`。
- **M2 错误信息脱敏**：详细错误入日志，响应给客户端统一模糊信息。
- **M3 结构化日志**：JSON 格式记录 IP/文件名/大小/状态，便于审计。
- **M4 Node.js graceful shutdown**：处理 SIGTERM/SIGINT，等待 in-flight 完成。
- **M5 Java try-with-resources**：`file.getInputStream()` 显式关闭。
- **M6 Java 目录创建校验**：`mkdirs()` 失败抛 IOException，并校验 `isDirectory`。
- **M7 Python secure_filename**：日志中展示前先 sanitize，防日志注入。
- **M8 Go log.Fatalf 替代 panic**：启动失败用结构化日志。

### 低危修复
- **L1 Node.js `import.meta.dirname`**：替代手算 `__dirname`。
- **L4 Go UUID hex 形式**：`hex.EncodeToString(uuid.New()[:])`，32 字符无连字符。
- **L6 Java 浮点显示文件大小**：`%.1fMB` 避免整数除法误导。

### 新增
- `server-templates/java-springboot/application.yml`：Spring Boot 配置文件。
- `server-templates/php/uploads/.htaccess`：Apache 上传目录安全策略。
- `server-templates/README.md`：部署 checklist、环境变量、安全特性、Nginx 反向代理参考。

### 变更
- 所有后端模板统一环境变量名：`HOST`/`PORT`/`UPLOAD_DIR`/`PUBLIC_BASE`/`CORS_ORIGIN`/`UPLOAD_TOKEN`/`MAX_SIZE`/`RATE_LIMIT`。
- 文件落盘策略改为「先写 `tmp_*` 临时文件，校验通过后原子重命名」。

---

## [2.0.3] - 2026-07-19

### 新增
- **图片上传接口完善**：前端增加文件类型校验（`image/*`）、文件大小上限校验（默认 5MB，可通过 `imageMaxSize` 配置）、上传失败展示具体错误信息。
- **多语言后端模板**：`server-templates/` 目录提供 5 种常见后端语言的图片上传接口模板，开箱即用：
  - Node.js (Express + multer)
  - Python (Flask)
  - Java (Spring Boot)
  - PHP（原生，零依赖）
  - Go (Gin)
- **USAGE.md**：补充「7.1 接口协议」「7.2 后端模板」「7.3 示例：接入 Node.js 后端」章节。

### 变更
- `EditorConfig` 新增 `imageMaxSize` 字段（number，单位字节，默认 5MB）。
- 图片上传失败时对话框显示后端返回的具体错误文案（`error` 字段）。

---

## [2.0.2] - 2026-07-19

### 修复（Critical）
- **C1 状态机无限递归**：`UIStore.set` 增加浅相等判断；`DialogManager.close` 仅在确有对话框时回写 store，并抽取 `dispose()` 避免回环。修复前点击「链接/图片/表格/特殊字符/源码/全屏」按钮会栈溢出崩溃。
- **C2 链接文本未设为链接**：链接对话框中填写「链接文本」时，原先 `insertContent` 后选区为空导致 `setLink` 只设置 storedMarks。改为插入后 `setTextSelection` 选中刚插入的文本，再调 `setLink`。
- **C3 npm 包入口配置错误**：`package.json` 新增 `exports` 字段，`import` 解析到新增的 ESM 产物 `dist/sEditor.esm.js`；`require`/Node 命中根目录 `index.js` 占位入口。同步新增 `index.d.ts` 类型声明。
- **C4 版本号不一致**：`index.js` 的 `version` 由 `2.0.0` 同步至 `2.0.2`，与 `package.json` 一致。

### 修复（High）
- **H1 链接协议白名单**：`Link.configure` 新增 `validate`，仅允许 `http(s):/mailto:/tel:/`/相对路径/锚点，拦截 `javascript:`、`data:` 等危险协议。
- **H2 开启 TypeScript strict**：`tsconfig.json` 启用 `strict: true`，并修复 `dom.ts` 事件处理器类型不匹配问题。
- **H3 补充冒烟测试**：新增 `vitest` + `jsdom` 测试环境与 `src/seditor/smoke.test.ts`，覆盖 C1/C2/H1 回归与基础 API。

### 修复（Medium）
- **M1 Indent px/em 混用**：`parseHTML` 改为只识别 `em` 单位，避免把粘贴的 `padding-left: 32px` 误判为 16 级缩进。
- **M2 Indent 在标题中误读段落属性**：命令改为根据光标所在节点类型 `parentType` 读取 indent。
- **M3 fromHTML 空值兜底**：解析不到元素节点时返回空 `span`，避免 NPE。
- **M4 未知对话框名卡死**：`DialogManager.open` 在 shell 为空时主动 `closeDialog()` 重置状态。
- **M5 contextmenu 监听未移除**：抽取 `onCtx` 并在 `destroy` 中显式 `removeEventListener`。

### 修复（Low）
- L1：`tsconfig.json` 移除不存在的 `api` 目录。
- L2：`IndOptions` 拼写更正为 `IndentOptions`。
- L3：移除 `buildDropdownPanel` 中未使用的 `_labelEl` 参数。
- L4：`as 1` 强转改为 `as 1 | 2 | 3 | 4 | 5 | 6`（toolbar 与 definitions 两处）。
- L5：移除 `h("span", ..., [])` 多余空数组参数。
- L6：图片上传失败时 `console.error` 打印真实错误。
- L9：`onStateChange` 参数改用 `EditorUIState` 类型。
- L10：去除 `definitions.ts` 中与 Link 扩展 `HTMLAttributes` 重复的 `rel`。
- L11：移除 `browser-entry.ts` 中无用的 `__create`/`__createAll` 别名导出。

### 变更
- `vite.lib.config.ts`：构建产物由单一 IIFE 改为同时输出 IIFE（`sEditor.js`，内联 CSS）与 ESM（`sEditor.esm.js`），并保留独立 `sEditor.css`。
- `package.json`：`files` 新增 `dist/sEditor.esm.js`、`dist/sEditor.css`、`index.d.ts`、`USAGE.md`；新增 `vitest`/`jsdom` devDependencies；新增 `test`/`test:watch` 脚本。
- `README.md`/`USAGE.md`：npm 包引入示例的样式路径由 `dist/sEditor.js` 改为 `dist/sEditor.css`。

---

## [2.0.0] - 2026-07-19

### 重大变更
- **完全移除 React 依赖**：整个 UI 层从 React 组件重写为原生 JS（DOM API + 事件）。
- **移除 Zustand**：改用轻量发布订阅状态管理（`src/seditor/store.ts`）。
- **移除 lucide-react**：改用内联 SVG 字符串（`src/seditor/icons.ts`）。
- **移除 clsx / tailwind-merge**：改用简化版 `cn` 工具函数。
- **移除 react-router-dom / @vitejs/plugin-react / @types/react 等所有 React 相关依赖**。
- 使用方无需再引入 React UMD，单文件直接可用。

### 新增
- 新增 `src/seditor/` 目录，包含所有原生 JS UI 模块：
  - `SEditor.ts` — 主类，整合 TipTap Editor 与 UI
  - `toolbar.ts` — 工具栏与所有下拉菜单（标题/字体/字号/颜色/高亮/行距）
  - `dialogs.ts` — 链接/图片/表格/特殊字符对话框
  - `context-menu.ts` — 右键菜单（含表格行列操作）
  - `status-bar.ts` — 状态栏与字数统计
  - `source-view.ts` — 源码模式
  - `store.ts` — 轻量发布订阅状态管理
  - `dom.ts` — DOM 工具函数（h、fromHTML、onClickOutside、onEscape）
  - `icons.ts` — 内联 SVG 图标
- 包体积从 453KB（React 外部化版）降至 **410KB**（gzip 128KB），且无需外部 React。

### 变更
- `package.json`：版本升至 2.0.0；移除 react/react-dom/zustand/lucide-react/clsx/tailwind-merge/react-router-dom 等依赖；移除 peerDependencies。
- `vite.lib.config.ts`：移除 @vitejs/plugin-react 插件与 React external 配置。
- `tsconfig.json`：移除 `jsx: react-jsx` 配置。
- `src/browser-entry.ts`：从 React 组件改为原生入口（`create` / `createAll` 函数）。
- 删除所有 `.tsx` 文件、旧 `store.ts`、`hooks/`、`lib/utils.ts`。

### 文档
- 重写 README，移除 React UMD 引入说明，强调无框架依赖。

---

## [1.1.0] - 2026-07-18

### 新增
- 完整的 sEditor 富文本编辑器实现（替代 1.0.x 的骨架占位）。
- 浏览器单文件引入支持：`dist/sEditor.js`（IIFE 格式，内联 TipTap + CSS，约 453KB）。
- React / ReactDOM 外部化：使用方需自行引入 React UMD（`window.React` / `window.ReactDOM`），包体积从 612KB 降至 453KB。
- 运行时配置文件 `sEditor.config.js`，可通过 `window.sEditorConfig` 自定义字体、字号、颜色、行距等。
- `sEditor.create(options)` 创建单个编辑器实例，返回含 `getHTML/setHTML/getText/setText/focus/blur/insertImage/exec/destroy/getEditor` 的 API 对象。
- `sEditor.createAll(selector)` 批量挂载页面上所有 `[data-seditor]` 元素。
- 经典工具栏：加粗/斜体/下划线/删除线、文字颜色、背景高亮、字体、字号、行距、对齐、缩进、列表、引用、代码块、链接、图片、表格、分割线、特殊字符、源码模式、全屏模式、右键菜单、字数统计。

### 变更
- CSS 类名前缀由 `ue-` 统一改为 `se-`。
- Tailwind 颜色命名空间由 `ue` 改为 `se`。
- `package.json` 的 `main` 指向 `dist/sEditor.js`，`files` 新增 `dist/sEditor.js` 与 `sEditor.config.js`。

### 文档
- 重写 README，补充浏览器引入用法、批量挂载、运行时配置、实例 API 表格、技术栈。

---

## [1.0.1] - 2026-07-17

### 变更
- 在 `package.json` 中新增 `files` 字段，明确发布产物清单（`index.js`、`README.md`、`LICENSE`、`CHANGELOG.md`）。
- 将 `CHANGELOG.md` 一并纳入 npm 发布包，便于使用者查看版本历史。

### 文档
- 补充 1.0.1 版本说明。

---

## [1.0.0] - 2026-07-17

### 新增
- 首次发布 `@skywave226/seditor` 包。
- 提供编辑器入口模块 `sEditor`，支持构造函数调用与 `sEditor.create(options)` 工厂方法。
- 暴露 `version` 字段，便于运行时校验版本。
- 兼容 CommonJS (`require`) 与 ES Module (`import default`) 两种引用方式。

### 文档
- 提供 README 简介（老石富文本编辑器）。
- 提供 Apache-2.0 许可证。

### 已知限制
- 当前版本为骨架实现，仅提供入口占位，后续版本将补齐完整编辑器能力（DOM 渲染、工具栏、富文本格式化等）。

---

## 版本号规则
遵循 [语义化版本](https://semver.org/lang/zh-CN/)：
- `MAJOR`：不兼容的 API 变更
- `MINOR`：向下兼容的功能新增
- `PATCH`：向下兼容的缺陷修复
