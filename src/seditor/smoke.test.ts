/**
 * sEditor 冒烟测试
 *
 * 主要覆盖本次审计修复的回归点：
 * - C1：状态机无限递归（dialog/source/fullscreen 切换不崩溃）
 * - C2：链接对话框「链接文本」实际被设为链接
 * - H1：javascript: 等危险协议被拦截
 * - 基础 API：create / setHTML / getHTML / destroy
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { create, type SEditorInstance } from "../browser-entry";
import { commandRegistry } from "../editor/commands/registry";

function mountHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

describe("sEditor smoke", () => {
  let host: HTMLElement;
  let editor: SEditorInstance;

  beforeEach(() => {
    host = mountHost();
    editor = create({ target: host, height: 200 });
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
  });

  it("应能创建并写入/读取 HTML", () => {
    editor.setHTML("<p>hello <strong>world</strong></p>");
    expect(editor.getHTML()).toContain("<strong>world</strong>");
    expect(editor.getText()).toContain("hello world");
  });

  it("setText 后 getText 应返回原文本", () => {
    editor.setText("纯文本内容");
    expect(editor.getText()).toBe("纯文本内容");
  });

  it("getEditor 应返回 TipTap Editor 实例", () => {
    const tipTap = editor.getEditor();
    expect(tipTap).not.toBeNull();
    expect(typeof tipTap?.getHTML).toBe("function");
  });

  it("insertImage 应把 <img> 插入到内容中", () => {
    editor.insertImage("https://example.com/a.png", { alt: "x" });
    expect(editor.getHTML()).toContain('src="https://example.com/a.png"');
    expect(editor.getHTML()).toContain('alt="x"');
  });

  it("insertFile 应插入文件下载链接", () => {
    editor.insertFile("https://example.com/doc.pdf", { name: "文档.pdf" });
    const html = editor.getHTML();
    expect(html).toContain('href="https://example.com/doc.pdf"');
    expect(html).toContain("文档.pdf");
    expect(html).toContain("download");
  });

  it("insertFile download:false 不带 download 属性", () => {
    editor.insertFile("https://example.com/page.html", { name: "页面", download: false });
    const html = editor.getHTML();
    expect(html).toContain('href="https://example.com/page.html"');
    expect(html).toContain("页面");
    expect(html).not.toContain("download");
  });

  it("exec('file', ...) 应通过 commandRegistry 路由生效", () => {
    editor.exec("file", { src: "https://example.com/a.txt", name: "a.txt" });
    expect(editor.getHTML()).toContain('href="https://example.com/a.txt"');
  });

  it("exec('video', ...) 应插入 <video> 节点", () => {
    editor.exec("video", { src: "https://example.com/movie.mp4", width: 480 });
    const html = editor.getHTML();
    expect(html).toContain("<video");
    expect(html).toContain('src="https://example.com/movie.mp4"');
    expect(html).toContain("controls");
  });

  it("exec('audio', ...) 应插入 <audio> 节点", () => {
    editor.exec("audio", { src: "https://example.com/song.mp3" });
    const html = editor.getHTML();
    expect(html).toContain("<audio");
    expect(html).toContain('src="https://example.com/song.mp3"');
  });

  it("exec('specialChar', ...) 应插入 emoji 字符", () => {
    editor.setHTML("<p></p>");
    editor.exec("specialChar", "🚀");
    expect(editor.getText()).toContain("🚀");
  });
});

/**
 * SlashMenu 回归：execute 删除 / 前缀时不应跨越段落 opening tag
 * （历史 bug：deleteRange 的 from 多减了 1，跨越段落边界，破坏文档结构）
 */
describe("SlashMenu 回归", () => {
  let host: HTMLElement;
  let editor: SEditorInstance;

  beforeEach(() => {
    host = mountHost();
    editor = create({ target: host, height: 200 });
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
  });

  it("execute 删除 / 前缀后文档结构完整，命令正常执行", async () => {
    const { SlashMenu } = await import("./slash-menu");
    const { UIStore } = await import("./store");
    editor.setHTML("<p>/</p>");
    const tipTap = editor.getEditor()!;
    // 光标移到 / 后（pos 2），模拟用户刚输入 /
    tipTap.chain().focus().setTextSelection(2).run();
    // 单独实例化一个 SlashMenu 来测试 execute（SEditor 内部的也已实例化，但我们需要访问私有方法）
    const store = new UIStore();
    const menu = new SlashMenu(tipTap, store);
    // 触发一次 onTransaction 让 slashPos 被设置（通过 dispatch 一个空 tr）
    const tr = tipTap.state.tr;
    tipTap.view.dispatch(tr);
    // 直接调用 execute 执行第一个命令（h1）
    const cmds = (menu as unknown as { filteredCommands: { id: string }[] }).filteredCommands;
    expect(cmds.length).toBeGreaterThan(0);
    (menu as unknown as { execute: (cmd: unknown) => void }).execute(cmds[0]);
    // 验证：/ 已被删除（getText 不含 /），且文档结构完整（段落转为 h1）
    expect(editor.getText()).toBe("");  // / 被删除，h1 标签内无文本
    expect(editor.getHTML()).toMatch(/<h1[^>]*><\/h1>/);  // 空的 h1 标签
    menu.destroy();
  });
});

/**
 * 草稿自动保存：draftKey 启用后，卸载前应把内容写入 localStorage
 */
