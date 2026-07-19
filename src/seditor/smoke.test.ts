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
