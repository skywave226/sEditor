# sEditor

老石富文本编辑器 —— 基于 TypeScript + TipTap 的经典风格所见即所得富文本编辑器，**原生 JS 实现，无框架依赖**，支持浏览器单文件引入。

> 📖 完整使用文档请见 [USAGE.md](./USAGE.md)（安装、配置、API、命令系统、事件、图片上传、框架集成、FAQ）。

## 特性

- 经典工具栏布局：加粗、斜体、下划线、删除线、文字颜色、背景高亮
- 字体、字号、行距、对齐、缩进
- 有序/无序列表、引用、代码块
- 插入超链接、图片、表格、分割线、特殊字符
- 源码模式与全屏模式
- 右键上下文菜单
- 实时字数统计
- **无 React / Vue / Angular 依赖**，纯原生 JS
- 支持浏览器单文件引入（IIFE 打包，内联 TipTap + CSS）
- 运行时配置（字体/字号/颜色等可通过 `window.sEditorConfig` 自定义）

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（需自行准备 demo 页）
pnpm dev

# 类型检查
pnpm check

# 构建浏览器单文件库（dist/sEditor.js）
pnpm build:lib
```

## 浏览器引入使用

### 1. 单个挂载

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <!-- 可选：加载运行时配置 -->
    <script src="./sEditor.config.js"></script>
    <!-- 引入编辑器（内联了 TipTap + CSS，无 React） -->
    <script src="./dist/sEditor.js"></script>
  </head>
  <body>
    <div id="editor"></div>
    <script>
      const editor = sEditor.create({
        target: '#editor',
        placeholder: '开始写作……',
        height: 400,
        onChange: (html) => console.log(html),
      });
      editor.setHTML('<p>hello <strong>sEditor</strong></p>');
      console.log(editor.getHTML());
    </script>
  </body>
</html>
```

### 2. 批量挂载

通过 `data-seditor` 属性标记挂载点，调用 `createAll()` 一次性挂载：

```html
<div data-seditor data-placeholder="第一处" data-height="300"></div>
<div data-seditor data-placeholder="第二处" data-height="500"></div>

<script src="./sEditor.config.js"></script>
<script src="./dist/sEditor.js"></script>
<script>
  const list = sEditor.createAll();
  list[0].setHTML('<p>第一个编辑器</p>');
</script>
```

### 3. 运行时配置

在引入 `sEditor.js` 之前，加载 `sEditor.config.js`（或自行设置 `window.sEditorConfig`）即可自定义字体、字号、颜色等：

```js
window.sEditorConfig = {
  fonts: [{ label: '宋体', value: 'SimSun, serif' }],
  fontSizes: [{ label: '14', value: '14px' }],
  colors: ['#000000', '#ff0000'],
  highlightColors: ['transparent', '#ffff00'],
  lineHeights: [{ label: '1.5', value: '1.5' }],
  placeholder: '请输入正文',
  height: 360,
};
```

### 4. 实例 API

| 方法 | 说明 |
| --- | --- |
| `getHTML()` | 获取 HTML 内容 |
| `setHTML(html)` | 设置 HTML 内容 |
| `getText()` | 获取纯文本 |
| `setText(text)` | 设置纯文本 |
| `focus()` | 聚焦编辑器 |
| `blur()` | 移除焦点 |
| `insertImage(src, opts?)` | 插入图片 |
| `exec(command, payload?)` | 执行 TipTap 命令 |
| `getEditor()` | 获取底层 TipTap Editor 实例 |
| `destroy()` | 销毁实例 |

## 作为 npm 包引入

```bash
pnpm add @skywave226/seditor
```

```js
import { create } from '@skywave226/seditor';
import '@skywave226/seditor/dist/sEditor.css'; // 引入样式（ESM 产物未内联 CSS）

const editor = create({
  target: '#editor',
  initialContent: '<p>hello</p>',
  placeholder: '开始写作',
  height: 400,
  onChange: (html) => console.log(html),
});
```

> 说明：`package.json` 通过 `exports` 字段将 `import` 解析到 `dist/sEditor.esm.js`（ESM 产物，供打包器消费），`require`/Node 环境会命中根目录 `index.js` 占位入口（调用 `create` 会抛错以避免 SSR 静默失败）。浏览器 `<script>` 直接引入仍使用 `dist/sEditor.js`（IIFE，CSS 已内联）。

## 配合前端框架使用

sEditor 本身是原生 JS 实现，挂载点是一个普通 DOM 节点，因此可以在任何框架中通过「拿到 DOM 节点 → 调用 `create()` → 在卸载时调用 `destroy()`」的方式集成。下面给出 React、Vue 3、Angular 三种常见用法。

