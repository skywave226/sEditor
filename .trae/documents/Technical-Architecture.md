# 技术架构文档（仿 uEditor 富文本编辑器）

## 1. 架构设计

编辑器采用分层 + 插件化架构，UI 层与编辑内核解耦，工具栏命令通过统一 Command 层驱动编辑器内核。

```mermaid
flowchart TD
    subgraph "UI 层 (React + Tailwind)"
        "工具栏 Toolbar"
        "编辑区容器 EditorFrame"
        "状态栏 StatusBar"
        "弹层/菜单 Dialogs & ContextMenu"
    end
    subgraph "命令层 Command Layer"
        "命令注册表 CommandRegistry"
        "格式命令 FormatCommands"
        "插入命令 InsertCommands"
    end
    subgraph "编辑内核 Editor Core"
        "TipTap Editor 实例"
        "扩展集合 Extensions"
        "Schema 文档模型"
    end
    subgraph "状态与事件 State & Events"
        "选区状态 SelectionState"
        "历史栈 History"
        "事件总线 EventBus"
    end

    "工具栏 Toolbar" --> "命令注册表 CommandRegistry"
    "命令注册表 CommandRegistry" --> "TipTap Editor 实例"
    "TipTap Editor 实例" --> "选区状态 SelectionState"
    "选区状态 SelectionState" --> "状态栏 StatusBar"
    "选区状态 SelectionState" --> "工具栏 Toolbar"
    "弹层/菜单 Dialogs & ContextMenu" --> "命令注册表 CommandRegistry"
```

**设计要点**：