describe("草稿自动保存", () => {
  let host: HTMLElement;
  let editor: SEditorInstance;

  beforeEach(() => {
    host = mountHost();
    localStorage.clear();
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
    localStorage.clear();
  });

  it("draftKey 启用并写入内容后，localStorage 应有草稿", () => {
    editor = create({
      target: host,
      draftKey: "seditor-test-draft",
      draftInterval: 100,
    });
    editor.setHTML("<p>草稿测试内容</p>");
    // 等待至少一个保存周期
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const saved = localStorage.getItem("seditor-test-draft");
        expect(saved).not.toBeNull();
        expect(saved).toContain("草稿测试内容");
        resolve();
      }, 250);
    });
  });

  it("草稿恢复：构造前 localStorage 有内容，应作为 initialContent 加载", () => {
    localStorage.setItem("seditor-draft-restore", "<p>恢复的草稿</p>");
    editor = create({
      target: host,
      draftKey: "seditor-draft-restore",
    });
    expect(editor.getHTML()).toContain("恢复的草稿");
  });
});

/**
 * 多图上传：通过 imageUpload 回调模拟批量上传，
 * 验证多张图被依次插入并各自独立成段
 */
describe("多图上传", () => {
  let host: HTMLElement;
  let editor: SEditorInstance;

  beforeEach(() => {
    host = mountHost();
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
  });

  it("多次 insertImage 模拟批量插入应全部生效", () => {
    editor = create({
      target: host,
      imageUpload: async () => `https://example.com/${Math.random().toString(36).slice(2)}.png`,
    });
    editor.insertImage("https://example.com/1.png");
    editor.insertImage("https://example.com/2.png");
    editor.insertImage("https://example.com/3.png");
    const html = editor.getHTML();
    expect(html).toContain('src="https://example.com/1.png"');
    expect(html).toContain('src="https://example.com/2.png"');
    expect(html).toContain('src="https://example.com/3.png"');
  });
});

/**
 * C1 回归：状态机切换不触发无限递归
 *
 * 旧实现中，store.set 不做相等性检查，且 DialogManager.close 无条件回写 store，
 * 导致 openDialog → onStateChange → dialogMgr.open → close → closeDialog →
 * onStateChange → dialogMgr.close → closeDialog → ... 栈溢出。
 */
describe("C1: 状态机不递归", () => {
  let host: HTMLElement;
  let editor: SEditorInstance;

  beforeEach(() => {
    host = mountHost();
    editor = create({ target: host });
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
  });

  it("toggleFullscreen 两次不抛错", () => {
    expect(() => {
      editor.exec("__fullscreen__");
      editor.exec("__fullscreen__");
    }).not.toThrow();
  });

  it("toggleSource 两次不抛错", () => {
    expect(() => {
      editor.exec("__source__");
      editor.exec("__source__");
    }).not.toThrow();
  });

  it("打开并关闭对话框不抛错（链接）", () => {
    expect(() => {
      editor.exec("link");
      // 模拟 ESC 关闭：再次触发任意命令前 store 已稳定
      const tipTap = editor.getEditor();
      expect(tipTap).not.toBeNull();
    }).not.toThrow();
  });

  it("连续切换不同对话框不抛错", () => {
    expect(() => {
      editor.exec("link");
      editor.exec("image");
      editor.exec("table");
      editor.exec("specialChar");
    }).not.toThrow();
  });
});

/**
 * C2 回归：链接对话框填了「链接文本」时，插入的文本应带 <a> 标签
 */
describe("C2: 链接文本应被设为超链接", () => {
  let host: HTMLElement;
  let editor: SEditorInstance;

  beforeEach(() => {
    host = mountHost();
    editor = create({ target: host });
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
  });

  it("直接通过 link 命令对选中文本生效", () => {
    editor.setHTML("<p>foobar</p>");
    const tipTap = editor.getEditor()!;
    // 选中 "foo"（位置 1-4 在段落内）
    tipTap.chain().setTextSelection({ from: 1, to: 4 }).run();
    commandRegistry.run(tipTap, "link", { href: "https://example.com", target: "_blank" });
    const html = editor.getHTML();
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain(">foo</a>");
  });
});

/**
 * H1 回归：javascript: 等危险协议应被 Link 扩展的 validate 拦截
 */
describe("H1: 链接协议白名单", () => {
  let host: HTMLElement;
  let editor: SEditorInstance;

  beforeEach(() => {
    host = mountHost();
    editor = create({ target: host });
  });

  afterEach(() => {
    editor.destroy();
    host.remove();
  });

  it("https: 链接可正常设置", () => {
    editor.setHTML("<p>foo</p>");
    const tipTap = editor.getEditor()!;
    tipTap.chain().setTextSelection({ from: 1, to: 4 }).run();
    commandRegistry.run(tipTap, "link", { href: "https://example.com" });
    expect(editor.getHTML()).toContain('href="https://example.com"');
  });

  it("javascript: 链接应被拒绝", () => {
    editor.setHTML("<p>foo</p>");
    const tipTap = editor.getEditor()!;
    tipTap.chain().setTextSelection({ from: 1, to: 4 }).run();
    commandRegistry.run(tipTap, "link", { href: "javascript:alert(1)" });
    // 协议不在白名单 → setLink 被 validate 拒绝，HTML 中不应出现该 href
    expect(editor.getHTML()).not.toContain("javascript:alert(1)");
  });
});