### React

```tsx
import { useEffect, useRef, useState } from 'react';
import { create } from '@skywave226/seditor';
import '@skywave226/seditor/dist/sEditor.css';

export default function Editor() {
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReturnType<typeof create> | null>(null);
  const [html, setHtml] = useState('<p>hello</p>');

  useEffect(() => {
    if (!hostRef.current) return;
    instanceRef.current = create({
      target: hostRef.current,
      initialContent: html,
      placeholder: '开始写作',
      height: 400,
      onChange: (next) => setHtml(next),
    });
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
    // 仅在挂载时初始化一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} />;
}
```

### Vue 3

```vue
<template>
  <div ref="hostRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { create } from '@skywave226/seditor';
import '@skywave226/seditor/dist/sEditor.css';

const hostRef = ref<HTMLDivElement>();
let instance: ReturnType<typeof create> | null = null;

onMounted(() => {
  if (!hostRef.value) return;
  instance = create({
    target: hostRef.value,
    initialContent: '<p>hello</p>',
    placeholder: '开始写作',
    height: 400,
    onChange: (html) => console.log(html),
  });
});

onBeforeUnmount(() => {
  instance?.destroy();
  instance = null;
});
</script>
```

### Angular

```ts
// seditor.component.ts
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { create } from '@skywave226/seditor';
import '@skywave226/seditor/dist/sEditor.css';

@Component({
  selector: 'app-seditor',
  template: `<div #host></div>`,
})
export class SEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  private instance: ReturnType<typeof create> | null = null;

  ngAfterViewInit() {
    this.instance = create({
      target: this.host.nativeElement,
      initialContent: '<p>hello</p>',
      placeholder: '开始写作',
      height: 400,
      onChange: (html) => console.log(html),
    });
  }

  ngOnDestroy() {
    this.instance?.destroy();
    this.instance = null;
  }
}
```

> 通用要点：
> - `target` 既支持选择器字符串（如 `'#editor'`），也支持直接传入 DOM 节点；
> - 框架卸载时务必调用 `destroy()` 以释放 TipTap 实例与事件监听；
> - 在 SSR 场景下需确保 `create()` 仅在浏览器端调用（可放在 `useEffect` / `onMounted` / `ngAfterViewInit` 中）。

## 技术栈

- TypeScript 5.8
- TipTap 2.x（ProseMirror）
- Vite 6（库构建）
- Tailwind CSS 3（`se-` 命名空间，仅构建时使用，运行时无依赖）
- **无 React / Vue / Angular / Zustand 等框架**

## 后端接口模板（仅用于测试）

项目在 `server-templates/` 目录提供了 5 种常见后端语言的图片上传接口模板（Node.js / Python / Java / PHP / Go），**仅用于本地开发与功能联调，不能直接用于正式环境**。

> ⚠️ **风险提示**：这些模板虽然已包含类型白名单、magic bytes 校验、速率限制、Bearer Token 鉴权、CORS 白名单等基础安全措施，但仍存在以下限制，**不能等同于生产级服务**：
> - 内存级速率限制（多实例部署失效）
> - 本地磁盘存储（无水平扩展能力、无冗余）
> - 无文件清理机制（磁盘会持续增长）
> - 静态 Bearer Token（非短期 JWT / OAuth2）
> - 无图片处理（压缩/水印/缩略图）
> - 无监控、告警、日志归档

正式环境请使用对象存储（OSS / COS / S3）+ CDN，或自行实现符合公司安全规范的上传服务。完整说明见 [server-templates/README.md](./server-templates/README.md)。

## 架构说明

- `src/seditor/SEditor.ts` — 主类，整合 TipTap Editor 与所有 UI
- `src/seditor/toolbar.ts` — 工具栏与下拉菜单（原生 DOM）
- `src/seditor/dialogs.ts` — 对话框（链接/图片/表格/特殊字符）
- `src/seditor/context-menu.ts` — 右键菜单
- `src/seditor/status-bar.ts` — 状态栏与字数统计
- `src/seditor/source-view.ts` — 源码模式
- `src/seditor/store.ts` — 轻量发布订阅状态管理
- `src/seditor/dom.ts` — DOM 工具函数
- `src/seditor/icons.ts` — 内联 SVG 图标
- `src/editor/core/*` — TipTap 扩展（框架无关）
- `src/editor/commands/*` — 命令注册表（框架无关）

## License

Apache-2.0
