# sEditor 使用说明

> 老石富文本编辑器 —— 基于 TypeScript + TipTap 的经典风格所见即所得富文本编辑器，**原生 JS 实现，无框架依赖**。

本文档详细介绍 sEditor 的安装、配置、API、命令系统、事件监听、图片上传自定义、框架集成与常见问题。如果只想快速跑起来，请先看 [README.md](./README.md)。

---

## 目录

- [一、安装](#一安装)
  - [1.1 浏览器单文件引入](#11-浏览器单文件引入)
  - [1.2 npm 包引入](#12-npm-包引入)
- [二、创建编辑器实例](#二创建编辑器实例)
  - [2.1 单个挂载](#21-单个挂载)
  - [2.2 批量挂载](#22-批量挂载)
  - [2.3 选项详解](#23-选项详解)
- [三、运行时配置](#三运行时配置)
  - [3.1 配置字段](#31-配置字段)
  - [3.2 加载时机](#32-加载时机)
  - [3.3 完整示例](#33-完整示例)
- [四、实例 API](#四实例-api)
- [五、命令系统](#五命令系统)
  - [5.1 通过 `exec` 执行命令](#51-通过-exec-执行命令)
  - [5.2 命令清单](#52-命令清单)
- [六、事件监听](#六事件监听)
- [七、图片上传自定义](#七图片上传自定义)
  - [7.1 接口协议](#71-接口协议)
  - [7.2 后端模板](#72-后端模板)
  - [7.3 示例：接入 Node.js 后端](#73-示例接入-nodejs-后端)
- [八、与前端框架集成](#八与前端框架集成)
  - [8.1 React](#81-react)
  - [8.2 Vue 3](#82-vue-3)
  - [8.3 Angular](#83-angular)
- [九、源码模式与全屏模式](#九源码模式与全屏模式)
- [十、右键上下文菜单](#十右键上下文菜单)
- [十一、样式与命名空间](#十一样式与命名空间)
- [十二、常见问题（FAQ）](#十二常见问题faq)

---

## 一、安装

sEditor 提供两种引入方式：浏览器单文件（IIFE）与 npm 包。

### 1.1 浏览器单文件引入

无需任何构建工具，直接在 HTML 中引入 `dist/sEditor.js`（构建产物已内联 TipTap 与 CSS）。

```html
<script src="./dist/sEditor.js"></script>
<script>
  // 全局变量 sEditor 自动挂载
  const editor = sEditor.create({ target: '#editor' });
</script>
```

构建本地产物：

```bash
pnpm install
pnpm build:lib
# 产物：dist/sEditor.js（约 410KB，gzip 约 128KB）
```

### 1.2 npm 包引入

```bash
pnpm add @skywave226/seditor
# 或
npm install @skywave226/seditor
# 或
yarn add @skywave226/seditor
```

```js
import { create } from '@skywave226/seditor';
import '@skywave226/seditor/dist/sEditor.css'; // 引入样式
```

---

## 二、创建编辑器实例

### 2.1 单个挂载

使用 `create(options)` 创建单个实例。`target` 既可以是 CSS 选择器字符串，也可以是 DOM 节点。

```js
const editor = sEditor.create({
  target: '#editor', // 或 document.getElementById('editor')
  initialContent: '<p>hello <strong>sEditor</strong></p>',
  placeholder: '开始写作……',
  height: 400,
  onChange: (html) => {
    console.log('内容变更：', html);
  },
  onEditorReady: (tipTapEditor) => {
    console.log('编辑器已就绪', tipTapEditor);
  },
});
```

### 2.2 批量挂载

通过 `data-seditor` 属性标记挂载点，调用 `createAll()` 一次性挂载：

```html
<div data-seditor data-placeholder="第一处" data-height="300"></div>
<div data-seditor data-placeholder="第二处" data-height="500" data-initial-content="<p>预填内容</p>"></div>

<script src="./dist/sEditor.js"></script>
<script>
  const list = sEditor.createAll();
  // list 是 SEditorInstance 数组，顺序与 DOM 顺序一致
  list[0].setHTML('<p>第一个编辑器</p>');
</script>
```

`data-*` 支持的属性：

| 属性 | 说明 |
| --- | --- |
| `data-placeholder` | 占位提示文字 |
| `data-height` | 编辑区高度（数字，单位 px） |
| `data-initial-content` | 初始 HTML 内容 |

也可传入自定义选择器：

```js
const list = sEditor.createAll('.my-editor');
```

### 2.3 选项详解

`create(options)` 接收一个 `SEditorOptions` 对象，全部字段如下：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `target` | `string \| HTMLElement` | — **必填** | 挂载目标，CSS 选择器或 DOM 节点 |
| `initialContent` | `string` | `''` | 初始 HTML 内容 |
| `placeholder` | `string` | `在此输入正文内容……`（可被 `window.sEditorConfig.placeholder` 覆盖） | 空内容时占位提示 |
| `height` | `number \| string` | `300`（可被 `window.sEditorConfig.height` 覆盖） | 编辑区最小高度，数字为 px |
| `toolbar` | `string[] \| false` | （内部默认） | 工具栏按钮配置（保留字段，当前版本内部固定） |
| `imageUpload` | `(file: File) => Promise<string>` | — | 自定义图片上传函数，返回图片 URL（详见 [七](#七图片上传自定义)） |
| `onChange` | `(html: string) => void` | — | 内容变更回调，参数为最新 HTML |
| `onEditorReady` | `(editor: Editor) => void` | — | 编辑器实例就绪后回调，参数为底层 TipTap Editor 实例 |

示例：

```js
const editor = sEditor.create({
  target: '#editor',
  initialContent: '<p>初始内容</p>',
  placeholder: '请输入...',
  height: 500,
  imageUpload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const json = await res.json();
    return json.url;
  },
  onChange: (html) => saveDraft(html),
  onEditorReady: (ed) => {
    // 可在此注册自定义快捷键、扩展等
    ed.extensionStorage; // ...
  },
});
```

---

## 三、运行时配置

在浏览器场景下，可通过全局变量 `window.sEditorConfig` 自定义字体、字号、颜色、行距等可选项。该机制对 npm 包场景同样适用。

### 3.1 配置字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `fonts` | `{ label: string; value: string }[]` | 字体下拉选项，`value` 为 CSS `font-family` 值，空字符串表示「默认」 |
| `fontSizes` | `{ label: string; value: string }[]` | 字号下拉选项，`value` 为 CSS 字号（如 `14px`） |
| `colors` | `string[]` | 文字颜色色板，每项为颜色字符串 |
| `highlightColors` | `string[]` | 背景高亮色板，`transparent` 表示清除 |
| `lineHeights` | `{ label: string; value: string }[]` | 行距选项 |
| `placeholder` | `string` | 全局默认占位提示（实例 `placeholder` 优先） |
| `height` | `number \| string` | 全局默认高度（实例 `height` 优先） |

### 3.2 加载时机

**必须在引入 `sEditor.js` 之前**设置好 `window.sEditorConfig`：

```html
<!-- 1. 先加载配置 -->
<script src="./sEditor.config.js"></script>
<!-- 2. 再加载编辑器 -->
<script src="./dist/sEditor.js"></script>
```

如果使用 npm 包，则在 `import` 之前设置（或在入口文件最顶部）：

```js
window.sEditorConfig = { /* ... */ };
import { create } from '@skywave226/seditor';
```

### 3.3 完整示例

`sEditor.config.js`：

```js
window.sEditorConfig = {
  fonts: [
    { label: '默认', value: '' },
    { label: '宋体', value: 'SimSun, STSong, serif' },
    { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
  ],
  fontSizes: [
    { label: '默认', value: '' },
    { label: '14', value: '14px' },
    { label: '16', value: '16px' },
    { label: '18', value: '18px' },
    { label: '24', value: '24px' },
  ],
  colors: [
    '#000000', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff8a00', '#ffce00', '#39b54a', '#00a0e9', '#0052d9', '#e9539b',
  ],
  highlightColors: [
    'transparent', '#ffff00', '#ffce00', '#39b54a', '#00a0e9', '#e9539b',
  ],
  lineHeights: [
    { label: '1.0', value: '1' },
    { label: '1.5', value: '1.5' },
    { label: '2.0', value: '2' },
  ],
  placeholder: '请输入正文...',
  height: 360,
};
```

---

## 四、实例 API

`create()` / `createAll()` 返回的实例对象提供以下方法：

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getHTML` | `() => string` | 获取 HTML 内容 |
| `setHTML` | `(html: string) => void` | 设置 HTML 内容（会替换整个文档） |
| `getText` | `() => string` | 获取纯文本内容 |
| `setText` | `(text: string) => void` | 设置纯文本内容 |
| `focus` | `() => void` | 聚焦编辑器 |
| `blur` | `() => void` | 移除焦点 |
| `insertImage` | `(src: string, opts?: { alt?: string; width?: number \| string }) => void` | 在光标处插入图片 |
| `exec` | `(command: string, payload?: unknown) => void` | 执行命令（详见 [五](#五命令系统)） |
| `getEditor` | `() => Editor \| null` | 获取底层 TipTap Editor 实例（销毁后返回 null） |
| `destroy` | `() => void` | 销毁实例，释放 TipTap 与事件监听 |

常用示例：

```js
// 取内容
const html = editor.getHTML();
const text = editor.getText();

// 写内容
editor.setHTML('<p>新内容</p>');
editor.setText('纯文本');

// 插入图片
editor.insertImage('https://example.com/a.png', { alt: '示例', width: 400 });
editor.insertImage('https://example.com/b.png', { width: '100%' });

// 聚焦 / 失焦
editor.focus();
editor.blur();

// 销毁（在 SPA / 框架卸载时务必调用）
editor.destroy();
```

---

## 五、命令系统

sEditor 内置一套命令注册表，覆盖工具栏所有按钮的功能。可通过 `exec(command, payload)` 在代码中调用。

### 5.1 通过 `exec` 执行命令

```js
const editor = sEditor.create({ target: '#editor' });

// 加粗当前选区
editor.exec('bold');

// 设置文字颜色
editor.exec('color', '#ff0000');

// 设置字体
editor.exec('fontFamily', '"Microsoft YaHei", sans-serif');

// 设置字号
editor.exec('fontSize', '18px');

// 插入 H2 标题
editor.exec('heading', 2);

// 设置对齐
editor.exec('alignCenter');

// 设置行距
editor.exec('lineHeight', '1.5');

// 插入表格
editor.exec('table', { rows: 3, cols: 4, withHeader: true });

// 插入链接
editor.exec('link', { href: 'https://example.com', target: '_blank' });

// 插入图片
editor.exec('image', { src: 'https://example.com/a.png', alt: '图', width: 400 });

// 插入特殊字符
editor.exec('specialChar', '★');
```

### 5.2 命令清单

| 命令名 | payload | 说明 |
| --- | --- | --- |
| `undo` | — | 撤销 |
| `redo` | — | 重做 |
| `bold` | — | 加粗（toggle） |
| `italic` | — | 斜体（toggle） |
| `underline` | — | 下划线（toggle） |
| `strike` | — | 删除线（toggle） |
| `removeFormat` | — | 清除所有格式 |
| `color` | `string`（颜色值） | 设置文字颜色 |
| `highlight` | `string`（颜色值，可空） | 设置背景高亮，空则 toggle |
| `fontFamily` | `string`（CSS font-family） | 设置字体，空字符串清除 |
| `fontSize` | `string`（如 `14px`） | 设置字号，空字符串清除 |
| `alignLeft` | — | 左对齐 |
| `alignCenter` | — | 居中对齐 |
| `alignRight` | — | 右对齐 |
| `alignJustify` | — | 两端对齐 |
| `bulletList` | — | 无序列表（toggle） |
| `orderedList` | — | 有序列表（toggle） |
| `indent` | — | 增加缩进 |
| `outdent` | — | 减少缩进 |
| `lineHeight` | `string`（如 `1.5`） | 设置行距 |
| `paragraph` | — | 设为正文段落 |
| `heading` | `number`（1-6） | 设为标题（toggle） |
| `blockquote` | — | 引用块（toggle） |
| `codeBlock` | — | 代码块（toggle） |
| `horizontalRule` | — | 插入分割线 |
| `link` | `{ href: string; target?: '_blank' \| '_self' }` | 设置/取消链接（`href` 为空时取消） |
| `image` | `{ src: string; alt?: string; width?: number \| string }` | 插入图片 |
| `table` | `{ rows: number; cols: number; withHeader?: boolean }` | 插入表格 |
| `specialChar` | `string` | 插入特殊字符或任意文本 |

> 提示：如果只需要工具栏没有提供的「直接通过命令调用」能力，`exec` 是推荐入口。它内部会自动 `focus()` 编辑器再执行。

---

## 六、事件监听

`sEditor` 默认只暴露 `onChange` 回调。如果需要监听更多事件（如选区变化、聚焦、失焦），可通过 `getEditor()` 拿到底层 TipTap `Editor` 实例，使用其事件 API：

```js
const editor = sEditor.create({ target: '#editor' });
const ed = editor.getEditor();

// 内容变更（与 onChange 等价，但可注册多个）
ed.on('update', ({ editor }) => {
  console.log('HTML:', editor.getHTML());
});

// 选区变化（用于自定义工具栏态同步）
ed.on('selectionUpdate', ({ editor }) => {
  console.log('当前是否加粗:', editor.isActive('bold'));
});

// 事务提交
ed.on('transaction', ({ editor }) => {
  // 每次状态变更都会触发，频率较高
});

// 聚焦 / 失焦
ed.on('focus', () => console.log('聚焦'));
ed.on('blur', () => console.log('失焦'));

// 销毁前取消订阅（可选，destroy 会自动清理）
const off = ed.on('update', handler);
// off();  // 手动取消
```

TipTap Editor 完整事件列表（常用）：

| 事件 | 触发时机 |
| --- | --- |
| `update` | 内容变更 |
| `selectionUpdate` | 选区变化 |
| `transaction` | 任何事务（含内容、选区、视图滚动等） |
| `focus` | 编辑器聚焦 |
| `blur` | 编辑器失焦 |
| `create` | 编辑器创建完成 |
| `destroy` | 编辑器销毁 |

> 通过 `onEditorReady` 回调也可拿到 Editor 实例，效果与 `getEditor()` 一致，但更早（在 DOM 挂载完成时就触发）。

---

## 七、图片上传自定义

默认情况下，图片对话框只支持「网络图片」URL 输入。如果需要本地上传，传入 `imageUpload` 函数即可，对话框会自动出现「本地上传」Tab：

```js
const editor = sEditor.create({
  target: '#editor',
  imageUpload: async (file) => {
    // file 是用户选择的 File 对象
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: fd,
      // 视后端要求可加 headers
    });
    const json = await res.json();
    if (!json.url) throw new Error('上传失败');
    return json.url; // 必须返回图片可访问 URL
  },
});
```

行为说明：

- `imageUpload` 必须返回 `Promise<string>`，resolve 值为图片 URL；
- 上传成功后对话框自动切回 URL Tab 并填入返回的 URL，用户可继续设置 alt / 宽度 / 对齐；
- 上传过程中对话框底部会显示「上传中…」；失败时显示具体错误信息；
- 上传完成后并不会立即插入，需用户点「确定」按钮才会插入到文档中。

### 7.1 接口协议

后端接口需满足以下约定（所有后端模板均遵循此协议）：

| 项 | 说明 |
| --- | --- |
| 请求方法 | `POST` |
| Content-Type | `multipart/form-data` |
| 表单字段 | `file`（图片文件） |
| 成功响应 | `{ "url": "https://your-domain/uploads/xxx.png" }` |
| 失败响应 | `{ "error": "错误描述" }`，HTTP 状态码 `4xx` / `5xx` |

前端已有校验：
- 文件类型：仅 `image/*` MIME 类型
- 文件大小：默认 5MB，可通过 `imageMaxSize` 配置（字节数）

### 7.2 后端模板

项目 `server-templates/` 目录提供了常见后端语言的上传接口模板，开箱即用：

| 语言 / 框架 | 路径 | 依赖 |
| --- | --- | --- |
| Node.js (Express) | `server-templates/node-express/upload-server.js` | express、multer、cors |
| Python (Flask) | `server-templates/python-flask/app.py` | Flask、flask-cors |
| Java (Spring Boot) | `server-templates/java-springboot/UploadController.java` | spring-boot-starter-web |
| PHP (原生) | `server-templates/php/upload.php` | 零依赖 |
| Go (Gin) | `server-templates/go-gin/main.go` | gin、google/uuid |

每个模板均包含：
- 图片类型白名单（jpg / png / gif / webp / svg）
- 文件大小限制（默认 5MB）
- 随机文件名（防路径遍历与覆盖）
- CORS 跨域支持
- 静态资源访问

### 7.3 示例：接入 Node.js 后端

```bash
# 启动后端
cd server-templates/node-express
pnpm add express multer cors
node upload-server.js    # 监听 3000 端口
```

```js
const editor = sEditor.create({
  target: '#editor',
  imageMaxSize: 10 * 1024 * 1024, // 10MB
  imageUpload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: fd,
    });
    const json = await res.json();
    if (!res.ok || !json.url) {
      throw new Error(json.error || '上传失败');
    }
    return json.url;
  },
});
```

---

## 八、与前端框架集成

sEditor 本身是原生 JS 实现，挂载点是一个普通 DOM 节点，因此可在任何框架中通过「拿到 DOM 节点 → 调用 `create()` → 在卸载时调用 `destroy()`」的方式集成。下面给出 React、Vue 3、Angular 三种常见用法。

### 8.1 React

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

> 注意：`onChange` 中调用 `setHtml` 不会触发重新初始化，因为 `useEffect` 依赖为空数组。

### 8.2 Vue 3

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

### 8.3 Angular

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

通用集成要点：

1. `target` 既支持选择器字符串（如 `'#editor'`），也支持直接传入 DOM 节点；
2. 框架卸载时务必调用 `destroy()` 以释放 TipTap 实例与事件监听，否则会内存泄漏；
3. SSR 场景下需确保 `create()` 仅在浏览器端调用（放在 `useEffect` / `onMounted` / `ngAfterViewInit` 中即可）；
4. 不要把 sEditor 实例存入响应式状态（如 React `useState`、Vue `ref`），避免框架对它做深度代理。用 `useRef` / 普通局部变量存储即可。

---

## 九、源码模式与全屏模式

工具栏右侧提供两个开关按钮：

- **源码模式**：切换为纯 HTML 编辑视图，可直接修改标签结构。再次点击或按 `Esc` 退出。
- **全屏模式**：编辑器铺满整个浏览器视口（`position: fixed`）。再次点击按钮或按 `Esc` 退出。

无需任何配置即可使用。

---

## 十、右键上下文菜单

在编辑区内右键，会弹出自定义上下文菜单（替代浏览器默认菜单），包含：

- 剪切 / 复制 / 粘贴 / 全选
- 当选区在链接内时：取消链接
- 当选区在表格内时：删除表格

无需配置，自动启用。

---

## 十一、样式与命名空间

sEditor 的 CSS 类名使用 `se-` 前缀以避免与宿主页面冲突，所有 Tailwind 工具类都在构建时编译为静态 CSS 内联到产物中，**运行时无 Tailwind 依赖**。

如需覆盖默认主题色（如主色、边框色），可在引入 `sEditor.js` 后追加 CSS：

```css
:root {
  --se-primary: #0052d9;       /* 主色 */
  --se-border: #e5e7eb;        /* 边框色 */
  --se-bar-bg: #f9fafb;        /* 工具栏背景 */
  --se-hover-bg: #f3f4f6;      /* 悬停背景 */
}
```

> 注意：当前版本主题变量为预留能力，具体生效需以实际 CSS 实现为准。

---

## 十二、常见问题（FAQ）

### Q1：浏览器引入后页面没有显示编辑器？

排查清单：

1. `dist/sEditor.js` 路径是否正确（相对 HTML 文件）；
2. `target` 选择器是否匹配到 DOM 节点（节点在调用 `create` 前必须已存在）；
3. 控制台是否有报错（如 `挂载目标未找到`）。

### Q2：批量挂载 `createAll()` 返回空数组？

- 确认 HTML 中的元素是否带有 `data-seditor` 属性；
- 确认调用 `createAll()` 时这些元素已渲染到 DOM（在对应 `<script>` 标签之前，或在 `DOMContentLoaded` 之后）。

### Q3：`onChange` 触发过于频繁导致性能问题？

可在外部做防抖处理：

```js
let timer;
const editor = sEditor.create({
  target: '#editor',
  onChange: (html) => {
    clearTimeout(timer);
    timer = setTimeout(() => saveDraft(html), 500);
  },
});
```

### Q4：如何获取/设置纯文本而非 HTML？

```js
editor.setText('一段纯文本');
const text = editor.getText();
```

注意：`setText` 会把传入文本作为段落内容覆盖整个文档，不会保留原 HTML 结构。

### Q5：如何插入图片时不弹出对话框？

直接调用 `insertImage`：

```js
editor.insertImage('https://example.com/a.png', { alt: '描述', width: 400 });
```

### Q6：如何在 React / Vue 中拿到 TipTap 原生实例做高级操作？

```js
const ed = editor.getEditor();
// 例如：注册快捷键
ed.setOptions({
  // ...
});
// 例如：手动触发命令链
ed.chain().focus().toggleBold().run();
```

### Q7：SSR（Next.js / Nuxt）下报 `document is not defined`？

sEditor 依赖浏览器 DOM，必须在客户端调用 `create()`：

- **Next.js**：用 `dynamic(() => import('./Editor'), { ssr: false })`；
- **Nuxt 3**：用 `<ClientOnly>` 包裹组件；
- 通用方案：把 `create()` 放在 `useEffect` / `onMounted` / `ngAfterViewInit` 中。

### Q8：如何销毁实例避免内存泄漏？

```js
editor.destroy();
```

销毁后会自动：

- 移除 TipTap Editor 及其事件监听；
- 移除工具栏、状态栏、对话框、右键菜单的事件绑定；
- 从 DOM 中移除编辑器根节点。

在 SPA 路由切换、组件卸载时务必调用。

### Q9：npm 包场景下还需要 `window.sEditorConfig` 吗？

可选。如果你希望全局默认值（如默认字体列表）保持一致，仍然可以设置 `window.sEditorConfig`；如果只想在每个实例单独配置，直接在 `create(options)` 中传入即可，无需全局配置。

### Q10：如何自定义工具栏按钮？

当前 2.x 版本工具栏按钮为内置固定布局，暂不支持外部自定义按钮。如有需求，可通过 `getEditor()` 拿到 TipTap 实例后，在编辑器外部自行渲染按钮并调用 `exec(command)` 实现。

---

## 附录：版本与许可

- 版本：2.0.0（详见 [CHANGELOG.md](./CHANGELOG.md)）
- 许可：Apache-2.0（详见 [LICENSE](./LICENSE)）
- 仓库：
  - GitHub: https://github.com/skywave226/sEditor
  - Gitee: https://gitee.com/tianlang1024/s-editor
