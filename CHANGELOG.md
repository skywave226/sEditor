# 更新说明

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
