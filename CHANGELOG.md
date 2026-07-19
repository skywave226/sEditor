# 更新说明

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