- **内核选型**：采用 [TipTap](https://tiptap.dev)（基于 ProseMirror）作为编辑内核。它 headless、TypeScript 原生支持、扩展机制完善，可让我们专注实现 UEditor 风格的工具栏与功能，而无需从零处理 contenteditable 的兼容性陷阱。
- **UI 解耦**：工具栏、弹窗、菜单全部为受控 React 组件，通过编辑器实例的命令 API 驱动，便于替换主题与按需加载。
- **命令层**：所有格式化与插入操作抽象为命名命令（如 `bold`、`setColor`、`insertImage`），注册到 CommandRegistry，工具栏按钮仅触发命令名，便于扩展与测试。

## 2. 技术说明

| 层级 | 技术 | 说明 |
|------|------|------|
| 语言 | TypeScript 5 | 全量类型，编辑器 API、命令、扩展均为强类型 |
| 构建工具 | Vite 5 | 开发服务器 + 生产构建，ESM 原生 |
| UI 框架 | React 18 | 工具栏、弹窗、菜单等外壳 UI |
| 样式 | Tailwind CSS 3 | 原子化样式，便于还原 UEditor 经典外观 |
| 编辑内核 | @tiptap/core + @tiptap/react + @tiptap/pm | ProseMirror 内核，headless 可控 |
| 内核扩展 | @tiptap/starter-kit 及各独立扩展 | 提供基础节点/标记，按需扩展 |
| 图标 | lucide-react | 线性 SVG 图标，统一风格 |
| 状态管理 | React hooks + Zustand（轻量） | 编辑器状态、工具栏激活态、弹窗开关 |
| 后端 | 无 | 图片上传为可选回调，由宿主提供，默认仅支持 URL 插入 |

**初始化方式**：`npm create vite@latest editor -- --template react-ts`，随后安装 Tailwind、TipTap 等依赖。

## 3. 目录结构

```
src/
├── main.tsx                      # 应用入口
├── App.tsx                       # 编辑器装配
├── editor/
│   ├── Editor.tsx                # 编辑器主容器（工具栏+编辑区+状态栏）
│   ├── core/
│   │   ├── createEditor.ts       # 创建 TipTap 实例与扩展
│   │   ├── extensions.ts         # 扩展注册（节点/标记/插件）
│   │   └── schema.ts             # 文档模型类型定义
│   ├── commands/
│   │   ├── registry.ts           # 命令注册表
│   │   ├── formatCommands.ts     # 加粗/斜体/颜色/对齐等
│   │   └── insertCommands.ts     # 链接/图片/表格/分割线等
│   ├── toolbar/
│   │   ├── Toolbar.tsx           # 工具栏容器
│   │   ├── ToolbarButton.tsx     # 通用按钮
│   │   ├── ToolbarDivider.tsx    # 分组分隔
│   │   ├── dropdowns/            # 字体/字号/颜色/行距/段落下拉
│   │   └── config.ts             # 工具栏分组配置（可定制显隐）
│   ├── editor-frame/
│   │   └── EditorFrame.tsx       # 编辑区容器（含 placeholder、聚焦态）
│   ├── status-bar/
│   │   └── StatusBar.tsx         # 字数统计 + 选区路径
│   ├── dialogs/
│   │   ├── LinkDialog.tsx        # 超链接弹窗
│   │   ├── ImageDialog.tsx       # 图片弹窗
│   │   └── TableDialog.tsx       # 表格弹窗
│   ├── menus/
│   │   └── ContextMenu.tsx       # 右键菜单
│   ├── views/
│   │   ├── SourceView.tsx        # 源码模式（HTML 双向同步）
│   │   └── Fullscreen.tsx        # 全屏模式 HOC
│   ├── hooks/
│   │   ├── useEditorState.ts     # 选区/激活态订阅
│   │   ├── useWordCount.ts       # 字数统计
│   │   └── useDialog.ts          # 弹窗开关
│   ├── store/
│   │   └── editorStore.ts        # Zustand 全局状态
│   └── types/
│       └── index.ts              # 公共类型定义
├── styles/
│   └── editor.css                # 编辑器内容区样式（段落/标题/表格/代码块）
└── icons/
    └── index.ts                  # 图标映射
```

## 4. 核心模块说明

### 4.1 命令注册表

命令为统一抽象，工具栏按钮通过命令名触发，便于扩展：

```ts
// 命令定义类型
interface EditorCommand {
  name: string;
  can: (editor: Editor) => boolean;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor, payload?: unknown) => void;
}

// 注册表示例
class CommandRegistry {
  private commands = new Map<string, EditorCommand>();
  register(cmd: EditorCommand) { this.commands.set(cmd.name, cmd); }
  get(name: string) { return this.commands.get(name); }
  run(editor: Editor, name: string, payload?: unknown) {
    this.commands.get(name)?.run(editor, payload);
  }
}
```

### 4.2 扩展集合（TipTap Extensions）

按 UEditor 功能对应注册扩展：

| UEditor 功能 | TipTap 扩展 |
|--------------|-------------|
| 加粗/斜体/下划线/删除线 | Bold / Italic / Underline / Strike |
| 字体家族 | TextStyle + 自定义 FontFamily 扩展 |
| 字号 | 自定义 FontSize 扩展（TextStyle 派生） |
| 文字颜色/背景色 | Color / Highlight |
| 对齐 | TextAlign |
| 有序/无序列表 | BulletList / OrderedList / ListItem |
| 缩进 | 自定义 Indent 扩展 |
| 标题/引用 | Heading / Blockquote |
| 代码块 | CodeBlockLowlight（可选语法高亮） |
| 分割线 | HorizontalRule |
| 超链接 | Link |
| 图片 | Image（扩展支持宽高/对齐属性） |
| 表格 | Table / TableRow / TableCell / TableHeader |
| 历史 | History（StarterKit 内置） |

### 4.3 编辑器内容模型（Schema 简述）

ProseMirror 文档为节点树，核心节点与标记：

```mermaid
flowchart LR
    "doc 文档" --> "block 段落/标题/引用/代码块/表格"
    "block 段落" --> "inline 文本"
    "inline 文本" --> "mark 加粗/斜体/下划线/颜色/链接"
    "block 表格" --> "tableRow 行"
    "tableRow 行" --> "tableCell 单元格"
    "tableCell 单元格" --> "block 段落"
```

## 5. 数据模型

### 5.1 编辑器对外数据

编辑器以 HTML 为主要序列化格式（与 UEditor 一致），同时支持 JSON（ProseMirror 原生）用于结构化存储。

```ts
// 编辑器公共 API 类型
interface RichEditor {
  getHTML(): string;              // 获取 HTML 内容
  setHTML(html: string): void;    // 设置 HTML 内容
  getJSON(): JSONContent;         // 获取结构化 JSON
  setJSON(json: JSONContent): void;
  getWordCount(): { chars: number; words: number };
  insertImage(src: string, opts?: ImageOptions): void;
  destroy(): void;
}

interface ImageOptions {
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  alt?: string;
}
```

### 5.2 初始化配置

```ts
interface EditorConfig {
  initialContent?: string;          // 初始 HTML
  placeholder?: string;             // 占位文本
  toolbar?: string[] | false;       // 工具栏分组配置，false 隐藏
  height?: number | string;         // 编辑区高度
  imageUpload?: (file: File) => Promise<string>; // 图片上传回调（可选）
  onChange?: (html: string) => void;// 内容变更回调
}
```

## 6. 关键流程实现要点

- **工具栏激活态**：通过 `editor.isActive('bold')` 等订阅选区变化，实时高亮当前生效的格式按钮。
- **字数统计**：监听 `editor.on('update')`，取 `editor.getText()` 计算字符数，去 HTML 标签统计中英文字数。
- **源码模式**：切换时将 `editor.getHTML()` 写入受控 textarea；切回时 `editor.commands.setContent(html)`，保留光标近似位置。
- **全屏模式**：通过 CSS `position: fixed` 全屏容器 + 状态切换，不影响编辑器实例。
- **图片上传**：默认仅支持 URL 插入；若提供 `imageUpload` 回调，弹窗显示「本地上传」Tab，上传后返回 URL 再插入。
- **右键菜单**：监听 `contextmenu`，根据选区所在节点类型（表格/链接/普通文本）动态生成菜单项。

## 7. 不依赖后端服务

本项目为纯前端组件，无后端、无数据库。图片上传为可选宿主回调，默认不启用。所有内容在浏览器内存中处理，可由宿主应用自行持久化。
